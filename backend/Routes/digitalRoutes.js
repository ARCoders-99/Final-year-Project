import express from "express";
import {
    searchBooks,
    importBook,
    getAllDigitalBooks,
    deleteDigitalBook
} from "../controller/digitalBookController.js";
import {
    borrowDigitalBook,
    getDigitalReaderContent,
    getMyDigitalBorrows,
    getAllDigitalBorrows,
    recordPaidDigitalBorrow
} from "../controller/digitalBorrowController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Digital Book Routes
router.get("/search", isAuthenticated, isAuthorized("Admin"), searchBooks);
router.post("/import", isAuthenticated, isAuthorized("Admin"), importBook);
router.get("/all", isAuthenticated, getAllDigitalBooks);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteDigitalBook);

// Digital Borrow Routes
router.post("/borrow/:id", isAuthenticated, borrowDigitalBook);
router.post("/record-paid-borrow/:id", isAuthenticated, recordPaidDigitalBorrow);
router.get("/my-borrows", isAuthenticated, getMyDigitalBorrows);
router.get("/admin/all-borrows", isAuthenticated, isAuthorized("Admin"), getAllDigitalBorrows);
router.get("/read/:id", isAuthenticated, getDigitalReaderContent);

export default router;
