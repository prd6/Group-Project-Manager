import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  removeProfilePicture,
  uploadProfilePictureMiddleware,
  viewProfilePicture,
} from "../controllers/userController.js";

const router = express.Router();

// ==========================================
// PROFILE
// ==========================================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

// ==========================================
// PROFILE PICTURE
// ==========================================

router.patch(
  "/profile-picture",
  authMiddleware,
  uploadProfilePictureMiddleware,
  updateProfilePicture
);

router.delete(
  "/profile-picture",
  authMiddleware,
  removeProfilePicture
);

// Public endpoint so avatars can be rendered
// without requiring an Authorization header.
router.get(
  "/profile-picture/:fileId",
  viewProfilePicture
);

export default router;