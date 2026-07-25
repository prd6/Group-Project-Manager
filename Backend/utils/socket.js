let ioInstance = null;

export const SOCKET_EVENTS = {
  GROUP_JOIN: "group:join",
  GROUP_JOINED: "group:joined",
  GROUP_LEAVE: "group:leave",

  CHAT_NEW: "chat:new",
  CHAT_UPDATED: "chat:updated",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",
};

export const getGroupRoom = (groupId) => {
  return `group:${groupId}`;
};

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO is not initialized");
  }

  return ioInstance;
};

export const emitToGroup = (
  groupId,
  eventName,
  payload
) => {
  const io = getIO();

  const room = getGroupRoom(
    groupId.toString()
  );

  io.to(room).emit(eventName, payload);
};