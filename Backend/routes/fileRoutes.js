import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

import {
  uploadFile,
  getFiles,
  viewFile,
  downloadFile,
  deleteFile,
} from "../controllers/fileController.js";

const router = express.Router();

// Upload File
router.post(
  "/upload/:groupId",
  authMiddleware,
  upload.single("file"),
  uploadFile
);

// View File (Preview)
router.get("/view/:fileId", viewFile);

// Download File
router.get("/download/:fileId", downloadFile);

// Get All Files of a Group
router.get(
  "/:groupId",
  authMiddleware,
  getFiles
);

// Delete File
router.delete(
  "/:fileId",
  authMiddleware,
  deleteFile
);

export default router;