import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    // Store HASHED OTP here, never the raw OTP.
    code: {
      type: String,
      required: true,
      select: false,
    },

    // Prevent a signup OTP from being used
    // for password reset and vice versa.
    purpose: {
      type: String,
      required: true,
      enum: ["signup", "password-reset"],
    },

    // Limit brute-force OTP attempts.
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Fast lookup for the latest OTP for a
// particular email + purpose.
otpSchema.index({
  email: 1,
  purpose: 1,
  createdAt: -1,
});

const OTP =
  mongoose.models.OTP ||
  mongoose.model("OTP", otpSchema);

export default OTP;