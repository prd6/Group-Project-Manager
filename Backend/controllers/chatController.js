import Chat from "../models/Chat.js";
import {
  canManageChatMessage,
  CHAT_HISTORY_LIMIT,
  CHAT_MESSAGE_LIMIT,
  CHAT_MESSAGE_TYPES,
  createAndEmitChatMessage,
  emitChatCleared,
  emitChatEvent,
  isWithinEditDeleteWindow,
  populateChatQuery,
} from "../utils/chatService.js";
import {
  createHttpError,
  ensureGroupOwner,
  getAuthorizedGroup,
  validateObjectId,
} from "../utils/groupAccess.js";
import { SOCKET_EVENTS } from "../utils/socket.js";

const parseHistoryLimit = (rawLimit) => {
  const parsedLimit = Number.parseInt(rawLimit, 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return CHAT_HISTORY_LIMIT;
  }

  return Math.min(parsedLimit, 50);
};

const buildHistoryFilter = (groupId, before) => {
  const filter = {
    group: groupId,
  };

  if (before) {
    const beforeDate = new Date(before);

    if (Number.isNaN(beforeDate.getTime())) {
      throw createHttpError(400, "Invalid history cursor");
    }

    filter.createdAt = {
      $lt: beforeDate,
    };
  }

  return filter;
};

const getAuthorizedChatMessage = async (groupId, messageId, userId) => {
  await getAuthorizedGroup(groupId, userId);
  validateObjectId(messageId, "message id");

  const chat = await Chat.findOne({
    _id: messageId,
    group: groupId,
  });

  if (!chat) {
    throw createHttpError(404, "Message not found");
  }

  return chat;
};

// GET GROUP CHAT MESSAGES
export const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { before, limit } = req.query;

    const { group, member } = await getAuthorizedGroup(groupId, req.user.id);
    const pageSize = parseHistoryLimit(limit);
    const filter = buildHistoryFilter(groupId, before);

    const chats = await populateChatQuery(
      Chat.find(filter).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1)
    );

    const hasMore = chats.length > pageSize;
    const pagedChats = hasMore ? chats.slice(0, pageSize) : chats;
    const orderedChats = pagedChats.reverse();
    const oldestChat = orderedChats[0];

    return res.status(200).json({
      success: true,
      chats: orderedChats,
      pagination: {
        hasMore,
        nextCursor: hasMore && oldestChat ? oldestChat.createdAt : null,
      },
      group: {
        _id: group._id,
        groupName: group.groupName,
        currentUserRole: member.role,
      },
    });
  } catch (error) {
    console.error("Get chat error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to load messages",
    });
  }
};

// SEND CHAT MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const content = req.body.content?.trim?.() || "";

    await getAuthorizedGroup(groupId, req.user.id);

    if (!content) {
      throw createHttpError(400, "Message cannot be empty");
    }

    if (content.length > CHAT_MESSAGE_LIMIT) {
      throw createHttpError(
        400,
        `Message must be ${CHAT_MESSAGE_LIMIT} characters or less`
      );
    }

    const chat = await createAndEmitChatMessage({
      groupId,
      senderId: req.user.id,
      content,
      type: CHAT_MESSAGE_TYPES.TEXT,
    });

    return res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Send chat error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

// EDIT OWN CHAT MESSAGE
export const editMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const content = req.body.content?.trim?.() || "";

    if (!content) {
      throw createHttpError(400, "Message cannot be empty");
    }

    if (content.length > CHAT_MESSAGE_LIMIT) {
      throw createHttpError(
        400,
        `Message must be ${CHAT_MESSAGE_LIMIT} characters or less`
      );
    }

    const chat = await getAuthorizedChatMessage(groupId, messageId, req.user.id);

    if (!canManageChatMessage(chat, req.user.id)) {
      throw createHttpError(403, "You can only edit your own text messages");
    }

    if (!isWithinEditDeleteWindow(chat)) {
      throw createHttpError(403, "Messages can only be edited within 24 hours");
    }

    chat.content = content;
    chat.isEdited = true;

    await chat.save();

    const updatedChat = await populateChatQuery(Chat.findById(chat._id));
    emitChatEvent(groupId, SOCKET_EVENTS.CHAT_UPDATED, updatedChat);

    return res.status(200).json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Edit chat error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to edit message",
    });
  }
};

// SOFT DELETE OWN CHAT MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const chat = await getAuthorizedChatMessage(groupId, messageId, req.user.id);

    if (!canManageChatMessage(chat, req.user.id)) {
      throw createHttpError(403, "You can only delete your own text messages");
    }

    if (!isWithinEditDeleteWindow(chat)) {
      throw createHttpError(403, "Messages can only be deleted within 24 hours");
    }

    chat.content = "This message was deleted";
    chat.isDeleted = true;
    chat.deletedAt = new Date();
    chat.isEdited = false;

    await chat.save();

    const deletedChat = await populateChatQuery(Chat.findById(chat._id));
    emitChatEvent(groupId, SOCKET_EVENTS.CHAT_DELETED, deletedChat);

    return res.status(200).json({
      success: true,
      chat: deletedChat,
    });
  } catch (error) {
    console.error("Delete chat error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

// CLEAR GROUP CHAT
export const clearGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { member } = await getAuthorizedGroup(groupId, req.user.id);

    ensureGroupOwner(member);

    await Chat.deleteMany({
      group: groupId,
    });

    emitChatCleared(groupId);

    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    console.error("Clear chat error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to clear chat history",
    });
  }
};
