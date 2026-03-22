import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const testAuthenticatedUrl = async () => {
  try {
    const publicId = "CHAT_FILES_TEST/t84oodbnkwlunzvu2dlm"; 
    
    console.log("Generating private download URL for publicId:", publicId);
    
    // For PDFs uploaded as image type
    const downloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
      resource_type: "image",
      attachment: true
    });

    console.log("Download URL:", downloadUrl);

    https.get(downloadUrl, (res) => {
      console.log("Download URL Status Code:", res.statusCode);
      if (res.statusCode === 200 || res.statusCode === 302) {
        console.log("Success! Authenticated URL works.");
      } else {
        console.log("Failed. Status:", res.statusCode);
      }
    });

  } catch (error) {
    console.error("Test Failed:", error);
  }
};

testAuthenticatedUrl();
