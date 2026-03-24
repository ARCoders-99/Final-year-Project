import cron from "node-cron";
import mongoose from "mongoose";
import { Borrow } from "../models/borrowModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const notifyUsers = () => {
  // Wait until DB connection is open before starting the cron
  mongoose.connection.once("open", () => {

    cron.schedule("*/30 * * * *", async () => {
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const borrowers = await Borrow.find({
          dueDate: { $lt: oneDayAgo },
          returnDate: null,
          notified: false,
        });

        for (const element of borrowers) {
          if (element.user && element.user.email) {
            await sendEmail({
              email: element.user.email,
              subject: "Book Return Reminder",
              message: `Hello ${element.user.name},\n\nThis is a reminder that the book you borrowed is due for return today. Please return it as soon as possible.\n\nThank you.`,
            });
            element.notified = true;
            await element.save();
          }
        }
      } catch (error) {
        // Error in notifyUsers cron
      }
    });
  });
};
