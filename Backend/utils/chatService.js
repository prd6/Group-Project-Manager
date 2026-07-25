import Chat from "../models/Chat.js";
import { emitToGroup, SOCKET_EVENTS } from "./socket.js";

export const CHAT_MESSAGE_LIMIT = 2000;
export const CHAT_HISTORY_LIMIT = 40;
export const CHAT_EDIT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const CHAT_MESSAGE_TYPES = {
  TEXT: "text",
  FILE_UPLOAD: "file_upload",
  FILE_DELETE: "file_delete",
  SYSTEM: "system",
};

export const getChatType = (chat) => chat?.type || CHAT_MESSAGE_TYPES.TEXT;

export const populateChatQuery = (query) =>
  query.populate("sender", "name email profilePicture");

export const createChatMessage = async ({
  groupId,
  senderId,
  content,
  type = CHAT_MESSAGE_TYPES.TEXT,
  metadata = {},
}) => {
  const chat = await Chat.create({
    group: groupId,
    sender: senderId,
    content,
    type,
    metadata,
  });

  return populateChatQuery(Chat.findById(chat._id));
};

export const emitChatEvent = (groupId, eventName, chat) => {
  emitToGroup(groupId, eventName, {
    groupId: groupId.toString(),
    chat,
  });
};

export const emitChatCleared = (groupId) => {
  emitToGroup(groupId, SOCKET_EVENTS.CHAT_CLEARED, {
    groupId: groupId.toString(),
    clearedAt: new Date().toISOString(),
  });
};

export const createAndEmitChatMessage = async (messageInput) => {
  const chat = await createChatMessage(messageInput);
  emitChatEvent(messageInput.groupId, SOCKET_EVENTS.CHAT_NEW, chat);
  return chat;
};

export const createFileActivityMessage = async ({
  groupId,
  actor,
  file,
  type,
}) => {
  const actorName = actor?.name || "A member";
  const fileName = file?.originalName || "a file";
  const actionVerb =
    type === CHAT_MESSAGE_TYPES.FILE_DELETE ? "deleted" : "uploaded";

  return createAndEmitChatMessage({
    groupId,
    senderId: actor._id || actor.id,
    type,
    content: `${actorName} ${actionVerb} "${fileName}"`,
    metadata: {
      fileId: file?._id,
      fileName,
      actorId: actor?._id || actor?.id,
    },
  });
};

export const canManageChatMessage = (chat, userId) =>
  getChatType(chat) === CHAT_MESSAGE_TYPES.TEXT &&
  !chat?.isDeleted &&
  chat?.sender?.toString?.() === userId.toString();

export const isWithinEditDeleteWindow = (chat) => {
  const createdAt = new Date(chat.createdAt).getTime();
  return Date.now() - createdAt <= CHAT_EDIT_DELETE_WINDOW_MS;
};
