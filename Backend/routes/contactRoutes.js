import express from "express";

import {
    sendContactMessage,
    getContactMessages,
    getContactMessage,
    markContactAsRead,
    markContactAsUnread,
    deleteContactMessage,
} from "../controllers/contactController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// PUBLIC
router.post("/", sendContactMessage);

// ADMIN
router.get(
    "/admin",
    authMiddleware,
    adminMiddleware,
    getContactMessages
);

router.get(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    getContactMessage
);

router.patch(
    "/admin/:id/read",
    authMiddleware,
    adminMiddleware,
    markContactAsRead
);

router.patch(
    "/admin/:id/unread",
    authMiddleware,
    adminMiddleware,
    markContactAsUnread
);

router.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    deleteContactMessage
);

export default router;