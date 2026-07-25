import multer from "multer";

const storage = multer.memoryStorage();

// ==========================================
// LIMITS
// ==========================================

export const MAX_PROJECT_FILE_SIZE =
  1 * 1024 * 1024; // 1 MB

export const MAX_AVATAR_SIZE =
  2 * 1024 * 1024; // 2 MB

export const MAX_USER_STORAGE =
  20 * 1024 * 1024; // 20 MB

// ==========================================
// ALLOWED PROJECT MIME TYPES
// ==========================================

const allowedProjectTypes = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  // Documents
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Text / Web
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "text/csv",
  "text/markdown",

  // Structured data
  "application/json",
  "application/xml",
  "text/xml",

  // Archives
  "application/zip",
  "application/x-zip-compressed",

  // Generic binary
  // Only accepted when extension is explicitly allowed.
  "application/octet-stream",
]);

// ==========================================
// CODE FILE EXTENSIONS
// ==========================================

const allowedCodeExtensions = new Set([
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
]);

// ==========================================
// AVATAR TYPES
// ==========================================

const allowedAvatarTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// ==========================================
// HELPERS
// ==========================================

const getExtension = (filename = "") => {
  const normalizedName =
    String(filename)
      .trim()
      .toLowerCase();

  const lastDot =
    normalizedName.lastIndexOf(".");

  if (
    lastDot <= 0 ||
    lastDot === normalizedName.length - 1
  ) {
    return "";
  }

  return normalizedName.slice(
    lastDot + 1
  );
};

// ==========================================
// PROJECT FILE FILTER
// ==========================================

const projectFileFilter = (
  req,
  file,
  cb
) => {
  const extension =
    getExtension(
      file.originalname
    );

  const validCodeExtension =
    allowedCodeExtensions.has(
      extension
    );

  const validMimeType =
    allowedProjectTypes.has(
      file.mimetype
    );

  /*
   * application/octet-stream is too generic
   * to trust by itself.
   *
   * Only allow it when the filename has one
   * of our explicitly supported code/text
   * extensions.
   */
  if (
    file.mimetype ===
      "application/octet-stream" &&
    !validCodeExtension
  ) {
    const error = new Error(
      "This file type is not allowed."
    );

    error.code =
      "INVALID_FILE_TYPE";

    return cb(error);
  }

  if (
    !validMimeType &&
    !validCodeExtension
  ) {
    const error = new Error(
      "This file type is not allowed."
    );

    error.code =
      "INVALID_FILE_TYPE";

    return cb(error);
  }

  return cb(null, true);
};

// ==========================================
// PROJECT FILE UPLOAD
// ==========================================

const upload = multer({
  storage,

  limits: {
    fileSize:
      MAX_PROJECT_FILE_SIZE,

    files: 1,
  },

  fileFilter:
    projectFileFilter,
});

// ==========================================
// AVATAR FILTER
// ==========================================

const avatarFileFilter = (
  req,
  file,
  cb
) => {
  if (
    !allowedAvatarTypes.has(
      file.mimetype
    )
  ) {
    const error = new Error(
      "Only JPG, PNG and WebP images are allowed."
    );

    error.code =
      "INVALID_AVATAR_TYPE";

    return cb(error);
  }

  return cb(null, true);
};

// ==========================================
// AVATAR UPLOAD
// ==========================================

export const avatarUpload =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_AVATAR_SIZE,

      files: 1,
    },

    fileFilter:
      avatarFileFilter,
  });

export default upload;