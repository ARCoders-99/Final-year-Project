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
  console.log(`Connecting socket for user: ${userId}`);
  return socket;
};

export const disconnectSocket = () => {
  console.log("Disconnecting socket...");
  if (socket) socket.disconnect();
};

export const getSocket = () => socket;
