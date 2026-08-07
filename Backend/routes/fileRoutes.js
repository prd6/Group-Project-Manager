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
import {
  updateFile,
} from "../controllers/codeController.js";

const router = express.Router();

// ==========================================
// FILE UPLOAD
// ==========================================

router.post(
  "/upload/:groupId",
  authMiddleware,
  upload.single("file"),
  uploadFile
);

// ==========================================
// FILE PREVIEW
// ==========================================

router.get(
  "/view/:fileId",
  authMiddleware,
  viewFile
);

// ==========================================
// FILE DOWNLOAD
// ==========================================

router.get(
  "/download/:fileId",
  authMiddleware,
  downloadFile
);

// ==========================================
// GROUP FILES
// ==========================================

router.get(
  "/:groupId",
  authMiddleware,
  getFiles
);

// ==========================================
// FILE DELETE
// ==========================================

router.delete(
  "/:fileId",
  authMiddleware,
  deleteFile
);

router.patch(
  "/:fileId",
  authMiddleware,
  updateFile
);

export default router;
