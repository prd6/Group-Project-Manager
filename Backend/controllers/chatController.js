import Chat from "../models/Chat.js";

// SEND CHAT MESSAGE
export const sendMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            });
        }

        const chat = await Chat.create({
            group: groupId,
            sender: req.user.id,
            content: content.trim(),
        });

        const populatedChat = await Chat.findById(chat._id)
            .populate("sender", "name email");

        return res.status(201).json({
            success: true,
            chat: populatedChat,
        });

    } catch (error) {
        console.error("Send chat error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};


// GET GROUP CHAT MESSAGES
export const getMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        const chats = await Chat.find({
            group: groupId,
        })
            .populate("sender", "name email")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            chats,
        });

    } catch (error) {
        console.error("Get chat error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load messages",
        });
    }
};