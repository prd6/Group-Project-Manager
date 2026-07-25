import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  dashboard,
  getAllUsers,
  toggleBanUser,
  deleteUser,
  editUser,
  getAllGroups,
  deleteGroup,
  getFiles,
} from "../controllers/adminController.js";

const router = express.Router();

// ==========================================
// ALL ADMIN ROUTES ARE PROTECTED
// ==========================================

router.use(authMiddleware);
router.use(adminMiddleware);

// ==========================================
// DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  dashboard
);

// ==========================================
// USERS
// ==========================================

router.get(
  "/users",
  getAllUsers
);

router.put(
  "/users/:id/ban",
  toggleBanUser
);

router.put(
  "/users/:id",
  editUser
);

router.delete(
  "/users/:id",
  deleteUser
);

// ==========================================
// GROUPS
// ==========================================

router.get(
  "/groups",
  getAllGroups
);

router.delete(
  "/groups/:id",
  deleteGroup
);

// ==========================================
// FILES
// ==========================================

router.get(
  "/files",
  getFiles
);

export default router;