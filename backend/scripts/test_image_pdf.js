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

const uploadTest = async () => {
  try {
    const dummyPdfPath = path.resolve("scripts", "sample.pdf");
    // fs.writeFileSync(dummyPdfPath, "%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    console.log("Uploading dummy PDF with resource_type: image...");
    const response = await cloudinary.uploader.upload(dummyPdfPath, {
      folder: "CHAT_FILES_TEST",
      resource_type: "image",
    });

    const url = response.secure_url;
    console.log("Upload Success!");
    console.log("URL:", url);

    https.get(url, (res) => {
      console.log("Status Code:", res.statusCode);
      if (res.statusCode === 200) {
        console.log("Success! PDF as image type is accessible.");
      } else {
        console.log("Failed. Status:", res.statusCode);
      }
    });

    fs.unlinkSync(dummyPdfPath);
  } catch (error) {
    console.error("Upload Failed:", error);
  }
};

uploadTest();
