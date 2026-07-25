import mongoose from "mongoose";
import Group from "../models/Group.js";

// ==========================================
// HTTP ERROR
// ==========================================

export const createHttpError = (
  status,
  message
) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

// ==========================================
// OBJECT ID HELPERS
// ==========================================

export const toObjectIdString = (
  value
) => {
  if (!value) {
    return "";
  }

  /*
   * Handles both:
   *
   * member.user = ObjectId(...)
   *
   * and populated:
   *
   * member.user = {
   *   _id: ObjectId(...),
   *   name: ...
   * }
   */
  if (value._id) {
    return value._id.toString();
  }

  return value.toString?.() || "";
};

export const validateObjectId = (
  value,
  label = "id"
) => {
  if (
    !value ||
    !mongoose.isValidObjectId(value)
  ) {
    throw createHttpError(
      400,
      `Invalid ${label}`
    );
  }

  return value;
};

// ==========================================
// FIND MEMBER
// ==========================================

export const findGroupMember = (
  group,
  userId
) => {
  if (
    !group ||
    !Array.isArray(group.members)
  ) {
    return null;
  }

  const targetUserId =
    toObjectIdString(userId);

  if (!targetUserId) {
    return null;
  }

  return (
    group.members.find(
      (member) =>
        toObjectIdString(
          member?.user
        ) === targetUserId
    ) || null
  );
};

// ==========================================
// AUTHORIZED GROUP
// ==========================================

export const getAuthorizedGroup =
  async (
    groupId,
    userId,
    options = {}
  ) => {
    validateObjectId(
      groupId,
      "group id"
    );

    validateObjectId(
      userId,
      "user id"
    );

    let query =
      Group.findById(groupId);

    if (options.populateMembers) {
      query = query.populate(
        "members.user",
        "name email profilePicture"
      );
    }

    const group = await query;

    if (!group) {
      throw createHttpError(
        404,
        "Group not found"
      );
    }

    const member =
      findGroupMember(
        group,
        userId
      );

    if (!member) {
      throw createHttpError(
        403,
        "You do not have access to this group"
      );
    }

    return {
      group,
      member,
    };
  };

// ==========================================
// OWNER CHECK
// ==========================================

export const ensureGroupOwner = (
  member
) => {
  if (
    member?.role?.toLowerCase() !==
    "owner"
  ) {
    throw createHttpError(
      403,
      "Only the group owner can perform this action"
    );
  }

  return true;
};