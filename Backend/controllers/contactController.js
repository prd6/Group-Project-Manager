import Contact from "../models/Contact.js";

// ==========================================
// PUBLIC - SEND MESSAGE
// ==========================================

export const sendContactMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanMessage = message.trim();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid name.",
            });
        }

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email.",
            });
        }

        if (cleanMessage.length < 5) {
            return res.status(400).json({
                success: false,
                message: "Message is too short.",
            });
        }

        const contact = await Contact.create({
            name: cleanName,
            email: cleanEmail,
            message: cleanMessage,
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully!",
            contactId: contact._id,
        });
    } catch (error) {
        console.error("Send contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message.",
        });
    }
};

// ==========================================
// ADMIN - GET ALL MESSAGES
// ==========================================

export const getContactMessages = async (req, res) => {
    try {
        const messages = await Contact.find()
            .sort({ createdAt: -1 });

        const unreadCount = await Contact.countDocuments({
            status: "unread",
        });

        return res.status(200).json({
            success: true,
            count: messages.length,
            unreadCount,
            messages,
        });
    } catch (error) {
        console.error("Get contact messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load messages.",
        });
    }
};

// ==========================================
// ADMIN - GET SINGLE MESSAGE
// ==========================================

export const getContactMessage = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load message.",
        });
    }
};

// ==========================================
// ADMIN - MARK AS READ
// ==========================================

export const markContactAsRead = async (req, res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status: "read",
            },
            {
                new: true,
            }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update message.",
        });
    }
};

// ==========================================
// ADMIN - MARK AS UNREAD
// ==========================================

export const markContactAsUnread = async (req, res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status: "unread",
            },
            {
                new: true,
            }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update message.",
        });
    }
};

// ==========================================
// ADMIN - DELETE MESSAGE
// ==========================================

export const deleteContactMessage = async (req, res) => {
    try {
        const message = await Contact.findByIdAndDelete(
            req.params.id
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete message.",
        });
    }
};