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

    // Check price
    if (book.price > 0) {
        return next(new ErrorHandler("This book requires payment before borrowing.", 400));
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

// Record Paid Digital Borrow (After successful Stripe payment)
export const recordPaidDigitalBorrow = catchAsyncErrors(async (req, res, next) => {
    const { id: bookId } = req.params;
    const { sessionId } = req.body;
    const user = req.user;

    if (!sessionId) {
        return next(new ErrorHandler("Payment session ID is required", 400));
    }

    // 1. Verify payment with Stripe
    const Stripe = (await import("stripe")).default;
    if (!process.env.STRIPE_SECRET_KEY) {
        return next(new ErrorHandler("STRIPE_SECRET_KEY is not defined in environment variables", 500));
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(sessionId);

    if (intent.status !== "succeeded") {
        return next(new ErrorHandler("Payment not verified", 400));
    }

    // 2. Check if book exists
    const book = await DigitalBook.findById(bookId);
    if (!book) return next(new ErrorHandler("Digital book not found", 404));

    // 3. Prevent duplicate borrow for same session
    let borrowRecord = await DigitalBorrow.findOne({ paymentId: intent.id });
    if (borrowRecord) {
        return res.status(200).json({ success: true, message: "Book already recorded.", borrowRecord });
    }

    // 4. Calculate expiry date
    const totalMs =
        ((book.borrowLimitDays || 0) * 86400 +
            (book.borrowLimitHours || 0) * 3600 +
            (book.borrowLimitMinutes || 0) * 60) * 1000;

    const expiryDate = new Date(Date.now() + totalMs);

    // 5. Create Digital Borrow record
    borrowRecord = await DigitalBorrow.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        book: bookId,
        expiryDate,
        paymentId: intent.id,
        paymentStatus: "paid",
        amountPaid: intent.amount / 100,
        paymentDate: new Date(),
    });

    res.status(201).json({
        success: true,
        message: "Payment verified and digital book borrowed successfully!",
        borrowRecord,
    });
});

// Reader Proxy: Fetch HTML from Gutenberg and return it
export const getDigitalReaderContent = catchAsyncErrors(async (req, res, next) => {
    const { id: bookId } = req.params;
    const user = req.user;

    // Verify active borrow
    let borrowRecord = await DigitalBorrow.findOne({
        "user.id": user._id,
        book: bookId,
        status: "Active",
        expiryDate: { $gt: new Date() },
    });

    if (!borrowRecord && user.role !== "Admin") {
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

// Get User's All Digital Borrows (Active & Expired)
export const getMyDigitalBorrows = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Auto-update expired borrows to "Returned"
    const now = new Date();
    await DigitalBorrow.updateMany(
        {
            "user.id": userId,
            returned: false,
            expiryDate: { $lte: now }
        },
        {
            $set: {
                returned: true,
                returnDate: now,
                status: "Expired"
            }
        }
    );

    const borrows = await DigitalBorrow.find({
        "user.id": userId,
    }).populate("book");

    res.status(200).json({
        success: true,
        borrows,
    });
});

// Return Digital Book
export const returnDigitalBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const borrow = await DigitalBorrow.findById(id);

    if (!borrow) {
        return next(new ErrorHandler("Borrow record not found", 404));
    }

    if (borrow.user.id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to return this book", 403));
    }

    if (borrow.returned) {
        return next(new ErrorHandler("This book is already returned", 400));
    }

    borrow.returned = true;
    borrow.returnDate = new Date();
    borrow.status = "Expired"; // Setting to Expired so it's treated as inactive

    await borrow.save();

    res.status(200).json({
        success: true,
        message: "Digital book returned successfully",
    });
});

// Get All Digital Borrows (Admin)
export const getAllDigitalBorrows = catchAsyncErrors(async (req, res, next) => {
    const borrows = await DigitalBorrow.find().populate("book");
    res.status(200).json({
        success: true,
        borrows,
    });
});
