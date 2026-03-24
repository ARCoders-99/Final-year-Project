import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Directly connect without deprecated options
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

  } catch (error) {
    process.exit(1); // Exit process with failure
  }
};
