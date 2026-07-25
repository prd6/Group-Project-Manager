import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  clearGroupChat,
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// Get all chat messages of a group
router.get("/:groupId", authMiddleware, getMessages);

// Send a message to a group
router.post("/:groupId", authMiddleware, sendMessage);

// Clear all chat messages of a group
router.delete("/:groupId/clear", authMiddleware, clearGroupChat);

// Edit a single message
router.patch("/:groupId/:messageId", authMiddleware, editMessage);

// Soft delete a single message
router.delete("/:groupId/:messageId", authMiddleware, deleteMessage);

export default router;
