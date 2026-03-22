import mongoose from "mongoose";
import { Message } from "../models/messageModel.js";
import dotenv from "dotenv";

dotenv.config();

const checkImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const imageMessages = await Message.find({ messageType: "image" }).limit(3);
    console.log("Image Messages:", JSON.stringify(imageMessages, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkImages();
