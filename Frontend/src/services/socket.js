import { io } from "socket.io-client";
import { API_ORIGIN } from "./apiConfig";

const socket = io(API_ORIGIN, {
  autoConnect: false,
  transports: ["websocket"],
});

export const getSocketToken = () => localStorage.getItem("token") || "";

export const connectSocket = () => {
  socket.auth = {
    token: getSocketToken(),
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
