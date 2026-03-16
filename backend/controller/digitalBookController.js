import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { searchGutenbergBooks } from "../services/gutenbergService.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { DigitalBorrow } from "../models/digitalBorrowModel.js";
import { v2 as cloudinary } from "cloudinary";
import { digitalImportSchema } from "../utils/validationSchema.js";

// Search Gutenberg Books (Public API)
export const searchBooks = catchAsyncErrors(async (req, res, next) => {
    const { title, author } = req.query;

    // Combine title and author if both are provided for a more specific search
    let queryParts = [];
    if (title) queryParts.push(title);
    if (author) queryParts.push(author);

    const query = queryParts.join(" ").trim();

    if (!query) {
        return next(new ErrorHandler("Please provide a title or author to search.", 400));
    }

    const results = await searchGutenbergBooks(query);

    res.status(200).json({
        success: true,
        results,
    });
});

// Import Digital Book (Admin Only)
export const importBook = catchAsyncErrors(async (req, res, next) => {
    const validation = digitalImportSchema.safeParse(req.body);
    if (!validation.success) {
        const message = validation.error?.errors?.[0]?.message || "Validation failed during import.";
        return next(new ErrorHandler(message, 400));
    }

    const {
        gutenbergId,
        title,
        author,
        description,
        coverImage,
        htmlLink,
        borrowLimitDays,
        borrowLimitHours,
        borrowLimitMinutes,
        price
    } = req.body;

    if (!gutenbergId || !title || !author || !htmlLink) {
        return next(new ErrorHandler("Metadata missing for import.", 400));
    }

    // Check if already imported
    let book = await DigitalBook.findOne({ gutenbergId });
    if (book) {
        return next(new ErrorHandler("Book already imported.", 400));
    }

    // Cache cover image in Cloudinary if it exists
    let cloudinaryCoverUrl = coverImage;
    if (coverImage && coverImage.includes("gutenberg.org")) {
        try {
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(coverImage)}`;
            const uploadResult = await cloudinary.uploader.upload(proxyUrl, {
                folder: "LIBRARY_MANAGEMENT_SYSTEM_BOOK_COVERS",
            });
            if (uploadResult && uploadResult.secure_url) {
                cloudinaryCoverUrl = uploadResult.secure_url;
            }
        } catch (error) {
            console.error("Failed to cache digital book cover:", error);
            // Fallback to original URL if proxy upload fails
        }
    }

    book = await DigitalBook.create({
        gutenbergId,
        title,
        author,
        description,
        coverImage: cloudinaryCoverUrl,
        htmlLink,
        borrowLimitDays: borrowLimitDays !== undefined ? Number(borrowLimitDays) : 0,
        borrowLimitHours: borrowLimitHours !== undefined ? Number(borrowLimitHours) : 0,
        borrowLimitMinutes: borrowLimitMinutes !== undefined ? Number(borrowLimitMinutes) : 0,
        price: price !== undefined ? Number(price) : 0,
    });

    res.status(201).json({
        success: true,
        message: "Digital book imported successfully.",
        book,
    });
});

// Get All Imported Digital Books
export const getAllDigitalBooks = catchAsyncErrors(async (req, res, next) => {
    const books = await DigitalBook.find();
    res.status(200).json({
        success: true,
        books,
    });
});

// Delete Digital Book (Admin Only)
export const deleteDigitalBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const book = await DigitalBook.findByIdAndDelete(id);
    if (!book) {
        return next(new ErrorHandler("Digital book not found.", 404));
    }

    // Cascade delete related borrows
    await DigitalBorrow.deleteMany({ book: id });

    res.status(200).json({
        success: true,
        message: "Digital book deleted successfully.",
    });
});
