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

dotenv.config();

await connectDB();

const app = express();
const server = http.createServer(app);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File is too large. Maximum file size is 1 MB.",
      });
    }

    return res.status(400).json({
      message: error.message || "File upload failed",
    });
  }

  if (error) {
    console.error(error);

    return res.status(error.status || 500).json({
      message: error.message || "Server Error",
    });
  }

  next();
});

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

setIO(io);
app.set("io", io);

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers.authorization || "";

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice(7);
  }

  return "";
};

const getSocketErrorPayload = (error) => ({
  success: false,
  message: error?.message || "Socket operation failed",
});

const joinAuthorizedGroupRoom = async (socket, groupId) => {
  const { group } = await getAuthorizedGroup(groupId, socket.data.user.id);
  const normalizedGroupId = group._id.toString();
  const nextRoom = getGroupRoom(normalizedGroupId);
  const previousRoom = socket.data.activeGroupRoom;

  if (previousRoom && previousRoom !== nextRoom) {
    socket.leave(previousRoom);
  }

  socket.join(nextRoom);
  socket.data.activeGroupId = normalizedGroupId;
  socket.data.activeGroupRoom = nextRoom;

  return normalizedGroupId;
};

io.use((socket, next) => {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    socket.data.user = {
      id: decoded.id,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "user:", socket.data.user?.id);

  socket.on(SOCKET_EVENTS.GROUP_JOIN, async (groupId, acknowledgment) => {
    try {
      const joinedGroupId = await joinAuthorizedGroupRoom(socket, groupId);

      socket.emit(SOCKET_EVENTS.GROUP_JOINED, {
        groupId: joinedGroupId,
      });

      acknowledgment?.({
        success: true,
        groupId: joinedGroupId,
      });
    } catch (error) {
      acknowledgment?.(getSocketErrorPayload(error));
    }
  });

  socket.on(SOCKET_EVENTS.GROUP_LEAVE, (groupId, acknowledgment) => {
    const normalizedGroupId =
      groupId?.toString?.() || socket.data.activeGroupId || "";
    const roomName = normalizedGroupId
      ? getGroupRoom(normalizedGroupId)
      : socket.data.activeGroupRoom;

    if (roomName) {
      socket.leave(roomName);
    }

    if (roomName && roomName === socket.data.activeGroupRoom) {
      delete socket.data.activeGroupId;
      delete socket.data.activeGroupRoom;
    }

    acknowledgment?.({
      success: true,
      groupId: normalizedGroupId,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
