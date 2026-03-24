import https from "https";

const testUrl = () => {
  const originalUrl = "https://res.cloudinary.com/dhdfnbof5/image/upload/v1773987125/CHAT_FILES/exgerhwfvgw9jznqlwbv.pdf";
  const downloadUrl = originalUrl.replace("/image/upload/", "/image/upload/fl_attachment/");


  https.get(downloadUrl, (res) => {
    if (res.statusCode === 200) {
    } else {
    }
  }).on('error', (e) => {
  });
};

testUrl();
