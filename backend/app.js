// top of file
import express from "express";
import path from "path";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./database/db.js";
import fs from "fs";
import authRoutes from "./Routes/authRoutes.js";
import bookRoutes from "./Routes/bookRouter.js";
import userRoutes from "./Routes/userRoutes.js";
import borrowRoutes from "./Routes/borrowRoutes.js";
import digitalRoutes from "./Routes/digitalRoutes.js";
import paymentRoutes from "./Routes/paymentRouter.js";
import aiRoutes from "./Routes/aiRoutes.js";
import messageRoutes from "./Routes/messageRoutes.js"; // Added this line
import expressFileUpload from "express-fileupload";
import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";

export const app = express();
config(); // Load local .env first (secrets)
config({ path: "./config/config.env" }); // Load defaults second (non-sensitive)
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  expressFileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/book", bookRoutes);
app.use("/api/v1/borrow", borrowRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/digital", digitalRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/messages", messageRoutes); // Added this line
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

(async () => {
  await connectDB(); // ✅ just await it

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads", "chat");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  notifyUsers();
  removeUnverifiedAccounts();
})();

app.use(errorMiddleware);
