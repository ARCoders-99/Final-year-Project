import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Directly connect without deprecated options
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${connection.host}`);
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};
