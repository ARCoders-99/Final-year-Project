import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModel.js";
import { Borrow } from "../models/borrowModel.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { DigitalBorrow } from "../models/digitalBorrowModel.js";
import Stripe from "stripe";

let stripeInstance;
const getStripe = () => {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeInstance;
};

export const createPaymentIntent = catchAsyncErrors(async (req, res, next) => {
    const stripe = getStripe();
    const { bookId } = req.params;

    // Search in both physical and digital collections
    let book = await Book.findById(bookId) || await DigitalBook.findById(bookId);

    if (!book) {
        return next(new ErrorHandler("Book not found", 404));
    }

    if (book.price <= 0) {
        return next(new ErrorHandler("This book is free to borrow.", 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(book.price * 100),
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
            userId: req.user._id.toString(),
            bookId: book._id.toString(),
            bookType: book.type || (book.gutenbergId ? "digital" : "physical"),
        },
    });

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
    });
});

export const getPaymentStatus = catchAsyncErrors(async (req, res, next) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return next(new ErrorHandler("Session ID is required", 400));
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
        success: true,
        status: session.payment_status,
        amount: session.amount_total / 100,
        paymentId: session.payment_intent,
    });
});

export const getAllPayments = catchAsyncErrors(async (req, res, next) => {
    // 1. Fetch Physical Book Payments
    const physicalPayments = await Borrow.find({ paymentStatus: "paid" })
        .populate("book", "title")
        .sort({ createdAt: -1 });

    const physicalEarnings = physicalPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

    // 2. Fetch Digital Book Payments
    const digitalPayments = await DigitalBorrow.find({ paymentStatus: "paid" })
        .populate("book", "title")
        .sort({ createdAt: -1 });

    const digitalEarnings = digitalPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

    // 3. Combine total earnings if needed, otherwise send separately
    res.status(200).json({
        success: true,
        physicalPayments,
        physicalEarnings,
        digitalPayments,
        digitalEarnings,
        totalEarnings: physicalEarnings + digitalEarnings,
    });
});
