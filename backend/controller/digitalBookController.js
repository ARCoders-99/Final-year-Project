import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { searchGutenbergBooks } from "../services/gutenbergService.js";
import { DigitalBook } from "../models/digitalBookModel.js";
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
        language,
        coverImage,
        htmlLink,
        borrowLimitDays,
        borrowLimitHours,
        borrowLimitMinutes
    } = req.body;

    if (!gutenbergId || !title || !author || !htmlLink) {
        return next(new ErrorHandler("Metadata missing for import.", 400));
    }

    // Check if already imported
    let book = await DigitalBook.findOne({ gutenbergId });
    if (book) {
        return next(new ErrorHandler("Book already imported.", 400));
    }

    book = await DigitalBook.create({
        gutenbergId,
        title,
        author,
        description,
        language,
        coverImage,
        htmlLink,
        borrowLimitDays: borrowLimitDays !== undefined ? Number(borrowLimitDays) : 0,
        borrowLimitHours: borrowLimitHours !== undefined ? Number(borrowLimitHours) : 0,
        borrowLimitMinutes: borrowLimitMinutes !== undefined ? Number(borrowLimitMinutes) : 0,
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
