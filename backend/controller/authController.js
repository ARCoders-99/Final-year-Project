import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generateForgotPasswordEmailTemplate, generateForgotPasswordOtpEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { loginSchema, registerSchema, updatePasswordSchema, updateProfileSchema } from "../utils/validationSchema.js";

// Social Login
export const socialLogin = catchAsyncErrors(async (req, res, next) => {
  const { name, email, uid } = req.body;

  if (!email || !name) {
    return next(new ErrorHandler("Social login details missing.", 400));
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    // Automatically create a new account
    const randomPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      accountVerified: true,
      role: "User",
    });
  }

  sendToken(user, 200, "Logged in successfully.", res);
});



export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = registerSchema.parse(req.body);

  // Check if user already registered
  const isRegistered = await User.findOne({ email, accountVerified: true });
  if (isRegistered) {
    return next(new ErrorHandler("User already exists", 400));
  }

  // Too many failed attempts
  const registerAttempts = await User.find({ email, accountVerified: false });
  if (registerAttempts.length >= 5) {
    return next(
      new ErrorHandler(
        "You have exceeded the number of registration attempts. Please contact support.",
        400
      )
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user instance (not saved yet)
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });

  // Generate verification code & save once
  const verificationCode = await user.generateVerificationCode();
  await user.save();

  // Send verification email
  await sendVerificationCode(verificationCode, email);

  res.status(201).json({
    success: true,
    message: "Registration successful. Verification code sent to email.",
  });
});

export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler("Email or Otp is missing", 400));
  }
  try {
    const userAllentries = await User.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 });
    if (!userAllentries) {
      return next(new ErrorHandler("User not found", 404));
    }

    let user;
    if (userAllentries.length > 1) {
      user = userAllentries[0];
      await User.deleteMany({
        _id: { $ne: user._id },
        email,
        accountVerified: false,
      });
    } else {
      user = userAllentries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid Otp", 400));
    }
    const CurruntTime = Date.now();

    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();

    if (CurruntTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired", 400));
    }
    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified", res);
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );

  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  sendToken(user, 200, "Logged in successfully.", res);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ErrorHandler("Email is required", 400));
  }
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });

  if (!user) {
    return next(new ErrorHandler("Invalid email.", 400));
  }

  // Generate 5-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();

  // Hash OTP and save to resetPasswordToken
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const message = generateForgotPasswordOtpEmailTemplate(otp);

  try {
    await sendEmail({
      email: user.email,
      subject: "Bookworm Password Recovery OTP",
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

export const verifyForgotPasswordOtp = catchAsyncErrors(
  async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new ErrorHandler("Email and OTP are required.", 400));
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler("Invalid or expired OTP.", 400));
    }

    res.status(200).json({
      success: true,
      message: "OTP verified. You can now reset your password.",
      token: otp, // Return raw OTP as token for resetPassword
    });
  }
);

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired",
        400
      )
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & confirm password do not match.", 400)
    );
  }

  if (
    req.body.password.length < 8 ||
    req.body.password.length > 16 ||
    req.body.confirmPassword.length < 8 ||
    req.body.confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please login with your new password.",
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { currentPassword, newPassword, confirmNewPassword } = updatePasswordSchema.parse(req.body);

  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current password is incorrect.", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated.",
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { name, email, oldPassword, newPassword } = updateProfileSchema.parse(req.body);

  if (email && email !== user.email) {
    const isEmailTaken = await User.findOne({ email, accountVerified: true });
    if (isEmailTaken) {
      return next(new ErrorHandler("Email already in use by another account.", 400));
    }
    user.email = email;
  }

  if (name) user.name = name;

  if (oldPassword && newPassword) {
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Current password is incorrect.", 400));
    }

    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});
