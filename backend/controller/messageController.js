import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { getIO } from "../utils/socket.js";

// Fetch conversation between two users
export const getMessages = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Fetch the other user to check assignment
  const targetUser = await User.findById(userId).populate("assignedAdmin", "name avatar");
  const assignedAdmin = targetUser ? targetUser.assignedAdmin : null;

  const adminsList = await User.find({ role: "Admin" }).select("_id");
  const adminIdsList = adminsList.map(a => a._id);

  // Automatically mark those messages as read when fetching them
  const currentUser = await User.findById(currentUserId);
  if (currentUser && currentUser.role === "Admin") {
    await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(userId),
        receiver: { $in: adminIdsList },
        isRead: false
      },
      { $set: { isRead: true } }
    );
  } else {
    await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(userId),
        receiver: new mongoose.Types.ObjectId(currentUserId),
        isRead: false
      },
      { $set: { isRead: true } }
    );
  }

  const user = await User.findById(currentUserId);
  const isAdmin = user && user.role === "Admin";

  let query;
  if (isAdmin) {
    // If current user is admin, they should see messages between ANY admin and this user
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);
    query = {
      $or: [
        { sender: { $in: adminIds }, receiver: userId },
        { sender: userId, receiver: { $in: adminIds } },
      ],
    };
  } else {
    // For a regular user, fetch all messages between them and ANY admin.
    // This ensures messages from multiple admins all show up in their chat.
    const adminIds = adminIdsList;
    query = {
      $or: [
        // User sent a message to any admin
        { sender: currentUserId, receiver: { $in: adminIds } },
        // Any admin sent a message to the user
        { sender: { $in: adminIds }, receiver: currentUserId },
      ],
    };
  }

  const messages = await Message.find({
    ...query,
    deletedForEveryone: false,
    hiddenFor: { $ne: currentUserId },
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar role")
    .populate("receiver", "name avatar role");

  res.status(200).json({
    success: true,
    messages,
    assignedAdmin,
  });
});

// Admin: Get all users who have messaged the admin
export const getConversationsCount = catchAsyncErrors(async (req, res, next) => {
  const admins = await User.find({ role: "Admin" }).select("_id");
  const adminIds = admins.map(a => a._id);

  // Find all messages involving ANY admin
  const contacts = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: { $in: adminIds } }, { receiver: { $in: adminIds } }],
        deletedForEveryone: false,
        hiddenFor: { $ne: req.user._id }, // currentAdminId context for hiddenFor
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $in: ["$sender", adminIds] },
            "$receiver",
            "$sender",
          ],
        },
        lastMessage: { $first: "$content" },
        lastMessageTime: { $first: "$createdAt" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$receiver", adminIds] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $project: {
        _id: 1,
        lastMessage: 1,
        lastMessageTime: 1,
        unreadCount: 1,
        "userInfo.name": 1,
        "userInfo.email": 1,
        "userInfo.avatar": 1,
        "userInfo.isOnline": 1,
        "userInfo.lastSeen": 1,
        "userInfo.assignedAdmin": 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userInfo.assignedAdmin",
        foreignField: "_id",
        as: "assignedAdminInfo",
      },
    },
    {
      $addFields: {
        "userInfo.assignedAdmin": { $arrayElemAt: ["$assignedAdminInfo", 0] },
      },
    },
    {
      $project: {
        assignedAdminInfo: 0,
        "userInfo.assignedAdmin.password": 0,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    conversations: contacts,
  });
});

// Assign admin to a user conversation (Take Over)
export const assignAdmin = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const adminId = req.user._id;

  if (req.user.role !== "Admin") {
    return next(new ErrorHandler("Only admins can take over chats.", 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  user.assignedAdmin = adminId;
  await user.save();

  // Populate assigned admin name for response
  const updatedUser = await User.findById(userId).populate("assignedAdmin", "name avatar");

  // Notify all admins via socket
  try {
    const io = getIO();
    io.emit("adminAssigned", {
      userId,
      admin: {
        _id: updatedUser.assignedAdmin._id,
        name: updatedUser.assignedAdmin.name,
        avatar: updatedUser.assignedAdmin.avatar
      }
    });
  } catch (err) {
    // Socket emit failed
  }

  res.status(200).json({
    success: true,
    message: "Chat assigned successfully.",
    assignedAdmin: updatedUser.assignedAdmin,
  });
});

// Mark messages as read
export const markAsRead = catchAsyncErrors(async (req, res, next) => {
  const { senderId } = req.params;
  const receiverId = req.user._id;

  const currentUser = await User.findById(receiverId);
  const isAdmin = currentUser && currentUser.role === "Admin";

  let query;
  if (isAdmin) {
    const adminsList = await User.find({ role: "Admin" }).select("_id");
    const adminIdsList = adminsList.map(a => a._id);
    query = {
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: { $in: adminIdsList },
      isRead: false
    };
  } else {
    query = {
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      isRead: false
    };
  }

  const result = await Message.updateMany(
    query,
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: isAdmin ? "Messages marked as read for all admins" : "Messages marked as read",
    updatedCount: result.modifiedCount
  });
});

// Upload image/PDF to Cloudinary
export const uploadImage = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("File is required.", 400));
  }

  const file = req.files.image || req.files.file;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

  if (!allowedFormats.includes(file.mimetype)) {
    return next(new ErrorHandler("File format not supported. Only images and PDFs are allowed.", 400));
  }

  let uploadUrl = "";

  if (file.mimetype === "application/pdf") {
    // Save PDF locally
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "uploads", "chat");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    await file.mv(filePath);

    // Construct local URL - use req.headers.host for reliability
    const host = req.headers.host;
    uploadUrl = `${req.protocol}://${host}/uploads/chat/${fileName}`;

    // PDF Saved Locally
  } else {
    // Upload image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "CHAT_FILES",
    });

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      return next(new ErrorHandler("Failed to upload image to Cloudinary.", 500));
    }
    uploadUrl = cloudinaryResponse.secure_url;
  }

  res.status(200).json({
    success: true,
    url: uploadUrl,
    originalName: file.name,
  });
});

// Clear Chat (Hide for current user)
export const clearChat = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;
  const isAdmin = req.user.role === "Admin";

  let query;
  if (isAdmin) {
    // If Admin, clear messages between this user and any admin
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);
    query = {
      $or: [
        { sender: { $in: adminIds }, receiver: userId },
        { sender: userId, receiver: { $in: adminIds } },
      ],
    };
  } else {
    // If User, clear messages between them and any admin
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);
    query = {
      $or: [
        { sender: currentUserId, receiver: { $in: adminIds } },
        { sender: { $in: adminIds }, receiver: currentUserId },
      ],
    };
  }

  // Update all these messages to include currentUserId in hiddenFor array
  await Message.updateMany(query, {
    $addToSet: { hiddenFor: currentUserId }
  });

  res.status(200).json({
    success: true,
    message: "Chat history cleared successfully for you.",
  });
});
