import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js";
import sendEmail from "../utils/sendEmail.js";
import { serializeUser } from "./userController.js";

// Signup Controller
// Signup Controller
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
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

    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // CheckBAN
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await sendEmail(email, code, "signup");

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
        const { email, code } = req.body;

        const otp = await OTP.findOne({ email });

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP not found or expired",
            });
        }

        if (otp.code !== code) {
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Generate 6-digit OTP
        const code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Remove previous OTPs
        await OTP.deleteMany({ email });

        // Save OTP
        await OTP.create({
            email,
            code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        // Send Email
        await sendEmail(email, code, "forgot-password");

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
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        const otp = await OTP.findOne({ email });

        if (!otp) {
            return res.status(400).json({
                message: "OTP expired or not found",
            });
        }

        if (otp.code !== code) {
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
        const { email, code, password } = req.body;

        if (!email || !code || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // Check OTP
        const otp = await OTP.findOne({ email });

        if (!otp) {
            return res.status(400).json({
                message: "OTP expired or not found",
            });
        }

        if (otp.code !== code) {
            return res.status(400).json({
                message: "Invalid OTP",
            });
        }

        // Find User
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update Password
        user.password = hashedPassword;

        await user.save();

        // Delete OTP
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
