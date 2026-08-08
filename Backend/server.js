import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import multer from "multer";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import {
  registerInteractiveCodeRunner,
} from "./services/pistonInteractiveService.js";

import { getAuthorizedGroup } from "./utils/groupAccess.js";

import {
  getGroupRoom,
  setIO,
  SOCKET_EVENTS,
} from "./utils/socket.js";

// ==========================================
// ENVIRONMENT
// ==========================================

const PORT = Number(process.env.PORT) || 5000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

const isProduction =
  NODE_ENV === "production";

const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173";

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================

const requiredEnvironmentVariables = [
  "JWT_KEY",
];

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    console.error(
      `Missing required environment variable: ${variable}`
    );

    process.exit(1);
  }
}

// ==========================================
// DATABASE
// ==========================================

try {
  await connectDB();
} catch (error) {
  console.error(
    "Failed to connect to MongoDB:",
    error
  );

  process.exit(1);
}

// ==========================================
// EXPRESS
// ==========================================

const app = express();

const server =
  http.createServer(app);

// ==========================================
// TRUST PROXY
// ==========================================

/*
 * Required when Express runs behind Nginx,
 * Render, Railway, a load balancer, etc.
 *
 * This is particularly important for
 * express-rate-limit because req.ip must
 * represent the real client.
 */
if (isProduction) {
  app.set("trust proxy", 1);
}

// ==========================================
// SECURITY HEADERS
// ==========================================

app.use(
  helmet({
    /*
     * This API serves profile pictures/files,
     * so disabling CORP avoids Helmet blocking
     * legitimate cross-origin asset rendering.
     *
     * CORS still controls API access.
     */
    crossOriginResourcePolicy: false,
  })
);

// ==========================================
// CORS
// ==========================================

const corsOptions = {
  origin: clientOrigin,

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(
  cors(corsOptions)
);

// ==========================================
// BODY PARSING
// ==========================================

/*
 * Your normal JSON API should never need
 * enormous request bodies.
 *
 * Files use multipart/multer separately.
 */
app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
  })
);

// ==========================================
// REMOVE EXPRESS SIGNATURE
// ==========================================

app.disable("x-powered-by");

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  const databaseReady =
    mongoose.connection.readyState === 1;

  return res.status(
    databaseReady ? 200 : 503
  ).json({
    success: databaseReady,

    status:
      databaseReady
        ? "ok"
        : "degraded",
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/community",
  communityRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);

app.use(
  "/api/groups",
  groupRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/files",
  fileRoutes
);

app.use(
  "/api/code",
  codeRoutes
);

// ==========================================
// API 404
// ==========================================

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
);

// ==========================================
// EXPRESS ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {


    if (error?.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        message: "This file type is not allowed.",
      });
    }

    // ------------------------------------------
    // MULTER
    // ------------------------------------------

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          success: false,

          message:
            "File is too large.",
        });
      }

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "File upload failed",
      });
    }

    // ------------------------------------------
    // JSON BODY TOO LARGE
    // ------------------------------------------

    if (
      error?.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,

        message:
          "Request body is too large",
      });
    }

    // ------------------------------------------
    // INVALID JSON
    // ------------------------------------------

    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      "body" in error
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid JSON body",
      });
    }

    // ------------------------------------------
    // GENERIC ERROR
    // ------------------------------------------

    console.error(
      "Express error:",
      error
    );

    const status =
      error.status || 500;

    return res.status(status).json({
      success: false,

      message:
        status < 500
          ? error.message
          : "Server Error",
    });
  }
);

// ==========================================
// SOCKET.IO
// ==========================================

const io =
  new Server(server, {
    cors: {
      origin:
        clientOrigin,

      methods: [
        "GET",
        "POST",
      ],

      credentials:
        true,
    },
  });

// Make Socket.IO available to services.
setIO(io);

// Also available through Express.
app.set("io", io);

// ==========================================
// GET SOCKET JWT
// ==========================================

const getSocketToken = (
  socket
) => {
  const authToken =
    socket.handshake.auth?.token;

  if (
    typeof authToken === "string" &&
    authToken.trim()
  ) {
    return authToken.trim();
  }

  const authorizationHeader =
    socket.handshake.headers
      .authorization || "";

  const [
    scheme,
    token,
  ] =
    authorizationHeader
      .trim()
      .split(/\s+/);

  if (
    scheme?.toLowerCase() ===
      "bearer" &&
    token
  ) {
    return token;
  }

  return "";
};

// ==========================================
// SOCKET ERROR PAYLOAD
// ==========================================

const getSocketErrorPayload = (
  error
) => ({
  success: false,

  message:
    error?.status &&
    error.status < 500
      ? error.message
      : "Socket operation failed",
});

// ==========================================
// JOIN AUTHORIZED GROUP
// ==========================================

const joinAuthorizedGroupRoom =
  async (
    socket,
    groupId
  ) => {
    /*
     * getAuthorizedGroup performs another
     * membership check before room access.
     */
    const { group } =
      await getAuthorizedGroup(
        groupId,
        socket.data.user.id
      );

    const normalizedGroupId =
      group._id.toString();

    const nextRoom =
      getGroupRoom(
        normalizedGroupId
      );

    const previousRoom =
      socket.data
        .activeGroupRoom;

    // Leave the previous active group.
    if (
      previousRoom &&
      previousRoom !== nextRoom
    ) {
      await socket.leave(
        previousRoom
      );
    }

    await socket.join(
      nextRoom
    );

    socket.data.activeGroupId =
      normalizedGroupId;

    socket.data.activeGroupRoom =
      nextRoom;

    return normalizedGroupId;
  };

// ==========================================
// SOCKET AUTHENTICATION
// ==========================================

io.use(
  async (
    socket,
    next
  ) => {
    try {
      const token =
        getSocketToken(
          socket
        );

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_KEY
        );

      if (!decoded?.id) {
        return next(
          new Error(
            "Invalid token"
          )
        );
      }

      // ----------------------------------------
      // CHECK CURRENT DATABASE USER
      // ----------------------------------------

      const user =
        await User.findById(
          decoded.id
        ).select(
          "_id role isBanned"
        );

      if (!user) {
        return next(
          new Error(
            "User account no longer exists"
          )
        );
      }

      if (user.isBanned) {
        return next(
          new Error(
            "Account banned"
          )
        );
      }

      /*
       * Never trust the role stored in an
       * old JWT. Use the current DB role.
       */
      socket.data.user = {
        id:
          user._id.toString(),

        role:
          user.role,
      };

      if (!isProduction) {
        console.log(
          "Socket authenticated:",
          user._id.toString()
        );
      }

      return next();
    } catch (error) {
      if (
        error.name ===
        "TokenExpiredError"
      ) {
        return next(
          new Error(
            "Session expired"
          )
        );
      }

      if (
        error.name ===
          "JsonWebTokenError" ||
        error.name ===
          "NotBeforeError" ||
        error.name ===
          "CastError"
      ) {
        return next(
          new Error(
            "Invalid token"
          )
        );
      }

      console.error(
        "Socket authentication failed:",
        error
      );

      return next(
        new Error(
          "Authentication failed"
        )
      );
    }
  }
);

// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on(
  "connection",
  (socket) => {
    if (!isProduction) {
      console.log(
        "Socket connected:",
        socket.id,
        "User:",
        socket.data.user?.id
      );
    }

    // ========================================
    // JOIN GROUP
    // ========================================

    registerInteractiveCodeRunner(socket);

    socket.on(
      SOCKET_EVENTS.GROUP_JOIN,

      async (
        groupId,
        acknowledgment
      ) => {
        try {
          const joinedGroupId =
            await joinAuthorizedGroupRoom(
              socket,
              groupId
            );

          socket.emit(
            SOCKET_EVENTS.GROUP_JOINED,
            {
              groupId:
                joinedGroupId,
            }
          );

          acknowledgment?.({
            success: true,

            groupId:
              joinedGroupId,
          });
        } catch (error) {
          console.error(
            "Socket group join failed:",
            error.message
          );

          acknowledgment?.(
            getSocketErrorPayload(
              error
            )
          );
        }
      }
    );

    // ========================================
    // LEAVE GROUP
    // ========================================

    socket.on(
      SOCKET_EVENTS.GROUP_LEAVE,

      async (
        groupId,
        acknowledgment
      ) => {
        try {
          const normalizedGroupId =
            groupId?.toString?.() ||
            socket.data
              .activeGroupId ||
            "";

          const roomName =
            normalizedGroupId
              ? getGroupRoom(
                  normalizedGroupId
                )
              : socket.data
                  .activeGroupRoom;

          if (roomName) {
            await socket.leave(
              roomName
            );
          }

          if (
            roomName &&
            roomName ===
              socket.data
                .activeGroupRoom
          ) {
            delete socket.data
              .activeGroupId;

            delete socket.data
              .activeGroupRoom;
          }

          acknowledgment?.({
            success: true,

            groupId:
              normalizedGroupId,
          });
        } catch (error) {
          console.error(
            "Socket group leave failed:",
            error
          );

          acknowledgment?.({
            success: false,

            message:
              "Failed to leave group",
          });
        }
      }
    );

    // ========================================
    // SOCKET ERRORS
    // ========================================

    socket.on(
      "error",
      (error) => {
        console.error(
          "Socket error:",
          socket.id,
          error
        );
      }
    );

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on(
      "disconnect",
      (reason) => {
        if (!isProduction) {
          console.log(
            "Socket disconnected:",
            socket.id,
            "Reason:",
            reason
          );
        }
      }
    );
  }
);

// ==========================================
// SOCKET.IO ENGINE ERRORS
// ==========================================

io.engine.on(
  "connection_error",
  (error) => {
    console.error(
      "Socket.IO engine connection error:",
      error.message
    );
  }
);

// ==========================================
// START SERVER
// ==========================================

server.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Environment: ${NODE_ENV}`
    );

    console.log(
      `Allowed frontend origin: ${clientOrigin}`
    );
  }
);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

let isShuttingDown = false;

const gracefulShutdown =
  async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(
      `${signal} received. Shutting down...`
    );

    /*
     * Stop accepting new HTTP/Socket
     * connections first.
     */
    server.close(
      async (error) => {
        if (error) {
          console.error(
            "HTTP server shutdown error:",
            error
          );
        }

        try {
          await mongoose.connection.close();

          console.log(
            "MongoDB connection closed"
          );
        } catch (dbError) {
          console.error(
            "MongoDB shutdown error:",
            dbError
          );
        }

        process.exit(
          error ? 1 : 0
        );
      }
    );

    /*
     * Don't allow a broken connection to keep
     * the process alive forever.
     */
    setTimeout(() => {
      console.error(
        "Forced server shutdown"
      );

      process.exit(1);
    }, 10_000).unref();
  };

process.on(
  "SIGTERM",
  () =>
    gracefulShutdown(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    gracefulShutdown(
      "SIGINT"
    )
);

// ==========================================
// PROCESS-LEVEL FAILURES
// ==========================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled promise rejection:",
      error
    );

    gracefulShutdown(
      "unhandledRejection"
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",
      error
    );

    gracefulShutdown(
      "uncaughtException"
    );
  }
);
