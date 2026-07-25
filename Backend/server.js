import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import multer from "multer";
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

// Load environment variables
dotenv.config();

// Connect MongoDB
await connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

// API Routes
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


// ================================
// SOCKET.IO
// ================================

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // User joins a specific group chat room
    socket.on("join-group", (groupId) => {

        socket.join(groupId);

        console.log(
            `User ${socket.id} joined group ${groupId}`
        );
    });


    // User sends a message
    socket.on("send-message", (data) => {

        const { groupId, message } = data;

        // Send message to everyone in this group
        io.to(groupId).emit("receive-message", message);

    });


    // User disconnects
    socket.on("disconnect", () => {

        console.log("User disconnected:", socket.id);

    });

});


// ================================
// SERVER
// ================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
