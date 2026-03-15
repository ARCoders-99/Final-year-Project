import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import AIAssistantMenu from "../components/AIAssistantMenu";
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    ArrowLeft,
    Loader2,
    Volume2,
    X,
    Sparkles,
} from "lucide-react";
import StoryAnalyzer from "../components/StoryAnalyzer";

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
    const [selection, setSelection] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pdfInstance, setPdfInstance] = useState(null);
    const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
    const [analysisText, setAnalysisText] = useState("");

    const handleAnalyzeStory = async () => {
        if (!pdfInstance) return;

        try {
            const page = await pdfInstance.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const fullText = textContent.items.map(item => item.str).join(" ");

            if (fullText.trim()) {
                setAnalysisText(fullText);
                setIsAnalyzerOpen(true);
            } else {
                toast.info("No text found on this page to analyze.");
            }
        } catch (error) {
            console.error("Analysis extraction error:", error);
            toast.error("Failed to extract text for analysis.");
        }
    };

    const handleReadAloudPage = async () => {
        if (isSpeaking) {
            if (isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
            } else {
                window.speechSynthesis.pause();
                setIsPaused(true);
            }
            return;
        }

        if (!pdfInstance) return;

        try {
            setIsSpeaking(true);
            setIsPaused(false);
            const page = await pdfInstance.getPage(pageNumber);
            const textContent = await page.getTextContent();

            // Map text items to their spans in the DOM
            const items = textContent.items;
            const fullText = items.map(item => item.str).join(" ");

            if (fullText.trim()) {
                const utterance = new SpeechSynthesisUtterance(fullText);

                utterance.onboundary = (event) => {
                    if (event.name === 'word') {
                        triggerHighlight(event.charIndex, items);
                    }
                };

                utterance.onend = () => {
                    setIsSpeaking(false);
                    setIsPaused(false);
                    document.querySelectorAll('.pdf-highlight').forEach(el => {
                        el.style.backgroundColor = 'transparent';
                        el.classList.remove('pdf-highlight');
                    });
                };
                utterance.onerror = () => {
                    setIsSpeaking(false);
                    setIsPaused(false);
                };
                window.speechSynthesis.speak(utterance);
            } else {
                toast.info("No text found on this page to read.");
                setIsSpeaking(false);
                setIsPaused(false);
            }
        } catch (error) {
            console.error("Speech error:", error);
            setIsSpeaking(false);
            setIsPaused(false);
        }
    };

    const triggerHighlight = (charIndex, items) => {
        // Find which item this charIndex belongs to
        let currentLen = 0;
        let itemIndex = -1;
        for (let i = 0; i < items.length; i++) {
            const nextLen = currentLen + items[i].str.length + 1; // +1 for the join space
            if (charIndex >= currentLen && charIndex < nextLen) {
                itemIndex = i;
                break;
            }
            currentLen = nextLen;
        }

        if (itemIndex !== -1) {
            const textLayer = document.querySelector('.react-pdf__Page__textContent');
            if (textLayer) {
                const spans = textLayer.querySelectorAll('span');
                const targetText = items[itemIndex].str.trim();
                if (targetText) {
                    document.querySelectorAll('.pdf-highlight').forEach(el => {
                        el.style.backgroundColor = 'transparent';
                        el.classList.remove('pdf-highlight');
                    });

                    for (let span of spans) {
                        if (span.textContent.includes(targetText)) {
                            span.style.backgroundColor = '#fef08a';
                            span.style.color = '#000';
                            span.classList.add('pdf-highlight');
                            span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            break;
                        }
                    }
                }
            }
        }
    };

    const stopReading = (e) => {
        if (e) e.stopPropagation();
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        document.querySelectorAll('.pdf-highlight').forEach(el => {
            el.style.backgroundColor = 'transparent';
            el.classList.remove('pdf-highlight');
        });
    };

    useEffect(() => {
        const handleListenHighlight = async (event) => {
            const { charIndex, text } = event.detail;
            if (charIndex === -1) {
                document.querySelectorAll('.pdf-highlight').forEach(el => {
                    el.style.backgroundColor = 'transparent';
                    el.classList.remove('pdf-highlight');
                });
                return;
            }

            if (!pdfInstance) return;
            const page = await pdfInstance.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const items = textContent.items;

            // The text read from AIAssistantMenu is just a snippet.
            // We need to find where that snippet starts in the full page text.
            const pageFullText = items.map(item => item.str).join(" ");
            const snippetStartInPage = pageFullText.indexOf(text);

            if (snippetStartInPage !== -1) {
                // Adjust charIndex to be relative to the whole page
                triggerHighlight(snippetStartInPage + charIndex, items);
            }
        };

        document.addEventListener('AI_LISTEN_HIGHLIGHT', handleListenHighlight);
        return () => document.removeEventListener('AI_LISTEN_HIGHLIGHT', handleListenHighlight);
    }, [pdfInstance, pageNumber]);

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
        if (msLeft <= 0) {
            setAccessExpired(true);
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setSelection(null);
            return;
        }
        const timer = setTimeout(() => {
            setAccessExpired(true);
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setSelection(null);
        }, msLeft);
        return () => clearTimeout(timer);
    }, [expiryDate]);

    const onDocumentLoadSuccess = useCallback((pdf) => {
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setPdfLoading(false);
        setPdfInstance(pdf);
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

    const [containerWidth, setContainerWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            const container = document.querySelector('.pdf-container');
            if (container) {
                setContainerWidth(container.clientWidth);
            } else {
                setContainerWidth(window.innerWidth);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Auto-scale PDF on mobile or small containers
        if (containerWidth < 768) {
            // Roughly fit the page to width (react-pdf Page scale 1.0 is ~612pt wide)
            // A conservative approach for 100% width on small screens
            const newScale = (containerWidth - 48) / 600; // 48px for padding
            setScale(Math.max(0.5, Math.min(newScale, 2.0)));
        } else {
            setScale(1.1); // Default for desktop
        }
    }, [containerWidth]);

    const handleMouseUp = () => {
        const sel = window.getSelection();
        const text = sel.toString().trim();
        if (text) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                text,
                rect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                }
            });
        }
    };

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
            className="min-h-[100dvh] bg-gray-900 flex flex-col"
            onMouseUp={handleMouseUp}
        >
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-gray-800 shadow-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                {/* Row 1: Back button and Title/Author */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-white hover:text-gray-300 transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline text-sm font-medium">Back</span>
                    </button>

                    <div className="flex flex-col min-w-0 flex-1">
                        <h1 className="text-white font-semibold text-sm sm:text-base leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">{book.author}</p>
                    </div>
                </div>

                {/* Row 2: Reading Actions and Zoom Controls */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 px-1 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-2 shrink-0">
                        {pdfLoading ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600 text-gray-400 bg-gray-700/50">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Loading Reader...</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleAnalyzeStory}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-purple-500 bg-purple-600 text-white hover:bg-purple-500 transition-all group shrink-0"
                                    title="Analyze Characters & Themes"
                                >
                                    <Sparkles size={16} className="group-hover:animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider hidden min-[461px]:inline">Analyze Story</span>
                                </button>
                                <button
                                    onClick={handleReadAloudPage}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border transition-all shrink-0 ${isSpeaking ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-600 text-white border-purple-500 hover:bg-purple-500'}`}
                                >
                                    <Volume2 size={16} className={isSpeaking && !isPaused ? "animate-pulse" : ""} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider hidden min-[461px]:inline">
                                        {isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read Aloud"}
                                    </span>
                                </button>
                                {isSpeaking && (
                                    <button
                                        onClick={stopReading}
                                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shrink-0"
                                        title="Stop Reading"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-700/50 p-1.5 rounded-full px-3 shrink-0">
                        <button
                            onClick={zoomOut}
                            disabled={scale <= 0.5}
                            title="Zoom out"
                            className="p-1 rounded-full text-white hover:bg-gray-600 disabled:opacity-40 transition-colors"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-gray-300 text-[10px] sm:text-xs font-bold w-10 text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={zoomIn}
                            disabled={scale >= 2.5}
                            title="Zoom in"
                            className="p-1 rounded-full text-white hover:bg-gray-600 disabled:opacity-40 transition-colors"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
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
                            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-3">
                                <Loader2 className="text-gray-400 animate-spin" size={32} />
                                <p className="text-gray-400 text-sm font-medium">Loading PDF...</p>
                            </div>
                        )}

                        <div className="pdf-container w-full flex flex-col items-center">
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
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-2xl rounded-sm max-w-full"
                                />
                            </Document>
                        </div>
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

            <AnimatePresence>
                {selection && (
                    <AIAssistantMenu
                        text={selection.text}
                        position={selection.rect}
                        onClear={() => setSelection(null)}
                    />
                )}
            </AnimatePresence>

            <StoryAnalyzer
                isOpen={isAnalyzerOpen}
                onClose={() => setIsAnalyzerOpen(false)}
                textToAnalyze={analysisText}
            />
        </div>
    );
};

export default PhysicalBookReader;
