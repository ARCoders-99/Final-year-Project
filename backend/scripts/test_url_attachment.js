import https from "https";

const testUrl = () => {
  const originalUrl = "https://res.cloudinary.com/dhdfnbof5/image/upload/v1773987125/CHAT_FILES/exgerhwfvgw9jznqlwbv.pdf";
  const downloadUrl = originalUrl.replace("/image/upload/", "/image/upload/fl_attachment/");

  console.log("Original URL:", originalUrl);
  console.log("Download URL (fl_attachment):", downloadUrl);

  https.get(downloadUrl, (res) => {
    console.log("Download URL Status Code:", res.statusCode);
    if (res.statusCode === 200) {
      console.log("Success! Cloudinary serves it with fl_attachment.");
    } else {
      console.log("Failed. Status:", res.statusCode);
    }
  }).on('error', (e) => {
    console.error("Error:", e.message);
  });
};

testUrl();
