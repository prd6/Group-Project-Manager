import File from "../models/File.js";
import Group from "../models/Group.js";
import { Readable } from "stream";
import { getGridFSBucket } from "../config/gridfs.js";
import mongoose from "mongoose";
import mime from "mime-types";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
    return res.status(404).json({
        message: "Group not found",
    });
    }

    const isMember = group.members.some(
    (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
    return res.status(403).json({
        message: "You are not a member of this group",
    });
    }
    const bucket = getGridFSBucket();

console.log("Original Name:", req.file.originalname);
console.log("MIME Type:", req.file.mimetype);

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

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const files = await File.find({
      group: groupId,
    }).populate("uploadedBy", "name");

    res.status(200).json(files);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const viewFile = async (req, res) => {
  try {
    const bucket = getGridFSBucket();

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();

    console.log(files[0]);

    if (!files.length) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    res.set({
        "Content-Type": mime.lookup(files[0].filename) || "application/octet-stream",
        "Content-Length": files[0].length,
        "Content-Disposition": `inline; filename="${files[0].filename}"`,
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
    const bucket = getGridFSBucket();

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();

    console.log(files[0]);

    if (!files.length) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    res.set({
        "Content-Type": mime.lookup(files[0].filename) || "application/octet-stream",
        "Content-Length": files[0].length,
        "Content-Disposition": `attachment; filename="${files[0].filename}"`,
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

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const group = await Group.findById(file.group);

    const member = group.members.find(
      (m) => m.user.toString() === req.user.id
    );

    if (!member) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const isOwner = member.role === "Owner";
    const isUploader =
      file.uploadedBy.toString() === req.user.id;

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
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};