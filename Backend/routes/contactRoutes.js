import express from "express";

import {
    sendContactMessage,
    getPublicFeedback,
    getContactMessages,
    getContactMessage,
    markContactAsRead,
    markContactAsUnread,
    deleteContactMessage,
    updateContactDisplayStatus,
} from "../controllers/contactController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// PUBLIC
router.post("/", sendContactMessage);
router.get("/feedback", getPublicFeedback);

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

router.patch(
    "/admin/:id/display",
    authMiddleware,
    adminMiddleware,
    updateContactDisplayStatus
);

router.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    deleteContactMessage
);

export default router;
