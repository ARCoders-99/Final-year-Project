import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Book } from "../models/bookModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { v2 as cloudinary } from "cloudinary";

export const addBook = catchAsyncErrors(async (req, res, next) => {
  const { title, author, price, borrowLimitDays, borrowLimitHours, borrowLimitMinutes } = req.body;

  if (!title || !author || !price) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  if (!req.files || !req.files.pdf || !req.files.coverImage) {
    return next(new ErrorHandler("Both PDF and cover image are required.", 400));
  }

  const { pdf, coverImage } = req.files;

  // Validate PDF
  if (pdf.mimetype !== "application/pdf") {
    return next(new ErrorHandler("Book file must be a PDF.", 400));
  }

  // Validate cover image
  const allowedImageFormats = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedImageFormats.includes(coverImage.mimetype)) {
    return next(
      new ErrorHandler("Cover image must be JPG, PNG, or WebP.", 400)
    );
  }

  // Upload PDF to Cloudinary
  const pdfUpload = await cloudinary.uploader.upload(pdf.tempFilePath, {
    resource_type: "raw",
    folder: "LIBRARY_MANAGEMENT_SYSTEM_BOOK_PDFS",
  });

  if (!pdfUpload || pdfUpload.error) {
    return next(new ErrorHandler("Failed to upload PDF to Cloudinary.", 500));
  }

  // Upload cover image to Cloudinary
  const imageUpload = await cloudinary.uploader.upload(
    coverImage.tempFilePath,
    {
      folder: "LIBRARY_MANAGEMENT_SYSTEM_BOOK_COVERS",
    }
  );

  if (!imageUpload || imageUpload.error) {
    return next(
      new ErrorHandler("Failed to upload cover image to Cloudinary.", 500)
    );
  }

  // Automatically set availability to true
  const availability = true;

  const book = await Book.create({
    title,
    author,
    price: Number(price),
    availability,
    pdfUrl: pdfUpload.secure_url,
    coverImageUrl: imageUpload.secure_url,
    borrowLimitDays: Number(borrowLimitDays) || 0,
    borrowLimitHours: Number(borrowLimitHours) || 0,
    borrowLimitMinutes: Number(borrowLimitMinutes) || 0,
  });

  res.status(201).json({
    success: true,
    message: "Book added successfully.",
    book,
  });
});

export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
  const books = await Book.find();
  res.status(200).json({
    success: true,
    books,
  });
});

export const getBook = catchAsyncErrors(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }
  res.status(200).json({ success: true, book });
});

export const deleteBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const book = await Book.findByIdAndDelete(id);

  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Book deleted successfully.",
  });
});
