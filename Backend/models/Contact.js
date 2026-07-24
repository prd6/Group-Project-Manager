import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
        },
    },
    {
        timestamps: true,
    }
);

const Contact = mongoose.model(
    "Contact",
    contactSchema
);

export default Contact;