import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema({
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  price: {
    type: Number,
    required: true
  },
  borrowDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
    default: null
  },
  fine: {
    type: Number,
    default: 0,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  paymentId: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  paymentDate: {
    type: Date,
    default: null,
  },
},
  { timestamps: true }
);

export const Borrow = mongoose.model("Borrow", borrowSchema);