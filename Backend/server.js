import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Load environment variables
dotenv.config();

// Connect MongoDB
connectDB();

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
app.use("/api/groups", groupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);


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