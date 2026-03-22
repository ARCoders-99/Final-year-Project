import https from "https";

const testUrl = () => {
  const originalUrl = "https://res.cloudinary.com/dhdfnbof5/image/upload/v1773987125/CHAT_FILES/exgerhwfvgw9jznqlwbv.pdf";
  const rawUrl = originalUrl.replace("/image/upload/", "/raw/upload/");

  console.log("Original URL (image):", originalUrl);
  console.log("Transformed URL (raw):", rawUrl);

  https.get(rawUrl, (res) => {
    console.log("Raw URL Status Code:", res.statusCode);
    if (res.statusCode === 200) {
      console.log("Success! Cloudinary serves it as raw.");
    } else {
      console.log("Failed to serve as raw. Status:", res.statusCode);
    }
  }).on('error', (e) => {
    console.error("Error:", e.message);
  });
};

testUrl();
