import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import OTP from "../models/OTP.js";

import sendEmail from "../utils/sendEmail.js";
import { serializeUser } from "./userController.js";

// ==========================================
// CONFIG
// ==========================================

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

const OTP_PURPOSES = {
  SIGNUP: "signup",
  PASSWORD_RESET: "password-reset",
};

// ==========================================
// NORMALIZATION
// ==========================================

const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

const normalizeCode = (code = "") =>
  String(code).trim();

// ==========================================
// PASSWORD VALIDATION
// ==========================================

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (password.length > 128) {
    return "Password is too long";
  }

  return null;
};

// ==========================================
// OTP HELPERS
// ==========================================

const generateOTP = () =>
  crypto.randomInt(100000, 1000000).toString();

const hashOTP = (code) =>
  crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

const isExpired = (expiresAt) =>
  !expiresAt ||
  new Date(expiresAt).getTime() <= Date.now();

const findLatestOTP = async (
  email,
  purpose
) =>
  OTP.findOne({
    email,
    purpose,
  })
    .sort({
      createdAt: -1,
    })
    .select("+code +attempts");

// ==========================================
// CREATE OTP
// ==========================================

const createOTP = async ({
  email,
  purpose,
}) => {
  // Remove previous OTPs for the same purpose.
  await OTP.deleteMany({
    email,
    purpose,
  });

  const rawCode = generateOTP();

  const hashedCode =
    hashOTP(rawCode);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MS
  );

  await OTP.create({
    email,
    code: hashedCode,
    purpose,
    attempts: 0,
    expiresAt,
  });

  // Raw code exists only long enough
  // to send it to the user.
  return rawCode;
};

// ==========================================
// VERIFY OTP HELPER
// ==========================================

const verifyStoredOTP = async ({
  email,
  code,
  purpose,
  consume = false,
}) => {
  const otp = await findLatestOTP(
    email,
    purpose
  );

  if (!otp) {
    return {
      valid: false,
      status: 400,
      message:
        "OTP not found or expired",
    };
  }

  // ------------------------------------------
  // Expiration
  // ------------------------------------------

  if (isExpired(otp.expiresAt)) {
    await OTP.deleteOne({
      _id: otp._id,
    });

    return {
      valid: false,
      status: 400,
      message:
        "OTP not found or expired",
    };
  }

  // ------------------------------------------
  // Attempt limit
  // ------------------------------------------

  if (
    otp.attempts >=
    MAX_OTP_ATTEMPTS
  ) {
    await OTP.deleteOne({
      _id: otp._id,
    });

    return {
      valid: false,
      status: 429,
      message:
        "Too many incorrect attempts. Request a new OTP.",
    };
  }

  const suppliedHash =
    hashOTP(code);

  const storedBuffer =
    Buffer.from(
      otp.code,
      "hex"
    );

  const suppliedBuffer =
    Buffer.from(
      suppliedHash,
      "hex"
    );

  let matches = false;

  if (
    storedBuffer.length ===
    suppliedBuffer.length
  ) {
    matches =
      crypto.timingSafeEqual(
        storedBuffer,
        suppliedBuffer
      );
  }

  // ------------------------------------------
  // Incorrect OTP
  // ------------------------------------------

  if (!matches) {
    otp.attempts += 1;

    if (
      otp.attempts >=
      MAX_OTP_ATTEMPTS
    ) {
      await OTP.deleteOne({
        _id: otp._id,
      });

      return {
        valid: false,
        status: 429,
        message:
          "Too many incorrect attempts. Request a new OTP.",
      };
    }

    await otp.save();

    return {
      valid: false,
      status: 400,
      message: "Invalid OTP",
    };
  }

  // ------------------------------------------
  // Consume OTP if requested
  // ------------------------------------------

  if (consume) {
    await OTP.deleteOne({
      _id: otp._id,
    });
  }

  return {
    valid: true,
    otp,
  };
};

// ==========================================
// SIGNUP
// ==========================================

export const signup = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedName =
      String(name || "").trim();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password
    ) {
      return res.status(400).json({
        message:
          "All fields are required",
      });
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        BCRYPT_ROUNDS
      );

    const user =
      await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
      });

    return res.status(201).json({
      message:
        "User registered successfully",

      user: serializeUser(user),
    });
  } catch (error) {
    // Handle duplicate email race.
    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "User already exists",
      });
    }

    console.error(
      "Signup error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !normalizedEmail ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message:
          "Your account has been banned.",
      });
    }

    if (!process.env.JWT_KEY) {
      console.error(
        "JWT_KEY is not configured."
      );

      return res.status(500).json({
        message:
          "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        id:
          user._id.toString(),

        role:
          user.role,
      },

      process.env.JWT_KEY,

      {
        expiresIn: "3d",
      }
    );

    return res.status(200).json({
      message:
        "Login successful",

      token,

      user:
        serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// SEND SIGNUP OTP
// ==========================================

export const sendOTP = async (
  req,
  res
) => {
  try {
    const normalizedEmail =
      normalizeEmail(
        req.body.email
      );

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required",
      });
    }

    // Don't generate signup OTPs for
    // existing accounts.
    const existingUser =
      await User.exists({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User already exists",
      });
    }

    const code =
      await createOTP({
        email:
          normalizedEmail,

        purpose:
          OTP_PURPOSES.SIGNUP,
      });

    try {
      await sendEmail(
        normalizedEmail,
        code,
        "signup"
      );
    } catch (emailError) {
      // Don't leave a usable OTP behind if
      // email delivery failed.
      await OTP.deleteMany({
        email:
          normalizedEmail,

        purpose:
          OTP_PURPOSES.SIGNUP,
      });

      throw emailError;
    }

    return res.status(200).json({
      success: true,

      message:
        "Verification code sent successfully",
    });
  } catch (error) {
    console.error(
      "Send signup OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code",
    });
  }
};

// ==========================================
// VERIFY SIGNUP OTP
// ==========================================

export const verifyOTP = async (
  req,
  res
) => {
  try {
    const normalizedEmail =
      normalizeEmail(
        req.body.email
      );

    const normalizedCode =
      normalizeCode(
        req.body.code
      );

    if (
      !normalizedEmail ||
      !normalizedCode
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Email and OTP are required",
      });
    }

    const result =
      await verifyStoredOTP({
        email:
          normalizedEmail,

        code:
          normalizedCode,

        purpose:
          OTP_PURPOSES.SIGNUP,

        consume: true,
      });

    if (!result.valid) {
      return res
        .status(result.status)
        .json({
          success: false,
          message:
            result.message,
        });
    }

    return res.status(200).json({
      success: true,
      message: "OTP Verified",
    });
  } catch (error) {
    console.error(
      "Verify signup OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword =
  async (req, res) => {
    try {
      const normalizedEmail =
        normalizeEmail(
          req.body.email
        );

      if (!normalizedEmail) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      /*
       * Don't reveal whether an email
       * has an account.
       */
      if (!user) {
        return res.status(200).json({
          message:
            "If an account exists for this email, a verification code has been sent.",
        });
      }

      const code =
        await createOTP({
          email:
            normalizedEmail,

          purpose:
            OTP_PURPOSES.PASSWORD_RESET,
        });

      try {
        await sendEmail(
          normalizedEmail,
          code,
          "forgot-password"
        );
      } catch (emailError) {
        await OTP.deleteMany({
          email:
            normalizedEmail,

          purpose:
            OTP_PURPOSES.PASSWORD_RESET,
        });

        throw emailError;
      }

      return res.status(200).json({
        message:
          "If an account exists for this email, a verification code has been sent.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to process password reset request",
      });
    }
  };

// ==========================================
// VERIFY RESET OTP
// ==========================================

export const verifyResetOTP =
  async (req, res) => {
    try {
      const normalizedEmail =
        normalizeEmail(
          req.body.email
        );

      const normalizedCode =
        normalizeCode(
          req.body.code
        );

      if (
        !normalizedEmail ||
        !normalizedCode
      ) {
        return res.status(400).json({
          message:
            "Email and OTP are required",
        });
      }

      const result =
        await verifyStoredOTP({
          email:
            normalizedEmail,

          code:
            normalizedCode,

          purpose:
            OTP_PURPOSES.PASSWORD_RESET,

          /*
           * Don't consume yet.
           * resetPassword verifies and consumes
           * the OTP again.
           */
          consume: false,
        });

      if (!result.valid) {
        return res
          .status(result.status)
          .json({
            message:
              result.message,
          });
      }

      return res.status(200).json({
        message:
          "OTP verified successfully",
      });
    } catch (error) {
      console.error(
        "Verify reset OTP error:",
        error
      );

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword =
  async (req, res) => {
    try {
      const normalizedEmail =
        normalizeEmail(
          req.body.email
        );

      const normalizedCode =
        normalizeCode(
          req.body.code
        );

      const { password } =
        req.body;

      if (
        !normalizedEmail ||
        !normalizedCode ||
        !password
      ) {
        return res.status(400).json({
          message:
            "All fields are required",
        });
      }

      const passwordError =
        validatePassword(password);

      if (passwordError) {
        return res.status(400).json({
          message:
            passwordError,
        });
      }

      /*
       * Verify OTP first but don't consume
       * until the password has actually
       * been updated.
       */
      const result =
        await verifyStoredOTP({
          email:
            normalizedEmail,

          code:
            normalizedCode,

          purpose:
            OTP_PURPOSES.PASSWORD_RESET,

          consume: false,
        });

      if (!result.valid) {
        return res
          .status(result.status)
          .json({
            message:
              result.message,
          });
      }

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (!user) {
        /*
         * Clean up the OTP even if the account
         * disappeared after OTP creation.
         */
        await OTP.deleteOne({
          _id:
            result.otp._id,
        });

        return res.status(400).json({
          message:
            "Unable to reset password",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          BCRYPT_ROUNDS
        );

      user.password =
        hashedPassword;

      await user.save();

      // OTP becomes permanently unusable
      // after successful password reset.
      await OTP.deleteOne({
        _id:
          result.otp._id,
      });

      return res.status(200).json({
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };