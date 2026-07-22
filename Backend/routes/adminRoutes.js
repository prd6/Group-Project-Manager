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
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  dashboard
);

// Get all users
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.put(
  "/users/:id/ban",
  authMiddleware,
  adminMiddleware,
  toggleBanUser
);

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  deleteUser
);

router.put(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  editUser
);

// Groups

router.get(
    "/groups",
    authMiddleware,
    adminMiddleware,
    getAllGroups
);

router.delete(
    "/groups/:id",
    authMiddleware,
    adminMiddleware,
    deleteGroup
);

export default router;