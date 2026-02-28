import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availability: {
      type: Boolean,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    coverImageUrl: {
      type: String,
      required: true,
    },
    borrowLimitDays: {
      type: Number,
      default: 0,
    },
    borrowLimitHours: {
      type: Number,
      default: 0,
    },
    borrowLimitMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Book = mongoose.model("Book", bookSchema);
