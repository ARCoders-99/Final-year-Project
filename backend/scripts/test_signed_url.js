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
    
    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      resource_type: "image", // Must match the upload type
      format: "pdf"
    });


    https.get(signedUrl, (res) => {
      if (res.statusCode === 200) {
      } else {
      }
    });

  } catch (error) {
  }
};

testSignedUrl();
