import File from "../models/File.js";
import Group from "../models/Group.js";
import fs from "fs";

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

    const file = await File.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: req.file.path,
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

    if (fs.existsSync(file.fileUrl)) {
      fs.unlinkSync(file.fileUrl);
    }

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