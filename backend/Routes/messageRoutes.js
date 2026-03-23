import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { getMessages, getConversationsCount, markAsRead, uploadImage, assignAdmin, clearChat } from "../controller/messageController.js";

const router = express.Router();

router.get("/:userId", isAuthenticated, getMessages);
router.get("/admin/conversations", isAuthenticated, getConversationsCount);
router.put("/assign/:userId", isAuthenticated, assignAdmin);
router.put("/read/:senderId", isAuthenticated, markAsRead);
router.put("/clear/:userId", isAuthenticated, clearChat);
router.post("/upload-image", isAuthenticated, uploadImage);

export default router;
