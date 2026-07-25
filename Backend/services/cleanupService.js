import mongoose from "mongoose";

import User from "../models/User.js";
import Group from "../models/Group.js";
import File from "../models/file.js";
import Chat from "../models/Chat.js";

import { getGridFSBucket } from "../config/gridfs.js";

// ==========================================
// HELPERS
// ==========================================

const toObjectId = (value) => {
  if (!mongoose.isValidObjectId(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const getAvatarFileId = (profilePicture = "") => {
  const match = String(profilePicture).match(
    /\/api\/users\/profile-picture\/([a-f\d]{24})$/i
  );

  return match?.[1] || null;
};

// ==========================================
// DELETE GRIDFS FILE
// ==========================================

const deleteGridFSFile = async (fileId) => {
  if (!mongoose.isValidObjectId(fileId)) {
    return false;
  }

  try {
    const bucket = getGridFSBucket();

    await bucket.delete(
      new mongoose.Types.ObjectId(fileId)
    );

    return true;
  } catch (error) {
    /*
     * A missing GridFS object should not stop
     * database cleanup.
     */
    if (
      error?.code === "ENOENT" ||
      error?.message
        ?.toLowerCase()
        .includes("file not found")
    ) {
      return false;
    }

    throw error;
  }
};

// ==========================================
// DELETE MULTIPLE STORED FILES
// ==========================================

const deleteStoredFiles = async (files) => {
  const failures = [];

  for (const file of files) {
    if (!file?.fileUrl) {
      continue;
    }

    try {
      await deleteGridFSFile(
        file.fileUrl
      );
    } catch (error) {
      console.error(
        `Failed to delete GridFS file ${file.fileUrl}:`,
        error
      );

      failures.push({
        fileId:
          file._id?.toString(),
        storageId:
          file.fileUrl,
      });
    }
  }

  return failures;
};

// ==========================================
// DELETE GROUP COMPLETELY
// ==========================================

export const deleteGroupCompletely =
  async (groupId) => {
    const objectId =
      toObjectId(groupId);

    if (!objectId) {
      const error = new Error(
        "Invalid group id"
      );

      error.status = 400;

      throw error;
    }

    const group =
      await Group.findById(
        objectId
      );

    if (!group) {
      const error = new Error(
        "Group not found"
      );

      error.status = 404;

      throw error;
    }

    // ------------------------------------------
    // Find files before deleting metadata
    // ------------------------------------------

    const files =
      await File.find({
        group: objectId,
      })
        .select(
          "_id fileUrl"
        )
        .lean();

    // ------------------------------------------
    // Delete GridFS binaries
    // ------------------------------------------

    const storageFailures =
      await deleteStoredFiles(
        files
      );

    /*
     * Important:
     *
     * If GridFS cleanup failed unexpectedly,
     * don't delete File metadata yet.
     *
     * Keeping the metadata makes those files
     * discoverable for recovery / later cleanup.
     */
    if (
      storageFailures.length > 0
    ) {
      const error = new Error(
        "Some stored group files could not be deleted"
      );

      error.status = 500;
      error.storageFailures =
        storageFailures;

      throw error;
    }

    // ------------------------------------------
    // Delete file metadata + chat
    // ------------------------------------------

    await Promise.all([
      File.deleteMany({
        group: objectId,
      }),

      Chat.deleteMany({
        group: objectId,
      }),
    ]);

    // ------------------------------------------
    // Delete group last
    // ------------------------------------------

    await Group.deleteOne({
      _id: objectId,
    });

    return {
      groupId:
        objectId.toString(),

      deletedFiles:
        files.length,
    };
  };

// ==========================================
// REMOVE USER AVATAR
// ==========================================

export const deleteUserAvatar =
  async (user) => {
    const avatarId =
      getAvatarFileId(
        user?.profilePicture
      );

    if (!avatarId) {
      return false;
    }

    return deleteGridFSFile(
      avatarId
    );
  };

// ==========================================
// REMOVE USER FROM GROUP MEMBERSHIPS
// ==========================================

export const removeUserFromGroups =
  async (userId) => {
    const objectId =
      toObjectId(userId);

    if (!objectId) {
      const error = new Error(
        "Invalid user id"
      );

      error.status = 400;
      throw error;
    }

    /*
     * Owner memberships must be handled by
     * deleteGroupCompletely() first.
     *
     * This function removes only normal
     * Member memberships.
     */
    return Group.updateMany(
      {
        members: {
          $elemMatch: {
            user: objectId,
            role: "Member",
          },
        },
      },
      {
        $pull: {
          members: {
            user: objectId,
            role: "Member",
          },
        },
      }
    );
  };

// ==========================================
// GET GROUPS OWNED BY USER
// ==========================================

export const getOwnedGroups =
  async (userId) => {
    const objectId =
      toObjectId(userId);

    if (!objectId) {
      const error = new Error(
        "Invalid user id"
      );

      error.status = 400;

      throw error;
    }

    return Group.find({
      members: {
        $elemMatch: {
          user: objectId,
          role: "Owner",
        },
      },
    })
      .select(
        "_id groupName members"
      )
      .lean();
  };

// ==========================================
// DELETE USER-UPLOADED FILES
// ==========================================

export const deleteFilesUploadedByUser =
  async (userId) => {
    const objectId =
      toObjectId(userId);

    if (!objectId) {
      const error = new Error(
        "Invalid user id"
      );

      error.status = 400;

      throw error;
    }

    const files =
      await File.find({
        uploadedBy: objectId,
      })
        .select(
          "_id fileUrl"
        )
        .lean();

    const storageFailures =
      await deleteStoredFiles(
        files
      );

    if (
      storageFailures.length > 0
    ) {
      const error = new Error(
        "Some user files could not be deleted"
      );

      error.status = 500;
      error.storageFailures =
        storageFailures;

      throw error;
    }

    const fileIds =
      files.map(
        (file) => file._id
      );

    if (fileIds.length > 0) {
      /*
       * File activity messages can reference
       * these File documents.
       *
       * Remove those activity records before
       * deleting the File metadata.
       */
      await Chat.deleteMany({
        "metadata.fileId": {
          $in: fileIds,
        },
      });
    }

    await File.deleteMany({
      uploadedBy: objectId,
    });

    return {
      deletedFiles:
        files.length,
    };
  };

// ==========================================
// ANONYMIZE USER CHAT REFERENCES
// ==========================================

export const cleanupUserChatReferences =
  async (userId) => {
    const objectId =
      toObjectId(userId);

    if (!objectId) {
      const error = new Error(
        "Invalid user id"
      );

      error.status = 400;

      throw error;
    }

    /*
     * Your Chat schema currently requires sender,
     * so we cannot safely set sender = null.
     *
     * For now, user deletion should remove messages
     * directly authored by that user.
     */

    await Chat.deleteMany({
      sender: objectId,
    });

    /*
     * System/file messages may reference the user
     * through metadata.actorId.
     */

    await Chat.updateMany(
      {
        "metadata.actorId":
          objectId,
      },
      {
        $unset: {
          "metadata.actorId": "",
        },
      }
    );
  };

// ==========================================
// FIND USER
// ==========================================

export const getUserForCleanup =
  async (userId) => {
    const objectId =
      toObjectId(userId);

    if (!objectId) {
      const error = new Error(
        "Invalid user id"
      );

      error.status = 400;

      throw error;
    }

    const user =
      await User.findById(
        objectId
      );

    if (!user) {
      const error = new Error(
        "User not found"
      );

      error.status = 404;

      throw error;
    }

    return user;
  };