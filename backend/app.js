import express from "express"
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"
import connectDB from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";
import authRoutes from "./Routes/authRoutes.js"
import bookRoutes from "./Routes/bookRouter.js"
import userRoutes from "./Routes/userRoutes.js"
import borrowRoutes from "./Routes/borrowRoutes.js"
import expressFileUpload from "express-fileupload"
import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";

export const app = express();
config({ path: "./config/config.env"})



////middleware///////
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    methods :["GET", "PUT" , "POST" , "DELETE"],
    credentials:true, 
}))
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use(expressFileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp/",
}))

/////////////////// Routes ////////////////////////
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/book", bookRoutes)
app.use("/api/v1/borrow", borrowRoutes)
app.use("/api/v1/user", userRoutes)

notifyUsers();
removeUnverifiedAccounts();
//////database connextion /////////////

connectDB();

app.use(errorMiddleware);