import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

let socket;

export const initiateSocket = (userId) => {
  if (socket && socket.connected) {
    if (socket.io.opts.query.userId === userId) return socket;
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    query: { userId },
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const getSocket = () => socket;
