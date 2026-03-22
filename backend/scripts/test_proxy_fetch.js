import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const testProxyFetch = async () => {
  const url = "https://res.cloudinary.com/dhdfnbof5/image/upload/v1773989584/CHAT_FILES_TEST/t84oodbnkwlunzvu2dlm.pdf";
  
  console.log("Fetching from Cloudinary proxy-style...");
  https.get(url, (res) => {
    console.log("Fetch Status Code:", res.statusCode);
    console.log("Headers:", res.headers['content-type']);
    
    if (res.statusCode === 200) {
      console.log("Success! Backend can fetch the file.");
    } else {
      console.log("Failed. Status:", res.statusCode);
    }
  }).on('error', (e) => {
    console.error("Error:", e.message);
  });
};

testProxyFetch();
