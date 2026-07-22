import express from "express";
import {
    signup,
    login,
    sendOTP,
    verifyOTP,
} from "../controllers/authController.js";

const router = express.Router();

// Signup Route
router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;