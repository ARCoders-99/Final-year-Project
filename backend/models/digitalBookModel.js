import mongoose from "mongoose";

const digitalBookSchema = new mongoose.Schema(
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
        description: {
            type: String,
        },
        language: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        gutenbergId: {
            type: Number,
            unique: true,
            required: true,
        },
        htmlLink: {
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
        type: {
            type: String,
            default: "digital",
        },
    },
    {
        timestamps: true,
    }
);

export const DigitalBook = mongoose.model("DigitalBook", digitalBookSchema);
