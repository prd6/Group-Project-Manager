import express from "express";
import rateLimit from "express-rate-limit";

import {
  signup,
  login,
  sendOTP,
  verifyOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// ==========================================
// RATE LIMITERS
// ==========================================

// Login brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    message:
      "Too many login attempts. Please try again later.",
  },
});

// OTP sending protection
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    message:
      "Too many OTP requests. Please try again later.",
  },
});

// OTP verification protection
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    message:
      "Too many verification attempts. Please try again later.",
  },
});

// Signup protection
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    message:
      "Too many signup attempts. Please try again later.",
  },
});

// ==========================================
// SIGNUP / LOGIN
// ==========================================

router.post(
  "/signup",
  signupLimiter,
  signup
);

router.post(
  "/login",
  loginLimiter,
  login
);

// ==========================================
// SIGNUP OTP
// ==========================================

router.post(
  "/send-otp",
  otpSendLimiter,
  sendOTP
);

router.post(
  "/verify-otp",
  otpVerifyLimiter,
  verifyOTP
);

// ==========================================
// PASSWORD RESET
// ==========================================

router.post(
  "/forgot-password",
  otpSendLimiter,
  forgotPassword
);

router.post(
  "/verify-reset-otp",
  otpVerifyLimiter,
  verifyResetOTP
);

router.post(
  "/reset-password",
  otpVerifyLimiter,
  resetPassword
);

export default router;