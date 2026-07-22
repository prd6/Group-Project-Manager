import User from "../models/User.js";
import Group from "../models/Group.js";
import File from "../models/File.js";

const dashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalFiles = await File.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        users: totalUsers,
        groups: totalGroups,
        files: totalFiles,
        tasks: 0 // We'll implement tasks later
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export { dashboard };