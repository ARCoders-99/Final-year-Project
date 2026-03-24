import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import { addNewAdminSchema } from "../utils/validationSchema.js";

export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ accountVerified: true });

  res.status(200).json({
    success: true,
    users,
  });
});

export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Admin avatar is required.", 400));
  }

  const { name, email, password } = addNewAdminSchema.parse(req.body);

  const isRegistered = await User.findOne({ email, accountVerified: true });

  if (isRegistered) {
    return next(new ErrorHandler("User already registered.", 400));
  }
  const avatar = req.files.avatar;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const cloudinaryResponse = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    {
      folder: "LIBRARY_MANAGEMENT_SYSTEM_ADMIN_AVATARS",
    }
  );

  if (!cloudinaryResponse || cloudinaryResponse.error) {
    return next(
      new ErrorHandler("Failed to upload avatar to cloudinary.", 500)
    );
  }
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "Admin",
    accountVerified: true,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Admin registered successfully.",
    admin,
  });
});

export const getAdmin = catchAsyncErrors(async (req, res, next) => {
  // Find an online admin first
  let admin = await User.findOne({ role: "Admin", isOnline: true }).select("name email avatar isOnline lastSeen");

  // Fallback to any admin if none are online
  if (!admin) {
    admin = await User.findOne({ role: "Admin" }).select("name email avatar isOnline lastSeen");
  }

  if (!admin) {
    return next(new ErrorHandler("Admin not found.", 404));
  }

  res.status(200).json({
    success: true,
    admin,
  });
});

// Search users for admin chat
export const searchUsers = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(200).json({ success: true, users: [] });
  }

  // Find users whose name or email matches the query, excluding admins
  const users = await User.find({
    role: "User",
    accountVerified: true,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  }).select("name email avatar isOnline lastSeen _id");

  res.status(200).json({
    success: true,
    users,
  });
});
