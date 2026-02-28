import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { recordPaidBorrow } from "../store/slices/borrowSlice";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import Header from "../layout/Header";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState("verifying");
    const effectRan = useRef(false);

    const sessionId = searchParams.get("session_id");
    const bookId = searchParams.get("bookId");

    useEffect(() => {
        if (effectRan.current) return;

        const verifyPayment = async () => {
            if (!sessionId || !bookId) {
                setStatus("error");
                return;
            }

            try {
                await dispatch(recordPaidBorrow(bookId, sessionId));
                setStatus("success");
            } catch (err) {
                console.error("Payment verification failed", err);
                setStatus("error");
            }
        };

        verifyPayment();
        effectRan.current = true;
    }, [sessionId, bookId, dispatch]);

    return (
        <main className="relative flex-1 p-6 pt-28 min-h-screen bg-gray-50 flex flex-col items-center">
            <Header />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center mt-10 animate-in fade-in zoom-in duration-500">
                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={64} className="text-black animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
                        <p className="text-gray-500">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle size={64} className="text-green-600 animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">Payment Successful!</h2>
                        <p className="text-gray-600">
                            Your payment has been processed and the book is now available in your borrowed list.
                        </p>
                        <div className="flex flex-col w-full gap-3 mt-4">
                            <Link
                                to="/borrowed"
                                className="w-full bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                            >
                                View My Borrowed Books <ArrowRight size={18} />
                            </Link>
                            <Link
                                to="/books"
                                className="text-sm text-gray-500 hover:text-black transition-colors"
                            >
                                Back to Library
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-red-100 p-4 rounded-full text-red-600 text-6xl">
                            ✕
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verification Failed</h2>
                        <p className="text-gray-600">
                            We couldn't verify your payment. If you were charged, please contact support.
                        </p>
                        <Link
                            to="/books"
                            className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-4"
                        >
                            Return to Books
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
};

export default PaymentSuccess;
