import { Server } from "socket.io";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";

let io;
const userSocketMap = {}; // { userId: socketId }

const broadcastAdminStatus = async () => {
  try {
    const onlineAdmin = await User.findOne({
      role: "Admin",
      isOnline: true,
    });

    if (io) {
      io.emit("adminStatusUpdate", {
        isOnline: !!onlineAdmin,
      });
      console.log(`Broadcasted collective admin status: ${!!onlineAdmin ? 'Online' : 'Offline'}`);
    }
  } catch (err) {
    console.error("Error broadcasting admin status:", err);
  }
};

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

      // Update user status to online
      const user = await User.findByIdAndUpdate(userId, { isOnline: true }, { new: true });
      io.emit("userStatusUpdate", { userId, isOnline: true });

      if (user && user.role === "Admin") {
        await broadcastAdminStatus();
      }
    }

    // Handle sending message
    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, content, messageType, fileName } = data;
      try {
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          messageType: messageType || "text",
          fileName: fileName || null,
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "name avatar role")
          .populate("receiver", "name avatar role");

        if (populatedMessage.receiver?.role === "Admin") {
          const allAdmins = await User.find({ role: "Admin" });
          allAdmins.forEach(admin => io.to(String(admin._id)).emit("newMessage", populatedMessage));
        } else {
          io.to(receiverId).emit("newMessage", populatedMessage);
          const allAdmins = await User.find({ role: "Admin" });
          allAdmins.forEach(admin => io.to(String(admin._id)).emit("newMessage", populatedMessage));
        }
        io.to(senderId).emit("messageSent", populatedMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Handle editing, read, delete (simplified but functional)
    socket.on("editMessage", async (data) => {
      const { messageId, senderId, newContent } = data;
      try {
        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId, sender: senderId },
          { content: newContent, isEdited: true },
          { new: true }
        ).populate("sender", "name avatar").populate("receiver", "name avatar");
        if (updatedMessage) {
          io.to(String(updatedMessage.sender._id)).emit("messageUpdated", updatedMessage);
          io.to(String(updatedMessage.receiver._id)).emit("messageUpdated", updatedMessage);
          if (updatedMessage.receiver?.role === "Admin") {
            const allAdmins = await User.find({ role: "Admin" });
            allAdmins.forEach(admin => io.to(String(admin._id)).emit("messageUpdated", updatedMessage));
          }
        }
      } catch (err) { }
    });

    socket.on("markAsRead", async (data) => {
      const { senderId, receiverId } = data;
      try {
        await Message.updateMany({ sender: senderId, receiver: receiverId, isRead: false }, { isRead: true });
        io.to(senderId).emit("messagesRead", { readerId: receiverId });
      } catch (err) { }
    });

    socket.on("deleteMessage", async (data) => {
      const { messageId, userId, mode } = data;
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (mode === "everyone" && String(msg.sender) === String(userId)) {
          msg.deletedForEveryone = true;
          await msg.save();
          io.to(String(msg.sender)).emit("messageDeleted", { messageId, mode: "everyone" });
          io.to(String(msg.receiver)).emit("messageDeleted", { messageId, mode: "everyone" });
        } else {
          if (!msg.hiddenFor.includes(userId)) msg.hiddenFor.push(userId);
          await msg.save();
          io.to(String(userId)).emit("messageDeleted", { messageId, mode: "me", userId });
        }
      } catch (err) { }
    });

    socket.on("disconnect", async () => {
      if (userId && userId !== "undefined") {
        userSocketMap[userId]--;
        if (userSocketMap[userId] <= 0) {
          delete userSocketMap[userId];
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: Date.now() });
          io.emit("userStatusUpdate", { userId, isOnline: false, lastSeen: new Date() });

          const user = await User.findById(userId);
          if (user && user.role === "Admin") {
            await broadcastAdminStatus();
          }
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
