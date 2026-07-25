import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    createGroup,
    joinGroup,
    getMyGroups,
    getSingleGroup,
    deleteGroup,
    leaveGroup,
    removeMember,
} from "../controllers/groupController.js";

const router = express.Router();

// Create Group
router.post("/create", authMiddleware, createGroup);

// Join Group
router.post("/join", authMiddleware, joinGroup);

// Get My Groups
router.get("/my-groups", authMiddleware, getMyGroups);

// Get Single Group
router.get("/:id", authMiddleware, getSingleGroup);

// Leave Group
router.delete("/:id/leave", authMiddleware, leaveGroup);

// Remove Member (Owner Only)
router.delete(
    "/:id/remove/:memberId",
    authMiddleware,
    removeMember
);

// Delete Group
router.delete("/:id", authMiddleware, deleteGroup);

export default router;