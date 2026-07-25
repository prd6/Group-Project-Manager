import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["Owner", "Member"],
      default: "Member",
      required: true,
    },
  },
  {
    _id: false,
  }
);

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    maxMembers: {
      type: Number,
      enum: [4, 6, 12],
      default: 4,
      required: true,
    },

    projectName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    deadline: {
      type: Date,
      default: null,
    },

    joinCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    members: {
      type: [memberSchema],
      default: [],
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

// Used when finding all groups that a user
// belongs to.
groupSchema.index({
  "members.user": 1,
});

// ==========================================
// MEMBER VALIDATION
// ==========================================

groupSchema.pre("validate", function () {
  if (!Array.isArray(this.members)) {
    return;
  }

  // ------------------------------------------
  // Prevent duplicate users
  // ------------------------------------------

  const memberIds = this.members.map(
    (member) =>
      member.user?.toString()
  );

  const validMemberIds =
    memberIds.filter(Boolean);

  const uniqueMemberIds =
    new Set(validMemberIds);

  if (
    uniqueMemberIds.size !==
    validMemberIds.length
  ) {
    this.invalidate(
      "members",
      "A user cannot be added to the group more than once."
    );
  }

  // ------------------------------------------
  // Maximum member count
  // ------------------------------------------

  if (
    this.members.length >
    this.maxMembers
  ) {
    this.invalidate(
      "members",
      `This group can have a maximum of ${this.maxMembers} members.`
    );
  }

  // ------------------------------------------
  // Exactly one owner
  // ------------------------------------------

  const ownerCount =
    this.members.filter(
      (member) =>
        member.role === "Owner"
    ).length;

  if (ownerCount !== 1) {
    this.invalidate(
      "members",
      "A group must have exactly one owner."
    );
  }
});

const Group =
  mongoose.models.Group ||
  mongoose.model(
    "Group",
    groupSchema
  );

export default Group;