import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import axios from "axios";
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    ArrowLeft,
    Loader2,
} from "lucide-react";

// Use the bundled worker via CDN to avoid build-config changes
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PhysicalBookReader = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [book, setBook] = useState(null);
    const [fetchError, setFetchError] = useState("");
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfError, setPdfError] = useState("");
    const [pdfLoading, setPdfLoading] = useState(true);
    const [accessExpired, setAccessExpired] = useState(false);
    const [expiryDate, setExpiryDate] = useState(null);

    // Fetch book metadata from backend (keeps PDF URL server-side)
    useEffect(() => {
        const fetchBook = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/book/${id}`,
                    { withCredentials: true }
                );

                if (user?.role === "Admin") {
                    setBook(data.book);
                    return;
                }

                // Find the borrow record for this book in user's borrowed books
                const userResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/borrow/my-borrowed-books`,
                    { withCredentials: true }
                );

                const borrowedBooks = userResponse.data.borrowedBooks;
                const borrowRecord = borrowedBooks.find(
                    (b) => b.bookId === id && !b.returned
                );

                if (!borrowRecord) {
                    setFetchError("You must borrow this book before reading it.");
                    return;
                }

                const expiryDate = new Date(borrowRecord.dueDate);
                if (expiryDate <= new Date()) {
                    setFetchError("Your borrow period has expired. Please borrow again to continue reading.");
                    return;
                }

                setExpiryDate(expiryDate);
                setBook(data.book);
            } catch (err) {
                console.error("Book fetch error:", err);
                const errorMessage = err.response?.data?.message || err.message || "Failed to load book details.";
                setFetchError(errorMessage);

                if (!import.meta.env.VITE_BACKEND_URL) {
                    console.warn("VITE_BACKEND_URL is not defined in the environment.");
                }
            }
        };
        fetchBook();
    }, [id]);

    // Real-time expiry guard: redirect exactly when dueDate is reached
    useEffect(() => {
        if (!expiryDate) return;
        const msLeft = expiryDate.getTime() - Date.now();
        if (msLeft <= 0) { setAccessExpired(true); return; }
        const timer = setTimeout(() => setAccessExpired(true), msLeft);
        return () => clearTimeout(timer);
    }, [expiryDate]);

    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setPdfLoading(false);
    }, []);

    const onDocumentLoadError = useCallback((err) => {
        console.error("PDF load error:", err);
        setPdfError("Failed to load the PDF. Please try again later.");
        setPdfLoading(false);
    }, []);

    const goToPrevPage = () =>
        setPageNumber((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () =>
        setPageNumber((prev) => Math.min(prev + 1, numPages));
    const zoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
    const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

    // Real-time access expired overlay
    if (accessExpired) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 z-50">
                <div className="text-center">
                    <p className="text-5xl mb-4">⏰</p>
                    <h2 className="text-white text-2xl font-bold mb-2">Access Expired</h2>
                    <p className="text-gray-400 mb-6">Your borrow period for this book has ended.</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 font-medium"
                >
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    // Error fetching book
    if (fetchError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
                <p className="text-red-400 text-lg">{fetchError}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100"
                >
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    // Still loading book metadata
    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="text-white animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gray-900 flex flex-col select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-gray-800 shadow-lg px-4 py-3 flex items-center justify-between gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-white hover:text-gray-300 transition-colors shrink-0"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline text-sm font-medium">Back</span>
                </button>

                <div className="flex flex-col items-center min-w-0">
                    <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[260px] sm:max-w-[400px]">
                        {book.title}
                    </h1>
                    <p className="text-gray-400 text-xs truncate">{book.author}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        title="Zoom out"
                        className="p-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-40 transition-colors"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-gray-300 text-xs w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= 2.5}
                        title="Zoom in"
                        className="p-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-40 transition-colors"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
            </header>

            {/* PDF Viewport */}
            <main className="flex-1 flex flex-col items-center py-6 px-4 overflow-auto">
                {pdfError ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                        <p className="text-red-400">{pdfError}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 text-sm"
                        >
                            <ArrowLeft size={14} /> Go Back
                        </button>
                    </div>
                ) : (
                    <>
                        {pdfLoading && (
                            <div className="flex flex-col items-center gap-3 mt-16">
                                <Loader2 className="text-white animate-spin" size={40} />
                                <p className="text-gray-400 text-sm">Loading book…</p>
                            </div>
                        )}

                        <Document
                            file={book.pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null}
                            className={pdfLoading ? "hidden" : ""}
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-2xl rounded-sm"
                            />
                        </Document>
                    </>
                )}
            </main>

            {/* Bottom Pagination Bar */}
            {!pdfError && numPages && (
                <footer className="sticky bottom-0 z-20 bg-gray-800 shadow-[0_-4px_16px_rgba(0,0,0,0.4)] px-4 py-3 flex items-center justify-center gap-6">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-40 transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    <span className="text-gray-300 text-sm font-medium tabular-nums">
                        Page {pageNumber} / {numPages}
                    </span>

                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-40 transition-colors text-sm font-medium"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </footer>
            )}
        </div>
    );
};

export default PhysicalBookReader;
