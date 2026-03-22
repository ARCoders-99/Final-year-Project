import express from "express"

import { forgotPassword, getUser, login, adminLogin, logout, register, resetPassword, socialLogin, updatePassword, updateProfile, verifyForgotPasswordOtp, verifyOtp, uploadAvatar } from "../controller/authController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router()

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.post("/password/forgot", forgotPassword);
router.post("/password/verify-otp", verifyForgotPasswordOtp);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);
router.put("/profile/update", isAuthenticated, updateProfile);
router.post("/avatar", isAuthenticated, uploadAvatar);
router.post("/social-login", socialLogin);

export default router;