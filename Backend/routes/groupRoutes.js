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

// ==========================================
// CREATE / JOIN
// ==========================================

router.post(
  "/create",
  authMiddleware,
  createGroup
);

router.post(
  "/join",
  authMiddleware,
  joinGroup
);

// ==========================================
// GET GROUPS
// ==========================================

router.get(
  "/my-groups",
  authMiddleware,
  getMyGroups
);

router.get(
  "/:id",
  authMiddleware,
  getSingleGroup
);

// ==========================================
// MEMBERS
// ==========================================

router.delete(
  "/:id/leave",
  authMiddleware,
  leaveGroup
);

router.delete(
  "/:id/remove/:memberId",
  authMiddleware,
  removeMember
);

// ==========================================
// DELETE GROUP
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  deleteGroup
);

export default router;