import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js";
import sendEmail from "../utils/sendEmail.js";
import { serializeUser } from "./userController.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeCode = (code = "") => String(code).trim();
const isExpired = (expiresAt) =>
  !expiresAt || new Date(expiresAt).getTime() <= Date.now();

const findLatestOTP = async (email) =>
  OTP.findOne({ email }).sort({ expiresAt: -1 });

// Signup Controller
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// OTP
export const sendOTP = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OTP.deleteMany({ email: normalizedEmail });

    const otp = await OTP.create({
      email: normalizedEmail,
      code,
      expiresAt,
    });
    const savedOTP = await OTP.findById(otp._id).lean();

    if (!savedOTP) {
      throw new Error("OTP could not be saved");
    }

    console.log("[sendOTP] Stored signup OTP", {
      email: normalizedEmail,
      otpId: otp._id.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    await sendEmail(normalizedEmail, code, "signup");

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedCode = normalizeCode(req.body.code);

    if (!normalizedEmail || !normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otp = await findLatestOTP(normalizedEmail);

    if (!otp) {
      console.warn("[verifyOTP] OTP not found", {
        email: normalizedEmail,
      });

      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (isExpired(otp.expiresAt)) {
      await OTP.deleteOne({ _id: otp._id });

      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (normalizeCode(otp.code) !== normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await OTP.deleteOne({ _id: otp._id });

    res.status(200).json({
      success: true,
      message: "OTP Verified",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OTP.deleteMany({ email: normalizedEmail });

    const otp = await OTP.create({
      email: normalizedEmail,
      code,
      expiresAt,
    });
    const savedOTP = await OTP.findById(otp._id).lean();

    if (!savedOTP) {
      throw new Error("OTP could not be saved");
    }

    console.log("[forgotPassword] Stored reset OTP", {
      email: normalizedEmail,
      otpId: otp._id.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    await sendEmail(normalizedEmail, code, "forgot-password");

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyResetOTP = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedCode = normalizeCode(req.body.code);

    if (!normalizedEmail || !normalizedCode) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const otp = await findLatestOTP(normalizedEmail);

    if (!otp || isExpired(otp.expiresAt)) {
      if (otp?._id) {
        await OTP.deleteOne({ _id: otp._id });
      }

      return res.status(400).json({
        message: "OTP expired or not found",
      });
    }

    if (normalizeCode(otp.code) !== normalizedCode) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedCode = normalizeCode(req.body.code);
    const { password } = req.body;

    if (!normalizedEmail || !normalizedCode || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const otp = await findLatestOTP(normalizedEmail);

    if (!otp || isExpired(otp.expiresAt)) {
      if (otp?._id) {
        await OTP.deleteOne({ _id: otp._id });
      }

      return res.status(400).json({
        message: "OTP expired or not found",
      });
    }

    if (normalizeCode(otp.code) !== normalizedCode) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();
    await OTP.deleteOne({ _id: otp._id });

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
