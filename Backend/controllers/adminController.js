import mongoose from "mongoose";

import User from "../models/User.js";
import Group from "../models/Group.js";
import File from "../models/file.js";

import {
  deleteFilesUploadedByUser,
  deleteGroupCompletely,
  deleteUserAvatar,
  cleanupUserChatReferences,
  getOwnedGroups,
  getUserForCleanup,
  removeUserFromGroups,
} from "../services/cleanupService.js";

// ==========================================
// HELPERS
// ==========================================

const validateId = (id, label = "id") => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(
      `Invalid ${label}`
    );

    error.status = 400;

    throw error;
  }
};

const normalizeEmail = (email = "") =>
  String(email)
    .trim()
    .toLowerCase();

const normalizeName = (name = "") =>
  String(name)
    .trim()
    .replace(/\s+/g, " ");

const sendError = (
  res,
  error,
  fallback = "Server Error"
) => {
  console.error(error);

  return res
    .status(error.status || 500)
    .json({
      success: false,

      message:
        error.status
          ? error.message
          : fallback,
    });
};

// ==========================================
// DASHBOARD
// ==========================================

const dashboard = async (req, res) => {
  try {
    /*
     * These queries don't depend on each other,
     * so run them concurrently.
     */
    const [
      totalUsers,
      totalGroups,
      totalFiles,
      storageResult,
      userStorage,
    ] = await Promise.all([
      User.countDocuments(),

      Group.countDocuments(),

      File.countDocuments(),

      File.aggregate([
        {
          $group: {
            _id: null,

            totalStorage: {
              $sum: "$fileSize",
            },
          },
        },
      ]),

      File.aggregate([
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

            userId:
              "$user._id",

            name:
              "$user.name",

            email:
              "$user.email",

            profilePicture:
              "$user.profilePicture",

            storageUsed: 1,

            fileCount: 1,
          },
        },

        {
          $sort: {
            storageUsed: -1,
          },
        },
      ]),
    ]);

    const totalStorage =
      storageResult[0]
        ?.totalStorage || 0;

    return res.status(200).json({
      success: true,

      stats: {
        users:
          totalUsers,

        groups:
          totalGroups,

        files:
          totalFiles,

        storage:
          totalStorage,
      },

      userStorage,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to load dashboard"
    );
  }
};

// ==========================================
// GET ALL USERS
// ==========================================

const getAllUsers = async (
  req,
  res
) => {
  try {
    /*
     * Password is already select:false in
     * User.js, so it cannot accidentally
     * appear here.
     */

    const users =
      await User.find()
        .select(
          "name email role profilePicture isBanned createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch users"
    );
  }
};

// ==========================================
// BAN / UNBAN USER
// ==========================================

const toggleBanUser = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    validateId(
      id,
      "user id"
    );

    /*
     * Don't allow an admin to ban themselves.
     */
    if (
      id.toString() ===
      req.user.id.toString()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "You cannot ban your own account",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    /*
     * Admin accounts cannot be banned
     * through this endpoint.
     */
    if (
      user.role === "admin"
    ) {
      return res.status(403).json({
        success: false,

        message:
          "Admin accounts cannot be banned",
      });
    }

    user.isBanned =
      !user.isBanned;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        user.isBanned
          ? "User banned"
          : "User unbanned",

      user: {
        _id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        profilePicture:
          user.profilePicture || "",

        isBanned:
          user.isBanned,

        createdAt:
          user.createdAt,

        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to update user ban status"
    );
  }
};

// ==========================================
// EDIT USER
// ==========================================

const editUser = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    validateId(
      id,
      "user id"
    );

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ------------------------------------------
    // NAME
    // ------------------------------------------

    if (
      req.body.name !== undefined
    ) {
      const name =
        normalizeName(
          req.body.name
        );

      if (
        name.length < 2 ||
        name.length > 80
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Name must be between 2 and 80 characters",
        });
      }

      user.name = name;
    }

    // ------------------------------------------
    // EMAIL
    // ------------------------------------------

    if (
      req.body.email !== undefined
    ) {
      const email =
        normalizeEmail(
          req.body.email
        );

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required",
        });
      }

      /*
       * Basic sanity check.
       * This is not intended to implement the
       * entire email RFC.
       */
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(email)
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid email address",
        });
      }

      const existingUser =
        await User.findOne({
          email,

          _id: {
            $ne: user._id,
          },
        }).select("_id");

      if (existingUser) {
        return res.status(409).json({
          success: false,

          message:
            "Email is already in use",
        });
      }

      user.email = email;
    }

    // ------------------------------------------
    // ROLE
    // ------------------------------------------

    if (
      req.body.role !== undefined
    ) {
      const requestedRole =
        String(
          req.body.role
        ).toLowerCase();

      if (
        ![
          "user",
          "admin",
        ].includes(
          requestedRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user role",
        });
      }

      /*
       * Don't modify another existing
       * administrator's role.
       *
       * This keeps your previous behavior.
       */
      if (
        user.role !== "admin"
      ) {
        user.role =
          requestedRole;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "User updated successfully",

      user: {
        _id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        profilePicture:
          user.profilePicture || "",

        isBanned:
          user.isBanned,

        createdAt:
          user.createdAt,

        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    /*
     * Protect against a duplicate email race
     * between our check and user.save().
     */
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Email is already in use",
      });
    }

    return sendError(
      res,
      error,
      "Failed to update user"
    );
  }
};

// ==========================================
// DELETE USER
// ==========================================

const deleteUser = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    validateId(
      id,
      "user id"
    );

    if (
      id.toString() ===
      req.user.id.toString()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "You cannot delete your own admin account",
      });
    }

    const user =
      await getUserForCleanup(
        id
      );

    if (
      user.role === "admin"
    ) {
      return res.status(403).json({
        success: false,

        message:
          "Admin accounts cannot be deleted",
      });
    }

    // ------------------------------------------
    // FIND GROUPS OWNED BY USER
    // ------------------------------------------

    const ownedGroups =
      await getOwnedGroups(
        user._id
      );

    /*
     * Policy:
     *
     * Permanently deleting an account also
     * deletes groups owned by that account.
     *
     * We do NOT automatically transfer
     * ownership to another member.
     */
    for (
      const group
      of ownedGroups
    ) {
      await deleteGroupCompletely(
        group._id
      );
    }

    // ------------------------------------------
    // DELETE REMAINING USER FILES
    // ------------------------------------------

    /*
     * Files from owned groups were already
     * removed above.
     *
     * This catches files uploaded by the user
     * in groups owned by somebody else.
     */
    const fileCleanup =
      await deleteFilesUploadedByUser(
        user._id
      );

    // ------------------------------------------
    // CHAT REFERENCES
    // ------------------------------------------

    await cleanupUserChatReferences(
      user._id
    );

    // ------------------------------------------
    // REMOVE FROM OTHER GROUPS
    // ------------------------------------------

    await removeUserFromGroups(
      user._id
    );

    // ------------------------------------------
    // DELETE AVATAR
    // ------------------------------------------

    try {
      await deleteUserAvatar(
        user
      );
    } catch (avatarError) {
      /*
       * Avatar cleanup failure shouldn't leave
       * the whole account permanently stuck.
       */
      console.error(
        "Failed to delete user avatar:",
        avatarError
      );
    }

    // ------------------------------------------
    // DELETE USER LAST
    // ------------------------------------------

    await User.deleteOne({
      _id:
        user._id,
    });

    return res.status(200).json({
      success: true,

      message:
        "User deleted successfully",

      cleanup: {
        deletedOwnedGroups:
          ownedGroups.length,

        deletedFiles:
          fileCleanup.deletedFiles,
      },
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to delete user"
    );
  }
};

// ==========================================
// GET ALL GROUPS
// ==========================================

const getAllGroups = async (
  req,
  res
) => {
  try {
    const groups =
      await Group.find()
        .populate(
          "members.user",
          "name email profilePicture"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch groups"
    );
  }
};

// ==========================================
// DELETE GROUP
// ==========================================

const deleteGroup = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    validateId(
      id,
      "group id"
    );

    const result =
      await deleteGroupCompletely(
        id
      );

    return res.status(200).json({
      success: true,

      message:
        "Group deleted successfully",

      cleanup: {
        deletedFiles:
          result.deletedFiles,
      },
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to delete group"
    );
  }
};

// ==========================================
// GET FILES
// ==========================================

const getFiles = async (
  req,
  res
) => {
  try {
    const files =
      await File.find()
        .populate(
          "uploadedBy",
          "name email profilePicture"
        )
        .populate(
          "group",
          "groupName"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch files"
    );
  }
};

// ==========================================
// EXPORTS
// ==========================================

export {
  dashboard,
  getAllUsers,
  toggleBanUser,
  deleteUser,
  editUser,
  getAllGroups,
  deleteGroup,
  getFiles,
};