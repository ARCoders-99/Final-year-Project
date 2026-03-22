import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const testUpload = async () => {
  const filePath = path.resolve("scripts", "sample.pdf");
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));

  try {
    console.log("Testing local upload endpoint...");
    const res = await axios.post("http://localhost:4000/api/v1/messages/upload-image", formData, {
      headers: formData.getHeaders(),
    });

    console.log("Response:", res.data);
    if (res.data.success && res.data.url.includes("/uploads/chat/")) {
      console.log("Success! Local URL returned.");
      
      // Now check if it's accessible
      const getRes = await axios.get(res.data.url);
      console.log("GET Status:", getRes.status);
    }
  } catch (error) {
    console.error("Failed:", error.response?.data || error.message);
  }
};

testUpload();
