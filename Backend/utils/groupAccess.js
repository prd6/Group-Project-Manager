import mongoose from "mongoose";
import Group from "../models/Group.js";

export const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const toObjectIdString = (value) => value?.toString?.() || "";

export const validateObjectId = (value, label = "id") => {
  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError(400, `Invalid ${label}`);
  }
};

export const findGroupMember = (group, userId) =>
  group.members.find(
    (member) => toObjectIdString(member.user) === toObjectIdString(userId)
  );

export const getAuthorizedGroup = async (groupId, userId, options = {}) => {
  validateObjectId(groupId, "group id");

  let query = Group.findById(groupId);

  if (options.populateMembers) {
    query = query.populate("members.user", "name email profilePicture");
  }

  const group = await query;

  if (!group) {
    throw createHttpError(404, "Group not found");
  }

  const member = findGroupMember(group, userId);

  if (!member) {
    throw createHttpError(403, "Access Denied");
  }

  return {
    group,
    member,
  };
};

export const ensureGroupOwner = (member) => {
  if (member?.role !== "Owner") {
    throw createHttpError(403, "Only the group owner can perform this action");
  }
};
