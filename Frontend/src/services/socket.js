import { io } from "socket.io-client";
import { API_ORIGIN } from "./apiConfig";

const socket = io(API_ORIGIN, {
    autoConnect: false,
    transports: ["websocket"],

    // Better reconnection behavior
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 15000,
});

export const getSocketToken = () =>
    localStorage.getItem("token") || "";

export const connectSocket = () => {
    // Always refresh the token before connecting
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

// Refresh auth before every reconnect
socket.on("reconnect_attempt", () => {
    socket.auth = {
        token: getSocketToken(),
    };
});

export default socket;