import mongoose from "mongoose";
import multer from "multer";
import { Readable } from "stream";
import User from "../models/User.js";
import { getGridFSBucket } from "../config/gridfs.js";
import { avatarUpload } from "../config/multer.js";

const allowedAvatarTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const hasValidImageSignature = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (mimetype === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimetype === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimetype === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
};

export const serializeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture || "",
  createdAt: user.createdAt,
});

const validateName = (name) => {
  if (typeof name !== "string") {
    return "Name is required";
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return "Name must be at least 2 characters";
  }

  if (trimmed.length > 80) {
    return "Name must be 80 characters or less";
  }

  return "";
};

const getAvatarFileId = (profilePicture = "") => {
  const match = profilePicture.match(/\/api\/users\/profile-picture\/([a-f\d]{24})$/i);

  return match?.[1] || null;
};

const deleteAvatarIfOwned = async (profilePicture = "") => {
  const fileId = getAvatarFileId(profilePicture);

  if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
    return;
  }

  try {
    const bucket = getGridFSBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Failed to delete previous avatar:", error.message);
    }
  }
};

export const uploadProfilePictureMiddleware = (req, res, next) => {
  avatarUpload.single("profilePicture")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const isFileSize = error.code === "LIMIT_FILE_SIZE";

      return res.status(isFileSize ? 413 : 400).json({
        message: isFileSize
          ? "Profile picture must be 2 MB or smaller"
          : "Only JPG, PNG, and WebP images are supported",
      });
    }

    return res.status(400).json({
      message: "Invalid profile picture upload",
    });
  });
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role profilePicture createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const nameError = validateName(name);

    if (nameError) {
      return res.status(400).json({
        message: nameError,
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name.trim().replace(/\s+/g, " ");

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No profile picture uploaded",
      });
    }

    const extension = allowedAvatarTypes.get(req.file.mimetype);

    if (!extension) {
      return res.status(400).json({
        message: "Only JPG, PNG, and WebP images are supported",
      });
    }

    if (!hasValidImageSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        message: "Uploaded file is not a valid image",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const bucket = getGridFSBucket();
    const safeFileName = `profile-${user._id}-${Date.now()}.${extension}`;
    const uploadStream = bucket.openUploadStream(safeFileName, {
      contentType: req.file.mimetype,
      metadata: {
        owner: user._id,
        purpose: "profile-picture",
      },
    });

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    const previousProfilePicture = user.profilePicture;
    user.profilePicture = `/api/users/profile-picture/${uploadStream.id.toString()}`;

    await user.save();
    await deleteAvatarIfOwned(previousProfilePicture);

    res.status(200).json({
      message: "Profile picture updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Update profile picture error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const previousProfilePicture = user.profilePicture;
    user.profilePicture = "";

    await user.save();
    await deleteAvatarIfOwned(previousProfilePicture);

    res.status(200).json({
      message: "Profile picture removed successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const viewProfilePicture = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid profile picture",
      });
    }

    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files.length || files[0].metadata?.purpose !== "profile-picture") {
      return res.status(404).json({
        message: "Profile picture not found",
      });
    }

    res.set({
      "Content-Type": files[0].contentType || "application/octet-stream",
      "Content-Length": files[0].length,
      "Cache-Control": "public, max-age=86400",
    });

    bucket.openDownloadStream(objectId).pipe(res);
  } catch (error) {
    console.error("View profile picture error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
