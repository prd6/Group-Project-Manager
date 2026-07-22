import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
import { uploadFile } from "../controllers/fileController.js";

const router = express.Router();

router.post(
  "/upload/:groupId",
  authMiddleware,
  upload.single("file"),
  uploadFile
);

export default router;