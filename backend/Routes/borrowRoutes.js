import express from "express";
import {
  borrowedBooks,
  getBorrowedBooksForAdmin,
  recordBorrowedBook,
  recordPaidBorrow,
  returnBorrowBook,
} from "../controller/borrowController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// USERS can borrow books
router.post(
  "/record-borrow-book/:id",
  isAuthenticated, // anyone logged in
  recordBorrowedBook
);

router.post(
  "/record-paid-borrow/:bookId",
  isAuthenticated,
  recordPaidBorrow
);

// USERS can return their borrowed books
router.put(
  "/return-borrowed-book/:bookId",
  isAuthenticated,
  returnBorrowBook
);

// ADMIN routes
router.get(
  "/borrowed-books-by-users",
  isAuthenticated,
  isAuthorized("Admin"),
  getBorrowedBooksForAdmin
);

router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);

export default router;
