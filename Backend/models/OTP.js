import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },

    code: {
        type: String,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0,
    },
});

otpSchema.index({ email: 1 });

export default mongoose.model("OTP", otpSchema);
