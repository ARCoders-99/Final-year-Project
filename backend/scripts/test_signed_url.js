import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const testSignedUrl = async () => {
  try {
    // Let's use the public_id from the last successful test upload
    // URL was: https://res.cloudinary.com/dhdfnbof5/image/upload/v1773989584/CHAT_FILES_TEST/t84oodbnkwlunzvu2dlm.pdf
    const publicId = "CHAT_FILES_TEST/t84oodbnkwlunzvu2dlm"; 
    
    console.log("Generating signed URL for publicId:", publicId);
    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      resource_type: "image", // Must match the upload type
      format: "pdf"
    });

    console.log("Signed URL:", signedUrl);

    https.get(signedUrl, (res) => {
      console.log("Signed URL Status Code:", res.statusCode);
      if (res.statusCode === 200) {
        console.log("Success! Signed URL works.");
      } else {
        console.log("Failed. Status:", res.statusCode);
      }
    });

  } catch (error) {
    console.error("Test Failed:", error);
  }
};

testSignedUrl();
