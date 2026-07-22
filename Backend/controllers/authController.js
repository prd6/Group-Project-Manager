import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js";
import sendEmail from "../utils/sendEmail.js";

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
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

        await sendEmail(
            email,
            "Email Verification Code",
            `
            <h2>Group Project Manager</h2>
            <p>Your verification code is:</p>

            <h1>${code}</h1>

            <p>This code will expire in 5 minutes.</p>
            `
        );

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