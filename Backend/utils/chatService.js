import Chat from "../models/Chat.js";
import {
  emitToGroup,
  SOCKET_EVENTS,
} from "./socket.js";

// ==========================================
// CHAT CONSTANTS
// ==========================================

export const CHAT_MESSAGE_LIMIT = 2000;

export const CHAT_HISTORY_LIMIT = 40;

export const CHAT_EDIT_DELETE_WINDOW_MS =
  24 * 60 * 60 * 1000;

export const CHAT_MESSAGE_TYPES = {
  TEXT: "text",
  FILE_UPLOAD: "file_upload",
  FILE_DELETE: "file_delete",
  SYSTEM: "system",
};

// ==========================================
// HELPERS
// ==========================================

export const getChatType = (chat) =>
  chat?.type ||
  CHAT_MESSAGE_TYPES.TEXT;

export const populateChatQuery = (
  query
) =>
  query.populate(
    "sender",
    "name email profilePicture"
  );

// ==========================================
// CREATE MESSAGE
// ==========================================

export const createChatMessage =
  async ({
    groupId,
    senderId,
    content,
    type = CHAT_MESSAGE_TYPES.TEXT,
    metadata = {},
  }) => {
    if (!groupId) {
      throw new Error(
        "groupId is required to create a chat message"
      );
    }

    if (!senderId) {
      throw new Error(
        "senderId is required to create a chat message"
      );
    }

    const normalizedContent =
      String(content || "").trim();

    if (!normalizedContent) {
      throw new Error(
        "Chat message content cannot be empty"
      );
    }

    if (
      normalizedContent.length >
      CHAT_MESSAGE_LIMIT
    ) {
      throw new Error(
        `Chat message cannot exceed ${CHAT_MESSAGE_LIMIT} characters`
      );
    }

    const chat = await Chat.create({
      group: groupId,
      sender: senderId,
      content: normalizedContent,
      type,
      metadata,
    });

    return populateChatQuery(
      Chat.findById(chat._id)
    );
  };

// ==========================================
// EMIT CHAT EVENT
// ==========================================

export const emitChatEvent = (
  groupId,
  eventName,
  chat
) => {
  if (!groupId || !eventName) {
    return;
  }

  emitToGroup(
    groupId,
    eventName,
    {
      groupId:
        groupId.toString(),

      chat,
    }
  );
};

// ==========================================
// CHAT CLEARED EVENT
// ==========================================

export const emitChatCleared = (
  groupId
) => {
  if (!groupId) {
    return;
  }

  emitToGroup(
    groupId,
    SOCKET_EVENTS.CHAT_CLEARED,
    {
      groupId:
        groupId.toString(),

      clearedAt:
        new Date().toISOString(),
    }
  );
};

// ==========================================
// CREATE + EMIT
// ==========================================

export const createAndEmitChatMessage =
  async (messageInput) => {
    const chat =
      await createChatMessage(
        messageInput
      );

    emitChatEvent(
      messageInput.groupId,
      SOCKET_EVENTS.CHAT_NEW,
      chat
    );

    return chat;
  };

// ==========================================
// FILE ACTIVITY MESSAGE
// ==========================================

export const createFileActivityMessage =
  async ({
    groupId,
    actor,
    file,
    type,
  }) => {
    const actorId =
      actor?._id ||
      actor?.id;

    if (!actorId) {
      throw new Error(
        "File activity actor is required"
      );
    }

    if (
      type !==
        CHAT_MESSAGE_TYPES.FILE_UPLOAD &&
      type !==
        CHAT_MESSAGE_TYPES.FILE_DELETE
    ) {
      throw new Error(
        "Invalid file activity type"
      );
    }

    const actorName =
      actor?.name?.trim?.() ||
      "A member";

    const fileName =
      file?.originalName ||
      "a file";

    const isDelete =
      type ===
      CHAT_MESSAGE_TYPES.FILE_DELETE;

    const actionVerb =
      isDelete
        ? "deleted"
        : "uploaded";

    const metadata = {
      fileName,
      actorId,
    };

    /*
     * Keep the File reference only while the
     * File document actually exists.
     *
     * A deletion activity should not reference
     * a File document that has already been
     * permanently deleted.
     */
    if (
      !isDelete &&
      file?._id
    ) {
      metadata.fileId =
        file._id;
    }

    return createAndEmitChatMessage({
      groupId,

      senderId:
        actorId,

      type,

      content:
        `${actorName} ${actionVerb} "${fileName}"`,

      metadata,
    });
  };

// ==========================================
// MESSAGE MANAGEMENT
// ==========================================

export const canManageChatMessage = (
  chat,
  userId
) => {
  if (
    !chat ||
    !userId ||
    chat.isDeleted
  ) {
    return false;
  }

  if (
    getChatType(chat) !==
    CHAT_MESSAGE_TYPES.TEXT
  ) {
    return false;
  }

  /*
   * sender may either be an ObjectId or a
   * populated User document.
   */
  const senderId =
    chat.sender?._id ||
    chat.sender;

  return (
    senderId?.toString?.() ===
    userId.toString()
  );
};

// ==========================================
// EDIT / DELETE WINDOW
// ==========================================

export const isWithinEditDeleteWindow = (
  chat
) => {
  if (!chat?.createdAt) {
    return false;
  }

  const createdAt =
    new Date(
      chat.createdAt
    ).getTime();

  if (
    Number.isNaN(createdAt)
  ) {
    return false;
  }

  const age =
    Date.now() -
    createdAt;

  return (
    age >= 0 &&
    age <=
      CHAT_EDIT_DELETE_WINDOW_MS
  );
};