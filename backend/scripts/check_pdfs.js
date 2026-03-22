import mongoose from "mongoose";
import { Message } from "../models/messageModel.js";
import dotenv from "dotenv";

dotenv.config();

const checkPDFs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const pdfMessages = await Message.find({ messageType: "file" }).limit(5);
    console.log("PDF Messages:", JSON.stringify(pdfMessages, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkPDFs();
