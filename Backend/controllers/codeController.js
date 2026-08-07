import mongoose from "mongoose";
import File from "../models/file.js";
import {
  getAuthorizedGroup,
  validateObjectId,
} from "../utils/groupAccess.js";
import {
  getGridFSBucket,
} from "../config/gridfs.js";
import { Readable } from "stream";
import {
  runJudge0Code,
} from "../services/judge0Service.js";

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "php",
  "rb",
  "go",
  "rs",
  "swift",
  "kt",
  "kts",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "xml",
  "yaml",
  "yml",
  "sql",
  "sh",
  "bash",
  "md",
  "txt",
  "env",
]);

const getFileExtension = (fileName = "") =>
  String(fileName)
    .split(".")
    .pop()
    .toLowerCase();

const isCodeFileName = (fileName = "") =>
  CODE_EXTENSIONS.has(getFileExtension(fileName));

const sanitizeContent = (value = "") =>
  String(value ?? "");

export const runCode = async (req, res) => {
  try {
    const {
      sourceCode,
      stdin,
      language,
      fileName,
      compilerOptions,
      commandLineArguments,
      source_code,
    } = req.body || {};

    const result = await runJudge0Code({
      sourceCode:
        typeof sourceCode === "string"
          ? sourceCode
          : source_code,
      stdin,
      editorLanguage: language,
      fileName,
      compilerOptions,
      commandLineArguments,
    });

    return res.status(200).json({
      ...result,
      status: result.status || null,
    });
  } catch (error) {
    console.error("Code run error:", error);

    return res.status(error.status || 500).json({
      message:
        error.message || "Server Error",
    });
  }
};

export const updateFile = async (
  req,
  res
) => {
  let newGridFsId = null;

  try {
    const { fileId } = req.params;
    const { content } = req.body || {};

    validateObjectId(fileId, "file id");

    if (typeof content !== "string") {
      return res.status(400).json({
        message:
          "File content must be a string",
      });
    }

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (!isCodeFileName(file.originalName)) {
      return res.status(400).json({
        message:
          "Only code files can be edited in the editor.",
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

    if (!isOwner && !isUploader) {
      return res.status(403).json({
        message:
          "Only the Owner or File Uploader can edit this file",
      });
    }

    const bucket = getGridFSBucket();
    const oldGridFsId =
      new mongoose.Types.ObjectId(
        file.fileUrl
      );

    const buffer = Buffer.from(
      sanitizeContent(content),
      "utf8"
    );

    const uploadStream =
      bucket.openUploadStream(
        file.originalName,
        {
          contentType:
            file.fileType,
          metadata: {
            groupId:
              file.group.toString(),
            uploadedBy:
              req.user.id.toString(),
            source: "editor-save",
          },
        }
      );

    newGridFsId = uploadStream.id;

    await new Promise(
      (resolve, reject) => {
        const readable =
          Readable.from(buffer);

        readable.once(
          "error",
          reject
        );

        uploadStream.once(
          "error",
          reject
        );

        uploadStream.once(
          "finish",
          resolve
        );

        readable.pipe(
          uploadStream
        );
      }
    );

    const updatedFile =
      await File.findByIdAndUpdate(
        fileId,
        {
          fileName:
            newGridFsId.toString(),
          fileUrl:
            newGridFsId.toString(),
          fileSize:
            buffer.length,
          version:
            (file.version || 1) + 1,
        },
        {
          new: true,
        }
      )
        .populate(
          "uploadedBy",
          "name profilePicture"
        )
        .lean();

    try {
      await bucket.delete(oldGridFsId);
    } catch (cleanupError) {
      console.error(
        "Failed to remove previous file version:",
        cleanupError
      );
    }

    return res.status(200).json({
      message: "File updated successfully",
      file: updatedFile,
    });
  } catch (error) {
    console.error("Update file error:", error);

    if (newGridFsId) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(newGridFsId);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up new file version:",
          cleanupError
        );
      }
    }

    return res.status(error.status || 500).json({
      message:
        error.message || "Server Error",
    });
  }
};
