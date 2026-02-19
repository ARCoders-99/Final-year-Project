import cron from "node-cron";
import mongoose from "mongoose";
import { User } from "../models/userModel.js";

export const removeUnverifiedAccounts = () => {
  mongoose.connection.once("open", () => {
    console.log("🧹 removeUnverifiedAccounts cron started after DB connection");

    cron.schedule("*/5 * * * *", async () => {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        await User.deleteMany({
          accountVerified: false,
          createdAt: { $lt: thirtyMinutesAgo },
        });

        console.log("✅ Old unverified accounts removed");
      } catch (error) {
        console.error("⚠️ Error in removeUnverifiedAccounts cron:", error);
      }
    });
  });
};
