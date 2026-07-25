import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,

      // Never return password hashes from
      // normal User queries.
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },

    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;