import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getProfile,
  removeProfilePicture,
  updateProfile,
  updateProfilePicture,
  uploadProfilePictureMiddleware,
  viewProfilePicture,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, updateProfile);
router.patch(
  "/profile-picture",
  authMiddleware,
  uploadProfilePictureMiddleware,
  updateProfilePicture
);
router.delete("/profile-picture", authMiddleware, removeProfilePicture);
router.get("/profile-picture/:fileId", viewProfilePicture);

export default router;
