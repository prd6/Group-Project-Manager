import User from "../models/User.js";
import Group from "../models/Group.js";
import File from "../models/file.js";

export const getCommunityStats = async (req, res) => {
    try {
        const users = await User.countDocuments();
        const groups = await Group.countDocuments();
        const files = await File.countDocuments();

        res.status(200).json({
            success: true,
            stats: {
                users,
                groups,
                files,
                developers: 2,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch community stats",
        });
    }
};
