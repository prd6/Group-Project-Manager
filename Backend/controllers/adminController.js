import User from "../models/User.js";
import Group from "../models/Group.js";
import File from "../models/file.js";

const dashboard = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalFiles = await File.countDocuments();

    // Total storage
    const storageResult = await File.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: {
            $sum: "$fileSize",
          },
        },
      },
    ]);

    const totalStorage =
      storageResult.length > 0
        ? storageResult[0].totalStorage
        : 0;

    // Storage usage per user
    const userStorage = await File.aggregate([
      {
        $group: {
          _id: "$uploadedBy",
          storageUsed: {
            $sum: "$fileSize",
          },
          fileCount: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: "$user",
      },

      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          email: "$user.email",
          storageUsed: 1,
          fileCount: 1,
        },
      },

      {
        $sort: {
          storageUsed: -1,
        },
      },
    ]);

    // Send response AFTER everything is calculated
    res.status(200).json({
      success: true,

      stats: {
        users: totalUsers,
        groups: totalGroups,
        files: totalFiles,
        storage: totalStorage,
      },

      userStorage,
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent banning admins
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin cannot be banned",
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: user.isBanned ? "User banned" : "User unbanned",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin cannot be deleted",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    // Prevent changing another admin's role
    if (user.role !== "admin") {
      user.role = role || user.role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Groups

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate(
      "members.user",
      "name email"
    );

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Group deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Files

const getFiles = async (req, res) => {
  try {
    const files = await File.find()
      .populate("uploadedBy", "name email")
      .populate("group", "groupName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Get files error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch files",
    });
  }
};

export { dashboard, getAllUsers, toggleBanUser, deleteUser, editUser, getAllGroups, deleteGroup, getFiles };
