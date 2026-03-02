import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModel.js";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";
import { calculateFine } from "../utils/fineCalculator.js";

// 📘 Borrow Book Controller (for free books or manual admin record)
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const user = req.user; // logged-in user
  const bookId = req.params.id;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  if (!book.availability)
    return next(new ErrorHandler("Book is not available", 400));

  // Calculate due date based on book's borrow limits
  const totalMs =
    ((book.borrowLimitDays || 0) * 86400 +
      (book.borrowLimitHours || 0) * 3600 +
      (book.borrowLimitMinutes || 0) * 60) * 1000;

  const dueDate = new Date(Date.now() + totalMs);

  // Create Borrow record
  const borrow = await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    book: book._id,
    price: book.price,
    dueDate,
  });

  // Add to user's borrowedBooks array for legacy/quick access
  user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowedDate: new Date(),
    dueDate,
    returned: false,
  });

  await user.save();

  res.status(200).json({ success: true, message: "Book borrowed successfully!", borrow });
});

export const recordPaidBorrow = catchAsyncErrors(async (req, res, next) => {
  const { bookId } = req.params;
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
  const intent = await stripe.paymentIntents.retrieve(sessionId); // sessionId is actually intentId here

  if (intent.status !== "succeeded") {
    return next(new ErrorHandler("Payment not verified", 400));
  }

  // 2. Check if book exists
  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  // 3. Prevent duplicate borrow for same session
  const existingBorrow = await Borrow.findOne({ paymentId: intent.id });
  if (existingBorrow) {
    return res.status(200).json({ success: true, message: "Book already recorded.", borrow: existingBorrow });
  }

  // 4. Calculate due date
  const totalMs =
    ((book.borrowLimitDays || 0) * 86400 +
      (book.borrowLimitHours || 0) * 3600 +
      (book.borrowLimitMinutes || 0) * 60) * 1000;

  const dueDate = new Date(Date.now() + totalMs);

  // 5. Create Borrow record with payment details
  const borrow = await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    book: book._id,
    price: book.price,
    dueDate,
    paymentId: intent.id,
    paymentStatus: "paid",
    amountPaid: intent.amount / 100,
    paymentDate: new Date(),
  });

  // 6. Update user's borrowedBooks array
  user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowedDate: new Date(),
    dueDate,
    returned: false,
    paymentId: intent.id,
    paymentStatus: "paid",
    amountPaid: intent.amount / 100,
    paymentDate: new Date(),
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Payment verified and book borrowed successfully!",
    borrow,
  });
});


// 📗 Return Book Controller
export const returnBorrowBook = async (req, res, next) => {
  const user = req.user;
  const { bookId } = req.params;

  const borrowedBook = user.borrowedBooks.find(
    (b) => b._id.toString() === bookId && !b.returned
  );
  if (!borrowedBook)
    return next(new ErrorHandler("Borrowed book not found", 404));

  borrowedBook.returned = true;
  borrowedBook.returnDate = new Date();
  borrowedBook.fine = calculateFine(borrowedBook.dueDate);

  // Update original Borrow record
  const borrowRecord = await Borrow.findOne({
    "user.id": user._id,
    book: borrowedBook.bookId,
    returnDate: null
  });
  if (borrowRecord) {
    borrowRecord.returnDate = borrowedBook.returnDate;
    borrowRecord.fine = borrowedBook.fine;
    await borrowRecord.save();
  }

  // Update book availability
  const book = await Book.findById(borrowedBook.bookId);
  if (book) book.availability = true;

  await user.save();
  if (book) await book.save();

  res.status(200).json({ success: true, message: "Book returned successfully!" });
};


// 📕 Get logged-in user's borrowed books
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const { borrowedBooks } = req.user;
  res.status(200).json({
    success: true,
    borrowedBooks,
  });
});

// 📙 Get all borrowed books for Admin
export const getBorrowedBooksForAdmin = catchAsyncErrors(async (req, res, next) => {
  const borrowedBooks = await Borrow.find().populate("book", "title");
  res.status(200).json({
    success: true,
    borrowedBooks,
  });
});
