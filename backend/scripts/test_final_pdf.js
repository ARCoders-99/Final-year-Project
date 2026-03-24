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

const testSignedUpload = async () => {
  try {
    const pdfPath = path.resolve("scripts", "sample.pdf");
    fs.writeFileSync(pdfPath, "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\ntrailer\n<< /Size 4 /Root 1 0 R >>\n%%EOF");
    
    const uploadResponse = await cloudinary.uploader.upload(pdfPath, {
      folder: "CHAT_FILES_FINAL",
      resource_type: "auto",
    });


    // Now try a signed URL
    const signedUrl = cloudinary.url(uploadResponse.public_id, {
        sign_url: true,
        resource_type: uploadResponse.resource_type,
        secure: true,
        version: uploadResponse.version,
        format: uploadResponse.format
    });


    https.get(signedUrl, (res) => {
      if (res.statusCode === 200) {
      } else {
      }
    });

  } catch (error) {
  }
};

testSignedUpload();
