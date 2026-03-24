import mongoose from "mongoose";
import { Message } from "../models/messageModel.js";
import dotenv from "dotenv";

dotenv.config();

const checkImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const imageMessages = await Message.find({ messageType: "image" }).limit(3);

    await mongoose.connection.close();
  } catch (error) {
    process.exit(1);
  }
};

checkImages();
