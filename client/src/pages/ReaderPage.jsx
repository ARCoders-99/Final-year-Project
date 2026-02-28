import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyDigitalBorrows } from "../store/slices/digitalSlice";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import Header from "../layout/Header";

const ReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { myDigitalBorrows, loading } = useSelector((state) => state.digital);
    const [borrowRecord, setBorrowRecord] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        dispatch(fetchMyDigitalBorrows());
    }, [dispatch]);

    useEffect(() => {
        const record = myDigitalBorrows.find((b) => b.book._id === id);
        setBorrowRecord(record);
    }, [myDigitalBorrows, id]);

    useEffect(() => {
        if (!borrowRecord) return;

        const expiry = new Date(borrowRecord.expiryDate).getTime();

        const tick = () => {
            const now = Date.now();
            const diff = expiry - now;

            if (diff <= 0) {
                clearInterval(timer);
                // Immediately lock: show no-access screen then redirect
                navigate(-1);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`);
        };

        tick(); // Run immediately
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [borrowRecord, navigate]);

    if (loading && !borrowRecord) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-black" size={48} />
            </div>
        );
    }

    if (!borrowRecord && !loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p>You do not have an active borrow for this book.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-black text-white px-6 py-2 rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Reader Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-800 truncate max-w-md">
                            {borrowRecord?.book.title}
                        </h1>
                        <p className="text-xs text-gray-500">{borrowRecord?.book.author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                    <Clock size={18} />
                    <span className="text-sm font-semibold">Expires: {timeLeft}</span>
                </div>
            </nav>

            {/* Reader Content */}
            <div className="flex-1 relative overflow-hidden">
                {/* Iframe with basic context menu blocking */}
                <iframe
                    src={`http://localhost:4000/api/v1/digital/read/${id}`}
                    className="w-full h-full border-none"
                    title="Book Reader"
                    onContextMenu={(e) => e.preventDefault()}
                />

                {/* Overlay to catch right clicks if iframe allows bubbling (mostly for outer area) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    onContextMenu={(e) => e.preventDefault()}
                />
            </div>

            <style>{`
        body { overflow: hidden; }
        iframe {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
        </div>
    );
};

export default ReaderPage;
