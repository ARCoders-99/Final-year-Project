import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModel.js";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";
import { calculateFine } from "../utils/fineCalculator.js";

// 📘 Borrow Book Controller
export const recordBorrowedBook = async (req, res, next) => {
  const user = req.user; // logged-in user
  const bookId = req.params.id;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  if (!book.availability)
    return next(new ErrorHandler("Book is not available", 400));

  // Add borrowed book
  user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowedDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    returned: false,
  });

  book.availability = false; // reduce quantity or make unavailable

  await user.save();
  await book.save();

  res.status(200).json({ success: true, message: "Book borrowed successfully!" });
};


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
  const borrowedBooks = await Borrow.find();
  res.status(200).json({
    success: true,
    borrowedBooks,
  });
});
