import express from "express";
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

// Signup Route
router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

export default router;