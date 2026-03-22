import { Server } from "socket.io";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";

let io;
const userSocketMap = {}; // { userId: socketId }

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId} (Socket: ${socket.id})`);

    if (userId && userId !== "undefined") {
      socket.join(userId); // Join a room named after the userId
      userSocketMap[userId] = (userSocketMap[userId] || 0) + 1;
      console.log(`User ${userId} joined room. Active sessions: ${userSocketMap[userId]}`);

      // Update user status to online
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatusUpdate", { userId, isOnline: true });
    }

    // Handle sending message
    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, content, messageType, fileName } = data;
      console.log(`Message from ${senderId} to ${receiverId}: ${content.substring(0, 20)}...`);

      try {
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          messageType: messageType || "text",
          fileName: fileName || null,
        });

        // Emit to the receiver's room (all their tabs)
        io.to(receiverId).emit("newMessage", newMessage);
        console.log(`Emitted newMessage to room: ${receiverId}`);

        // Emit back to sender's room (all their tabs)
        io.to(senderId).emit("messageSent", newMessage);
        console.log(`Emitted messageSent to room: ${senderId}`);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Handle editing message
    socket.on("editMessage", async (data) => {
      const { messageId, senderId, newContent } = data;
      console.log(`BACKEND: editMessage event received - ID: ${messageId}, User: ${senderId}`);

      try {
        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId, sender: senderId }, // Security check: must be sender
          { content: newContent, isEdited: true },
          { new: true }
        );

        if (updatedMessage) {
          // Broadcast update to both rooms based on the message record
          const sId = String(updatedMessage.sender);
          const rId = String(updatedMessage.receiver);
          io.to(sId).emit("messageUpdated", updatedMessage);
          io.to(rId).emit("messageUpdated", updatedMessage);
          console.log(`BACKEND: Emitted messageUpdated for ${messageId} to rooms ${sId} and ${rId}`);
        } else {
          console.warn(`BACKEND: Message ${messageId} not found or user ${senderId} is not the sender`);
        }
      } catch (error) {
        console.error("BACKEND ERROR: Error editing message:", error);
      }
    });

    // Handle marking messages as read via socket
    socket.on("markAsRead", async (data) => {
      const { senderId, receiverId } = data;
      console.log(`Marking messages from ${senderId} as read by ${receiverId}`);

      try {
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, isRead: false },
          { isRead: true }
        );

        // Notify the sender that their messages were read
        io.to(senderId).emit("messagesRead", { readerId: receiverId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle deleting message
    socket.on("deleteMessage", async (data) => {
      const { messageId, userId, mode } = data; // mode: "me" or "everyone"
      console.log(`BACKEND: deleteMessage event received - ID: ${messageId}, User: ${userId}, Mode: ${mode}`);

      try {
        const msg = await Message.findById(messageId);
        if (!msg) {
          console.warn(`BACKEND: Message ${messageId} not found for deletion`);
          return;
        }

        if (mode === "everyone") {
          // Check if sender and within 15 mins
          const isSender = String(msg.sender) === String(userId);
          const now = new Date();
          const diff = (now - msg.createdAt) / (1000 * 60);
          console.log(`BACKEND: Deleting for everyone - isSender: ${isSender}, minsAgo: ${diff}`);

          if (isSender && diff < 15) {
            msg.deletedForEveryone = true;
            await msg.save();
            
            // Broadcast to both participants
            const sId = String(msg.sender);
            const rId = String(msg.receiver);
            io.to(sId).emit("messageDeleted", { messageId, mode: "everyone" });
            io.to(rId).emit("messageDeleted", { messageId, mode: "everyone" });
            console.log(`BACKEND: Emitted messageDeleted (everyone) to rooms ${sId} and ${rId}`);
          } else {
            console.warn(`BACKEND: Delete for everyone blocked. isSender: ${isSender}, diff: ${diff}`);
          }
        } else {
          // Delete for me
          console.log(`BACKEND: Deleting for me - user: ${userId}`);
          if (!msg.hiddenFor.includes(userId)) {
            msg.hiddenFor.push(userId);
            await msg.save();
          }
          // Only notify the user who deleted it (to update their local state)
          io.to(String(userId)).emit("messageDeleted", { messageId, mode: "me", userId });
          console.log(`BACKEND: Emitted messageDeleted (me) to room ${userId}`);
        }
      } catch (error) {
        console.error("BACKEND ERROR: Error deleting message:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      if (userId && userId !== "undefined") {
        userSocketMap[userId]--;
        
        if (userSocketMap[userId] <= 0) {
          delete userSocketMap[userId];
          // Only update status to offline if NO sessions remain
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: Date.now(),
          });

          io.emit("userStatusUpdate", {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
          console.log(`User ${userId} is now fully offline`);
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
