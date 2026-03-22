import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const uploadTest = async () => {
  try {
    const dummyPdfPath = path.resolve("test_dummy.pdf");
    fs.writeFileSync(dummyPdfPath, "%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    console.log("Uploading dummy PDF with resource_type: raw...");
    const response = await cloudinary.uploader.upload(dummyPdfPath, {
      folder: "CHAT_FILES_TEST",
      resource_type: "raw",
    });

    console.log("Upload Success!");
    console.log("URL:", response.secure_url);

    fs.unlinkSync(dummyPdfPath);
  } catch (error) {
    console.error("Upload Failed:", error);
  }
};

uploadTest();
