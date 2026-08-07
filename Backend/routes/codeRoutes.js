import express from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  runCode,
} from "../controllers/codeController.js";

const router = express.Router();

const codeRunLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many code execution requests. Please try again later.",
  },
});

router.post(
  "/run",
  authMiddleware,
  codeRunLimiter,
  runCode
);

export default router;
