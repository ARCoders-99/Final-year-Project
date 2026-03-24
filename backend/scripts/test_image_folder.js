import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import https from "https";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const testInImageFolder = async () => {
  try {
    const pdfPath = path.resolve("scripts", "sample.pdf");
    
    const uploadResponse = await cloudinary.uploader.upload(pdfPath, {
      folder: "CHAT_IMAGES",
      resource_type: "image", // Must be image to be in this folder usually
    });


    https.get(uploadResponse.secure_url, (res) => {
      if (res.statusCode === 200) {
      } else {
      }
    });

  } catch (error) {
  }
};

testInImageFolder();
