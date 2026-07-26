import File from "../models/file.js";
import User from "../models/User.js";
import {
  MAX_USER_STORAGE,
  MAX_GROUP_STORAGE
} from "../config/multer.js";
import { Readable } from "stream";
import mongoose from "mongoose";
import mime from "mime-types";

import { getGridFSBucket } from "../config/gridfs.js";

import {
  CHAT_MESSAGE_TYPES,
  createFileActivityMessage,
} from "../utils/chatService.js";

import {
  createHttpError,
  getAuthorizedGroup,
  validateObjectId,
} from "../utils/groupAccess.js";

// ==========================================
// HELPERS
// ==========================================

const sanitizeDownloadName = (filename = "file") => {
  return filename
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_");
};

const getAuthorizedStoredFile = async (
  storageFileId,
  userId
) => {
  validateObjectId(storageFileId, "file id");

  const file = await File.findOne({
    fileUrl: storageFileId,
  });

  if (!file) {
    throw createHttpError(
      404,
      "File not found"
    );
  }

  const authorizedGroup =
    await getAuthorizedGroup(
      file.group,
      userId
    );

  return {
    file,
    group: authorizedGroup.group,
    member: authorizedGroup.member,
  };
};

const getStoredGridFSFile = async (
  bucket,
  fileId
) => {
  const files = await bucket
    .find({
      _id: fileId,
    })
    .limit(1)
    .toArray();

  return files[0] || null;
};

const streamGridFSFile = ({
  bucket,
  fileId,
  storedFile,
  originalName,
  disposition,
  res,
}) => {
  const safeName =
    sanitizeDownloadName(originalName);

  res.set({
    "Content-Type":
      storedFile.contentType ||
      mime.lookup(storedFile.filename) ||
      "application/octet-stream",

    "Content-Length":
      storedFile.length,

    "Content-Disposition":
      `${disposition}; filename="${safeName}"`,

    "X-Content-Type-Options":
      "nosniff",
  });

  const downloadStream =
    bucket.openDownloadStream(fileId);

  downloadStream.on("error", (error) => {
    console.error(
      "GridFS download stream error:",
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        message:
          "Failed to read stored file",
      });
    } else {
      res.destroy(error);
    }
  });

  downloadStream.pipe(res);
};

// ==========================================
// UPLOAD FILE
// ==========================================

export const uploadFile = async (
  req,
  res
) => {
  let uploadedGridFSId = null;
  let createdFile = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const { groupId } = req.params;

    // Verify that the current user belongs
    // to this group before storing anything.
    await getAuthorizedGroup(
      groupId,
      req.user.id
    );

    // ==========================================
    // USER STORAGE LIMIT
    // ==========================================
    //yoouguygyfjyfuydctyfjuyhfuycuyfu
    
    const storageResult = await File.aggregate([
      {
        $match: {
          uploadedBy:
            new mongoose.Types.ObjectId(
              req.user.id
            ),
        },
      },
      {
        $group: {
          _id: null,
          totalUsed: {
            $sum: "$fileSize",
          },
        },
      },
    ]);

    const usedStorage =
      storageResult[0]?.totalUsed || 0;

    const newStorageTotal =
      usedStorage + req.file.size;

    if (
      newStorageTotal >
      MAX_USER_STORAGE
    ) {
      const remainingStorage =
        Math.max(
          MAX_USER_STORAGE -
          usedStorage,
          0
        );

      return res.status(413).json({
        message:
          "Storage limit exceeded",

        storage: {
          used: usedStorage,
          limit: MAX_USER_STORAGE,
          remaining:
            remainingStorage,
          requested:
            req.file.size,
        },
      });
    }


    // ==========================================
    // GROUP STORAGE LIMIT
    // ==========================================

    const groupStorageResult = await File.aggregate([
      {
        $match: {
          group: new mongoose.Types.ObjectId(groupId),
        },
      },
      {
        $group: {
          _id: null,
          totalUsed: {
            $sum: "$fileSize",
          },
        },
      },
    ]);

    const groupUsedStorage =
      groupStorageResult[0]?.totalUsed || 0;

    const newGroupStorageTotal =
      groupUsedStorage + req.file.size;

    if (newGroupStorageTotal > MAX_GROUP_STORAGE) {
      const remainingGroupStorage = Math.max(
        MAX_GROUP_STORAGE - groupUsedStorage,
        0
      );

      return res.status(413).json({
        message: "Group storage limit exceeded",

        storage: {
          used: groupUsedStorage,
          limit: MAX_GROUP_STORAGE,
          remaining: remainingGroupStorage,
          requested: req.file.size,
        },
      });
    }

    const actor = await User.findById(
      req.user.id
    )
      .select("name")
      .lean();

    const bucket =
      getGridFSBucket();

    const uploadStream =
      bucket.openUploadStream(
        req.file.originalname,
        {
          contentType:
            req.file.mimetype,

          metadata: {
            groupId:
              groupId.toString(),

            uploadedBy:
              req.user.id.toString(),
          },
        }
      );

    uploadedGridFSId =
      uploadStream.id;

    const readableStream =
      Readable.from(
        req.file.buffer
      );

    await new Promise(
      (resolve, reject) => {
        uploadStream.once(
          "finish",
          resolve
        );

        uploadStream.once(
          "error",
          reject
        );

        readableStream.once(
          "error",
          reject
        );

        readableStream.pipe(
          uploadStream
        );
      }
    );

    createdFile =
      await File.create({
        fileName:
          uploadStream.id.toString(),

        originalName:
          req.file.originalname,

        fileUrl:
          uploadStream.id.toString(),

        fileType:
          req.file.mimetype,

        fileSize:
          req.file.size,

        uploadedBy:
          req.user.id,

        group:
          groupId,

        version: 1,
      });

    /*
     * Activity/chat creation should not make
     * a successful file upload fail.
     */
    try {
      await createFileActivityMessage({
        groupId,

        actor: {
          _id: req.user.id,
          name: actor?.name,
        },

        file: createdFile,

        type:
          CHAT_MESSAGE_TYPES.FILE_UPLOAD,
      });
    } catch (activityError) {
      console.error(
        "Failed to create file upload activity:",
        activityError
      );
    }

    return res.status(201).json({
      message:
        "File uploaded successfully",

      file: createdFile,
    });
  } catch (error) {
    console.error(
      "Upload file error:",
      error
    );

    /*
     * GridFS upload may succeed while File.create()
     * fails. Remove the stored binary so we don't
     * leave an orphaned GridFS file.
     */
    if (
      uploadedGridFSId &&
      !createdFile
    ) {
      try {
        const bucket =
          getGridFSBucket();

        await bucket.delete(
          uploadedGridFSId
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean orphaned GridFS upload:",
          cleanupError
        );
      }
    }

    return res
      .status(error.status || 500)
      .json({
        message:
          error.message ||
          "Server Error",
      });
  }
};

// ==========================================
// GET GROUP FILES
// ==========================================

export const getFiles = async (
  req,
  res
) => {
  try {
    const { groupId } =
      req.params;

    const authorizedGroup =
      await getAuthorizedGroup(
        groupId,
        req.user.id
      );

    const files = await File.find({
      group: groupId,
    })
      .populate(
        "uploadedBy",
        "name profilePicture"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const filesWithRole =
      files.map((file) => ({
        ...file,

        currentUserRole:
          authorizedGroup.member.role,
      }));

    return res
      .status(200)
      .json(filesWithRole);
  } catch (error) {
    console.error(
      "Get files error:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        message:
          error.message ||
          "Server Error",
      });
  }
};

// ==========================================
// VIEW FILE
// ==========================================

export const viewFile = async (
  req,
  res
) => {
  try {
    const { fileId } =
      req.params;

    const authorizedFile =
      await getAuthorizedStoredFile(
        fileId,
        req.user.id
      );

    const objectId =
      new mongoose.Types.ObjectId(
        fileId
      );

    const bucket =
      getGridFSBucket();

    const storedFile =
      await getStoredGridFSFile(
        bucket,
        objectId
      );

    if (!storedFile) {
      return res.status(404).json({
        message:
          "Stored file not found",
      });
    }

    streamGridFSFile({
      bucket,

      fileId: objectId,

      storedFile,

      originalName:
        authorizedFile.file
          .originalName,

      disposition: "inline",

      res,
    });
  } catch (error) {
    console.error(
      "View file error:",
      error
    );

    if (!res.headersSent) {
      return res
        .status(error.status || 500)
        .json({
          message:
            error.message ||
            "Server Error",
        });
    }
  }
};

// ==========================================
// DOWNLOAD FILE
// ==========================================

export const downloadFile = async (
  req,
  res
) => {
  try {
    const { fileId } =
      req.params;

    const authorizedFile =
      await getAuthorizedStoredFile(
        fileId,
        req.user.id
      );

    const objectId =
      new mongoose.Types.ObjectId(
        fileId
      );

    const bucket =
      getGridFSBucket();

    const storedFile =
      await getStoredGridFSFile(
        bucket,
        objectId
      );

    if (!storedFile) {
      return res.status(404).json({
        message:
          "Stored file not found",
      });
    }

    streamGridFSFile({
      bucket,

      fileId: objectId,

      storedFile,

      originalName:
        authorizedFile.file
          .originalName,

      disposition: "attachment",

      res,
    });
  } catch (error) {
    console.error(
      "Download file error:",
      error
    );

    if (!res.headersSent) {
      return res
        .status(error.status || 500)
        .json({
          message:
            error.message ||
            "Server Error",
        });
    }
  }
};

// ==========================================
// DELETE FILE
// ==========================================

export const deleteFile = async (
  req,
  res
) => {
  try {
    const { fileId } =
      req.params;

    validateObjectId(
      fileId,
      "file id"
    );

    const file =
      await File.findById(
        fileId
      );

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const authorizedGroup =
      await getAuthorizedGroup(
        file.group,
        req.user.id
      );

    const isOwner =
      authorizedGroup.member.role ===
      "Owner";

    const isUploader =
      file.uploadedBy?.toString() ===
      req.user.id.toString();

    if (
      !isOwner &&
      !isUploader
    ) {
      return res.status(403).json({
        message:
          "Only the Owner or File Uploader can delete this file",
      });
    }

    const actor =
      await User.findById(
        req.user.id
      )
        .select("name")
        .lean();

    const bucket =
      getGridFSBucket();

    /*
     * Delete GridFS data first.
     *
     * If this fails, keep the File metadata so
     * the file is still discoverable/recoverable.
     */
    try {
      await bucket.delete(
        new mongoose.Types.ObjectId(
          file.fileUrl
        )
      );
    } catch (gridError) {
      console.error(
        "GridFS delete error:",
        gridError
      );

      return res.status(500).json({
        message:
          "Failed to delete stored file",
      });
    }

    await File.findByIdAndDelete(
      fileId
    );

    /*
     * Don't make deletion appear to fail merely
     * because creating the activity message failed.
     */
    try {
      await createFileActivityMessage({
        groupId: file.group,

        actor: {
          _id: req.user.id,
          name: actor?.name,
        },

        file,

        type:
          CHAT_MESSAGE_TYPES.FILE_DELETE,
      });
    } catch (activityError) {
      console.error(
        "Failed to create file deletion activity:",
        activityError
      );
    }

    return res.status(200).json({
      message:
        "File deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete file error:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        message:
          error.message ||
          "Server Error",
      });
  }
};