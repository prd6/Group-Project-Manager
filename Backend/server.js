import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import multer from "multer";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

import { getAuthorizedGroup } from "./utils/groupAccess.js";

import {
  getGroupRoom,
  setIO,
  SOCKET_EVENTS,
} from "./utils/socket.js";

// ========================================
// ENVIRONMENT
// ========================================

dotenv.config();

// ========================================
// DATABASE
// ========================================

await connectDB();

// ========================================
// EXPRESS
// ========================================

const app = express();
const server = http.createServer(app);

const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173";

// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

app.use(express.json());

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

// ========================================
// API 404
// ========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ========================================
// EXPRESS ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message:
          "File is too large. Maximum file size is 1 MB.",
      });
    }

    return res.status(400).json({
      message:
        error.message ||
        "File upload failed",
    });
  }

  if (error) {
    console.error("Express error:", error);

    return res
      .status(error.status || 500)
      .json({
        message:
          error.message ||
          "Server Error",
      });
  }

  next();
});

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: clientOrigin,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
    ],

    credentials: true,
  },
});

// Make Socket.IO available to chatService
setIO(io);

// Also available through Express if needed
app.set("io", io);

// ========================================
// GET SOCKET JWT
// ========================================

const getSocketToken = (socket) => {
  const authToken =
    socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader =
    socket.handshake.headers.authorization ||
    "";

  if (
    authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return authorizationHeader.slice(7);
  }

  return "";
};

// ========================================
// SOCKET ERROR RESPONSE
// ========================================

const getSocketErrorPayload = (
  error
) => ({
  success: false,

  message:
    error?.message ||
    "Socket operation failed",
});

// ========================================
// JOIN AUTHORIZED GROUP
// ========================================

const joinAuthorizedGroupRoom =
  async (socket, groupId) => {
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
      socket.data.activeGroupRoom;

    // Leave previous group if user changed groups
    if (
      previousRoom &&
      previousRoom !== nextRoom
    ) {
      console.log(
        `🚪 Leaving previous room: ${previousRoom}`
      );

      socket.leave(previousRoom);
    }

    // Join new room
    await socket.join(nextRoom);

    socket.data.activeGroupId =
      normalizedGroupId;

    socket.data.activeGroupRoom =
      nextRoom;

    return normalizedGroupId;
  };

// ========================================
// SOCKET AUTHENTICATION
// ========================================

io.use((socket, next) => {
  try {
    const token =
      getSocketToken(socket);

    if (!token) {
      console.log(
        "❌ Socket rejected: no token"
      );

      return next(
        new Error(
          "Authentication required"
        )
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_KEY
    );

    socket.data.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log(
      "🔐 Socket authenticated:",
      decoded.id
    );

    return next();
  } catch (error) {
    console.error(
      "❌ Socket authentication failed:",
      error.message
    );

    return next(
      new Error("Invalid token")
    );
  }
});

// ========================================
// SOCKET CONNECTION
// ========================================

io.on("connection", (socket) => {
  console.log("");
  console.log(
    "🟢 Socket connected"
  );

  console.log(
    "Socket ID:",
    socket.id
  );

  console.log(
    "User ID:",
    socket.data.user?.id
  );

  // ======================================
  // JOIN GROUP
  // ======================================

  socket.on(
    SOCKET_EVENTS.GROUP_JOIN,

    async (
      groupId,
      acknowledgment
    ) => {
      try {
        console.log("");
        console.log(
          "📥 Group join requested"
        );

        console.log(
          "User:",
          socket.data.user.id
        );

        console.log(
          "Group:",
          groupId
        );

        const joinedGroupId =
          await joinAuthorizedGroupRoom(
            socket,
            groupId
          );

        const room =
          getGroupRoom(
            joinedGroupId
          );

        console.log(
          `✅ User ${socket.data.user.id} joined ${room}`
        );

        console.log(
          "Socket rooms:",
          [...socket.rooms]
        );

        // Tell frontend that join succeeded
        socket.emit(
          SOCKET_EVENTS.GROUP_JOINED,
          {
            groupId:
              joinedGroupId,
          }
        );

        // Socket.IO acknowledgement
        acknowledgment?.({
          success: true,
          groupId:
            joinedGroupId,
        });
      } catch (error) {
        console.error(
          "❌ GROUP JOIN FAILED"
        );

        console.error(
          "User:",
          socket.data.user?.id
        );

        console.error(
          "Group:",
          groupId
        );

        console.error(
          "Reason:",
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

  // ======================================
  // LEAVE GROUP
  // ======================================

  socket.on(
    SOCKET_EVENTS.GROUP_LEAVE,

    (
      groupId,
      acknowledgment
    ) => {
      const normalizedGroupId =
        groupId?.toString?.() ||
        socket.data.activeGroupId ||
        "";

      const roomName =
        normalizedGroupId
          ? getGroupRoom(
              normalizedGroupId
            )
          : socket.data
              .activeGroupRoom;

      if (roomName) {
        socket.leave(roomName);

        console.log(
          `🚪 User ${socket.data.user.id} left ${roomName}`
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
    }
  );

  // ======================================
  // SOCKET ERRORS
  // ======================================

  socket.on("error", (error) => {
    console.error(
      "❌ Socket error:",
      socket.id,
      error
    );
  });

  // ======================================
  // DISCONNECT
  // ======================================

  socket.on(
    "disconnect",
    (reason) => {
      console.log("");
      console.log(
        "🔴 Socket disconnected"
      );

      console.log(
        "Socket ID:",
        socket.id
      );

      console.log(
        "User:",
        socket.data.user?.id
      );

      console.log(
        "Reason:",
        reason
      );
    }
  );
});

// ========================================
// SOCKET.IO ENGINE ERRORS
// ========================================

io.engine.on(
  "connection_error",
  (error) => {
    console.error(
      "❌ Socket.IO engine connection error:",
      error.message
    );
  }
);

// ========================================
// SERVER
// ========================================

const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `Socket.IO ready on port ${PORT}`
  );

  console.log(
    `Allowed frontend origin: ${clientOrigin}`
  );
});