import { app } from "./app.js";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { initSocket } from "./utils/socket.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

