import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Fetch conversation between two users
export const getMessages = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Automatically mark those messages as read when fetching them
  await Message.updateMany(
    { 
      sender: new mongoose.Types.ObjectId(userId), 
      receiver: new mongoose.Types.ObjectId(currentUserId), 
      isRead: false 
    },
    { $set: { isRead: true } }
  );

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
    deletedForEveryone: false,
    hiddenFor: { $ne: currentUserId },
  }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    messages,
  });
});

// Admin: Get all users who have messaged the admin
export const getConversationsCount = catchAsyncErrors(async (req, res, next) => {
  const adminId = new mongoose.Types.ObjectId(req.user._id);

  // Find all messages involving the admin
  const contacts = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: adminId }, { receiver: adminId }],
        deletedForEveryone: false,
        hiddenFor: { $ne: adminId },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", adminId] },
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
                  { $eq: ["$receiver", adminId] },
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
      },
    },
  ]);

  res.status(200).json({
    success: true,
    conversations: contacts,
  });
});

// Mark messages as read
export const markAsRead = catchAsyncErrors(async (req, res, next) => {
  const { senderId } = req.params;
  const receiverId = req.user._id;

  const result = await Message.updateMany(
    { 
      sender: new mongoose.Types.ObjectId(senderId), 
      receiver: new mongoose.Types.ObjectId(receiverId), 
      isRead: false 
    },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
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
    
    console.log("PDF Saved Locally:", filePath);
    console.log("PDF URL Generated:", uploadUrl);
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
