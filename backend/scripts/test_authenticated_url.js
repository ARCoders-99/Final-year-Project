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
    
    
    // For PDFs uploaded as image type
    const downloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
      resource_type: "image",
      attachment: true
    });


    https.get(downloadUrl, (res) => {
      if (res.statusCode === 200 || res.statusCode === 302) {
      } else {
      }
    });

  } catch (error) {
  }
};

testAuthenticatedUrl();
