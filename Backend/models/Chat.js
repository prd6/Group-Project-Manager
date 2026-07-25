import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: ["text", "file_upload", "file_delete", "system"],
      default: "text",
      index: true,
    },

    metadata: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },

      fileName: {
        type: String,
        trim: true,
      },

      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ group: 1, createdAt: -1, _id: -1 });

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;
