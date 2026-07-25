let ioInstance = null;

// ==========================================
// SOCKET EVENTS
// ==========================================

export const SOCKET_EVENTS = {
  GROUP_JOIN: "group:join",
  GROUP_JOINED: "group:joined",
  GROUP_LEAVE: "group:leave",

  CHAT_NEW: "chat:new",
  CHAT_UPDATED: "chat:updated",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",
};

// ==========================================
// GROUP ROOM
// ==========================================

export const getGroupRoom = (groupId) => {
  if (!groupId) {
    throw new Error(
      "groupId is required to create a Socket.IO room"
    );
  }

  return `group:${groupId.toString()}`;
};

// ==========================================
// SET SOCKET.IO INSTANCE
// ==========================================

export const setIO = (io) => {
  if (!io) {
    throw new Error(
      "Socket.IO instance is required"
    );
  }

  ioInstance = io;

  return ioInstance;
};

// ==========================================
// GET SOCKET.IO INSTANCE
// ==========================================

export const getIO = () => {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO is not initialized"
    );
  }

  return ioInstance;
};

// ==========================================
// EMIT TO GROUP
// ==========================================

export const emitToGroup = (
  groupId,
  eventName,
  payload
) => {
  if (!groupId) {
    throw new Error(
      "groupId is required to emit a socket event"
    );
  }

  if (
    typeof eventName !== "string" ||
    !eventName.trim()
  ) {
    throw new Error(
      "A valid Socket.IO event name is required"
    );
  }

  const io = getIO();

  const room =
    getGroupRoom(groupId);

  io.to(room).emit(
    eventName,
    payload
  );
};