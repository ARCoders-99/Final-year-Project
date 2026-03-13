import express from "express";
import { processText, analyzeStory, recommendBooksByMood } from "../controller/aiController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/process", isAuthenticated, processText);
router.post("/analyze", isAuthenticated, analyzeStory);
router.post("/recommend-by-mood", isAuthenticated, recommendBooksByMood);

export default router;
