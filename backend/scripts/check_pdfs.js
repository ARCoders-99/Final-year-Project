import mongoose from "mongoose";
import { Message } from "../models/messageModel.js";
import dotenv from "dotenv";

dotenv.config();

const checkPDFs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const pdfMessages = await Message.find({ messageType: "file" }).limit(5);

    await mongoose.connection.close();
  } catch (error) {
    process.exit(1);
  }
};

checkPDFs();
