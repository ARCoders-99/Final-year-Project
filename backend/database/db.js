import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Directly connect without deprecated options
    const { connection } = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit process with failure
  }
};
