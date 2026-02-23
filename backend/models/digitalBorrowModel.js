import mongoose from "mongoose";

const digitalBorrowSchema = new mongoose.Schema(
    {
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
            ref: "DigitalBook",
            required: true,
        },
        borrowDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["Active", "Expired"],
            default: "Active",
        },
    },
    { timestamps: true }
);

export const DigitalBorrow = mongoose.model("DigitalBorrow", digitalBorrowSchema);
