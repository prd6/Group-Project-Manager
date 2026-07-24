import File from "../models/file.js";
import Group from "../models/Group.js";
import { Readable } from "stream";
import { getGridFSBucket } from "../config/gridfs.js";
import mongoose from "mongoose";
import mime from "mime-types";

const toUserId = (userId) => userId?.toString?.() || "";

const sendError = (res, error) =>
  res.status(error.status).json({
    message: error.message,
  });

const getAuthorizedGroup = async (groupId, userId) => {
  if (!mongoose.isValidObjectId(groupId)) {
    return {
      error: {
        status: 400,
        message: "Invalid group id",
      },
    };
  }

  const group = await Group.findById(groupId);

  if (!group) {
    return {
      error: {
        status: 404,
        message: "Group not found",
      },
    };
  }

  const member = group.members.find(
    (groupMember) => groupMember.user.toString() === toUserId(userId)
  );

  if (!member) {
    return {
      error: {
        status: 403,
        message: "Access Denied",
      },
    };
  }

  return {
    group,
    member,
  };
};

const getAuthorizedStoredFile = async (storageFileId, userId) => {
  if (!mongoose.isValidObjectId(storageFileId)) {
    return {
      error: {
        status: 400,
        message: "Invalid file id",
      },
    };
  }

  const file = await File.findOne({
    fileUrl: storageFileId,
  });

  if (!file) {
    return {
      error: {
        status: 404,
        message: "File not found",
      },
    };
  }

  const authorizedGroup = await getAuthorizedGroup(file.group, userId);

  if (authorizedGroup.error) {
    return authorizedGroup;
  }

  return {
    file,
    group: authorizedGroup.group,
    member: authorizedGroup.member,
  };
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const { groupId } = req.params;
    const authorizedGroup = await getAuthorizedGroup(groupId, req.user.id);

    if (authorizedGroup.error) {
      return sendError(res, authorizedGroup.error);
    }

    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });
    const readableStream = Readable.from(req.file.buffer);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    const file = await File.create({
      fileName: uploadStream.id.toString(),
      originalName: req.file.originalname,
      fileUrl: uploadStream.id.toString(),
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      group: groupId,
      version: 1,
    });

    res.status(201).json({
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getFiles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const authorizedGroup = await getAuthorizedGroup(groupId, req.user.id);

    if (authorizedGroup.error) {
      return sendError(res, authorizedGroup.error);
    }

    const files = await File.find({
      group: groupId,
    })
      .populate("uploadedBy", "name profilePicture")
      .sort({ createdAt: -1 });

    const filesWithRole = files.map((file) => ({
      ...file.toObject(),
      currentUserRole: authorizedGroup.member.role,
    }));

    res.status(200).json(filesWithRole);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const viewFile = async (req, res) => {
  try {
    const authorizedFile = await getAuthorizedStoredFile(
      req.params.fileId,
      req.user.id
    );

    if (authorizedFile.error) {
      return sendError(res, authorizedFile.error);
    }

    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        message: "Stored file not found",
      });
    }

    const storedFile = files[0];

    res.set({
      "Content-Type":
        storedFile.contentType ||
        mime.lookup(storedFile.filename) ||
        "application/octet-stream",
      "Content-Length": storedFile.length,
      "Content-Disposition": `inline; filename="${authorizedFile.file.originalName}"`,
    });

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const authorizedFile = await getAuthorizedStoredFile(
      req.params.fileId,
      req.user.id
    );

    if (authorizedFile.error) {
      return sendError(res, authorizedFile.error);
    }

    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        message: "Stored file not found",
      });
    }

    const storedFile = files[0];

    res.set({
      "Content-Type":
        storedFile.contentType ||
        mime.lookup(storedFile.filename) ||
        "application/octet-stream",
      "Content-Length": storedFile.length,
      "Content-Disposition": `attachment; filename="${authorizedFile.file.originalName}"`,
    });

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.isValidObjectId(fileId)) {
      return res.status(400).json({
        message: "Invalid file id",
      });
    }

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const authorizedGroup = await getAuthorizedGroup(file.group, req.user.id);

    if (authorizedGroup.error) {
      return sendError(res, authorizedGroup.error);
    }

    const isOwner = authorizedGroup.member.role === "Owner";
    const isUploader = file.uploadedBy.toString() === req.user.id;

    if (!isOwner && !isUploader) {
      return res.status(403).json({
        message: "Only the Owner or File Uploader can delete this file",
      });
    }

    const bucket = getGridFSBucket();

    await bucket.delete(new mongoose.Types.ObjectId(file.fileUrl));
    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
