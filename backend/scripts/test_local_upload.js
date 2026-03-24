import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const testUpload = async () => {
  const filePath = path.resolve("scripts", "sample.pdf");
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));

  try {
    const res = await axios.post("http://localhost:4000/api/v1/messages/upload-image", formData, {
      headers: formData.getHeaders(),
    });

    if (res.data.success && res.data.url.includes("/uploads/chat/")) {
      
      // Now check if it's accessible
      const getRes = await axios.get(res.data.url);
    }
  } catch (error) {
  }
};

testUpload();
