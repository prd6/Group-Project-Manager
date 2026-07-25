import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    // GridFS stored file ID
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // Original filename shown to users
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    // GridFS ObjectId stored as string
    fileUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // MIME type
    fileType: {
      type: String,
      required: true,
      trim: true,
    },

    // Size in bytes
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==========================================
// INDEXES
// ==========================================

// Main FilesPage query:
//
// File.find({ group })
//     .sort({ createdAt: -1 })
//
fileSchema.index({
  group: 1,
  createdAt: -1,
});

// Useful for storage calculations:
//
// File.aggregate([
//   { $match: { uploadedBy: userId } },
//   ...
// ])
//
fileSchema.index({
  uploadedBy: 1,
  fileSize: 1,
});

// Useful for finding a user's files
// inside a particular workspace.
fileSchema.index({
  group: 1,
  uploadedBy: 1,
});

const File =
  mongoose.models.File ||
  mongoose.model(
    "File",
    fileSchema
  );

export default File;