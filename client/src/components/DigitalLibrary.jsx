import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllDigitalBooks, borrowDigitalBook, resetDigitalSlice, fetchMyDigitalBorrows, recordPaidDigitalBorrow } from "../store/slices/digitalSlice";
import { createPaymentIntent } from "../store/slices/borrowSlice";
import { toast } from "react-toastify";
import Header from "../layout/Header";
import { BookA, Loader2, BookOpen, Clock, Trash2, CreditCard } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PaymentPopup from "../popups/PaymentPopup";

const DigitalLibrary = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { digitalBooks, loading, error, message, myDigitalBorrows } = useSelector(
        (state) => state.digital
    );
    const { user } = useSelector((state) => state.auth);
    const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ clientSecret: "", bookId: "", bookTitle: "", price: 0 });

    useEffect(() => {
        dispatch(fetchAllDigitalBooks());
        dispatch(fetchMyDigitalBorrows());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(resetDigitalSlice());
        }
        if (message) {
            toast.success(message);
            dispatch(resetDigitalSlice());
        }
    }, [dispatch, error, message]);

    const handleBorrow = async (id) => {
        const book = digitalBooks.find((b) => b._id === id);
        if (!book) return;

        if (book.price > 0) {
            try {
                const clientSecret = await dispatch(createPaymentIntent(id));
                if (clientSecret) {
                    setPaymentData({
                        clientSecret,
                        bookId: book._id,
                        bookTitle: book.title,
                        price: book.price
                    });
                    setIsPaymentPopupOpen(true);
                }
            } catch (err) {
                toast.error(err || "Failed to initiate payment");
            }
            return;
        }

        dispatch(borrowDigitalBook(id));
    };

    const handlePaymentSuccess = () => {
        dispatch(fetchMyDigitalBorrows());
        dispatch(fetchAllDigitalBooks());
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this digital book?")) {
            try {
                const { data } = await axios.delete(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/digital-book/delete/${id}`,
                    { withCredentials: true }
                );
                toast.success(data.message || "Book deleted successfully!");
                dispatch(fetchAllDigitalBooks());
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete book");
            }
        }
    };

    const isAlreadyBorrowed = (bookId) => {
        // We would ideally fetch my borrows here, but for now let's assume we can check in myDigitalBorrows
        // In a real app, we'd need to ensure myDigitalBorrows is populated.
        return myDigitalBorrows.some((b) => b.book._id === bookId);
    };

    return (
        <main className="relative flex-1 p-6 pt-28">
            <Header />
            <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookA size={28} />
                    Digital Library
                </h2>
            </header>

            {loading && digitalBooks.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin" size={48} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {digitalBooks.length > 0 ? (
                        digitalBooks.map((book) => {
                            const borrowed = isAlreadyBorrowed(book._id);
                            return (
                                <div
                                    key={book._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="h-64 bg-gray-200 overflow-hidden relative group">
                                        <img
                                            src={book.coverImage || "https://via.placeholder.com/150x200?text=No+Cover"}
                                            alt={book.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                            {book.language}
                                        </div>
                                        {user?.role === "Admin" && (
                                            <button
                                                onClick={() => handleDelete(book._id)}
                                                className="absolute top-2 left-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-lg"
                                                title="Delete Book"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 className="font-bold text-gray-800 line-clamp-2 mb-1 h-12 leading-tight">
                                            {book.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-2 truncate">by {book.author}</p>

                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-black font-semibold">
                                                <CreditCard size={14} className="text-gray-400" />
                                                <span>{book.price > 0 ? `$${book.price}` : "Free"}</span>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                                                {book.price > 0 ? "Premium" : "Public Domain"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                            <Clock size={14} />
                                            <span>
                                                {[
                                                    book.borrowLimitDays > 0 && `${book.borrowLimitDays}d`,
                                                    book.borrowLimitHours > 0 && `${book.borrowLimitHours}h`,
                                                    book.borrowLimitMinutes > 0 && `${book.borrowLimitMinutes}m`
                                                ].filter(Boolean).join(" ") || "No Limit"} Access
                                            </span>
                                        </div>

                                        <div className="mt-auto flex gap-2">
                                            <button
                                                onClick={() => handleBorrow(book._id)}
                                                disabled={loading || borrowed}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium ${borrowed
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-black text-white hover:bg-gray-800"
                                                    }`}
                                            >
                                                {borrowed ? "Borrowed" : "Borrow"}
                                            </button>

                                            {borrowed && (
                                                <button
                                                    onClick={() => navigate(`/reader/${book._id}`)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    title="Read Now"
                                                >
                                                    <BookOpen size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 italic col-span-full">No digital books available yet.</p>
                    )}
                </div>
            )}

            <PaymentPopup
                isOpen={isPaymentPopupOpen}
                onClose={() => setIsPaymentPopupOpen(false)}
                onSuccess={handlePaymentSuccess}
                recordPaidBorrowThunk={recordPaidDigitalBorrow}
                {...paymentData}
            />
        </main>
    );
};

export default DigitalLibrary;
