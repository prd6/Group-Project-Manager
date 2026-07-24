import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    sendMessage,
    getMessages,
} from "../controllers/chatController.js";

const router = express.Router();

// Get all chat messages of a group
router.get("/:groupId", authMiddleware, getMessages);

// Send a message to a group
router.post("/:groupId", authMiddleware, sendMessage);

export default router;