import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { DigitalBorrow } from "../models/digitalBorrowModel.js";
import { digitalBorrowSchema } from "../utils/validationSchema.js";

// Borrow Digital Book
export const borrowDigitalBook = catchAsyncErrors(async (req, res, next) => {
    const validation = digitalBorrowSchema.safeParse(req.params);
    if (!validation.success) {
        return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const { id: bookId } = req.params;
    const user = req.user;

    const book = await DigitalBook.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Digital book not found.", 404));
    }

    // Check if already borrowed and active
    let borrowRecord = await DigitalBorrow.findOne({
        "user.id": user._id,
        book: bookId,
        status: "Active",
        expiryDate: { $gt: new Date() },
    });

    if (borrowRecord) {
        return next(new ErrorHandler("You already have an active borrow for this book.", 400));
    }

    const totalMs =
        ((book.borrowLimitDays || 0) * 86400 +
            (book.borrowLimitHours || 0) * 3600 +
            (book.borrowLimitMinutes || 0) * 60) * 1000;

    if (totalMs <= 0) {
        return next(new ErrorHandler("This book has no borrow limit configured.", 400));
    }

    const expiryDate = new Date(Date.now() + totalMs);

    borrowRecord = await DigitalBorrow.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        book: bookId,
        expiryDate,
    });

    res.status(201).json({
        success: true,
        message: "Digital book borrowed successfully.",
        borrowRecord,
    });
});

// Reader Proxy: Fetch HTML from Gutenberg and return it
export const getDigitalReaderContent = catchAsyncErrors(async (req, res, next) => {
    const { id: bookId } = req.params;
    const user = req.user;

    // Verify active borrow
    const borrowRecord = await DigitalBorrow.findOne({
        "user.id": user._id,
        book: bookId,
        status: "Active",
        expiryDate: { $gt: new Date() },
    });

    if (!borrowRecord) {
        return next(new ErrorHandler("Access denied. No active borrow record found or borrow has expired.", 403));
    }

    const book = await DigitalBook.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    try {
        const response = await fetch(book.htmlLink);
        if (!response.ok) {
            throw new Error(`Failed to fetch Gutenberg content: ${response.statusText}`);
        }
        const html = await response.text();

        // Basic anti-download/direct link measure: inject a script to block right-click if needed
        // or just return the HTML and let frontend handle basic UI restrictions.
        res.setHeader("Content-Type", "text/html");
        res.status(200).send(html);
    } catch (error) {
        return next(new ErrorHandler("Error fetching book content from Gutenberg.", 500));
    }
});

// Get User's Active Digital Borrows
export const getMyDigitalBorrows = catchAsyncErrors(async (req, res, next) => {
    const borrows = await DigitalBorrow.find({
        "user.id": req.user._id,
        status: "Active",
        expiryDate: { $gt: new Date() },
    }).populate("book");

    res.status(200).json({
        success: true,
        borrows,
    });
});
