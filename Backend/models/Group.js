import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },

    projectName: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
    },

    deadline: {
      type: Date,
    },

    joinCode: {
      type: String,
      required: true,
      unique: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: ["Owner", "Member"],
          default: "Member",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
