import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedAvatarTypes.includes(file.mimetype)) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "profilePicture"));
    }

    cb(null, true);
  },
});

export default upload;
