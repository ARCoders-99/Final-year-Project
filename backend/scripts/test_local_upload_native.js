import http from "http";
import fs from "fs";
import path from "path";

const testLocalUploadNative = () => {
  const filePath = path.resolve("scripts", "sample.pdf");
  const url = "http://localhost:4000/api/v1/messages/upload-image";
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  
  const chunks = [];
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`));
  chunks.push(fs.readFileSync(filePath));
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  
  const body = Buffer.concat(chunks);
  
  const options = {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length
    }
  };

  const req = http.request(url, options, (res) => {
    let responseData = "";
    res.on("data", (chunk) => responseData += chunk);
    res.on("end", () => {
      
      const parsed = JSON.parse(responseData);
      if (parsed.success) {
        // Add a check for the file in the filesystem
        const fileName = parsed.url.split("/").pop();
        const expectedPath = path.join(process.cwd(), "uploads", "chat", fileName);
        if (fs.existsSync(expectedPath)) {
        } else {
        }
      }
    });
  });

  req.write(body);
  req.end();
};

testLocalUploadNative();
