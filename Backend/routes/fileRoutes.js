import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
import { viewFile } from "../controllers/fileController.js";
import {
  uploadFile,
  getFiles,
} from "../controllers/fileController.js";

const router = express.Router();

router.post(
  "/upload/:groupId",
  authMiddleware,
  upload.single("file"),
  uploadFile
);

router.get("/view/:fileId", viewFile);

router.get(
  "/:groupId",
  authMiddleware,
  getFiles
);

export default router;