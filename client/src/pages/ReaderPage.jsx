import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyDigitalBorrows, fetchAllDigitalBooks } from "../store/slices/digitalSlice";
import { ArrowLeft, Clock, Volume2, X, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AIAssistantMenu from "../components/AIAssistantMenu";
import StoryAnalyzer from "../components/StoryAnalyzer";
import { toast } from "react-toastify";
import axios from "axios";

const ReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { myDigitalBorrows, digitalBooks, loading: digitalLoading } = useSelector((state) => state.digital);
    const { user } = useSelector((state) => state.auth);
    const [borrowRecord, setBorrowRecord] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [selection, setSelection] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
    const [analysisText, setAnalysisText] = useState("");

    const handleReadAloud = () => {
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

        const iframe = document.querySelector('iframe');
        if (!iframe) return;

        // IMPORTANT: speechSynthesis.speak() must be called within the user gesture
        // window. We prime it immediately with a silent utterance so the browser
        // unlocks speech, then swap in the real text when it arrives from the iframe.
        window.speechSynthesis.cancel();
        const primer = new SpeechSynthesisUtterance('\u200B'); // zero-width space
        primer.volume = 0;
        primer.rate = 10;
        window.speechSynthesis.speak(primer);

        iframe.contentWindow.postMessage({ type: 'GET_FULL_TEXT' }, '*');
        setIsSpeaking(true);
        setIsPaused(false);
    };

    const stopReading = (e) => {
        if (e) e.stopPropagation();
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        const iframe = document.querySelector('iframe');
        if (iframe) iframe.contentWindow.postMessage({ type: 'SET_HIGHLIGHT', charIndex: -1 }, '*');
    };

    const openStoryAnalyzer = () => {
        // For digital books, we'll try to get some text from the iframe or fetch a snippet
        // A simple way is to request full text again or use a placeholder if empty
        const iframe = document.querySelector('iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'GET_TEXT_FOR_ANALYSIS' }, '*');
        }
    };

    useEffect(() => {
        dispatch(fetchMyDigitalBorrows());
        if (user?.role === "Admin") {
            dispatch(fetchAllDigitalBooks());
        }
    }, [dispatch, user]);

    useEffect(() => {
        let record = myDigitalBorrows.find(
            (b) => b.book._id === id && !b.returned && new Date(b.expiryDate) > new Date()
        );

        if (!record && user?.role === "Admin") {
            const book = digitalBooks.find(b => b._id === id);
            if (book) {
                record = {
                    book,
                    expiryDate: new Date(Date.now() + 86400000),
                    isAdminPreview: true
                };
            }
        }
        setBorrowRecord(record);
    }, [myDigitalBorrows, digitalBooks, id, user]);

    useEffect(() => {
        if (!borrowRecord) return;
        const expiry = new Date(borrowRecord.expiryDate).getTime();
        const tick = () => {
            if (borrowRecord.isAdminPreview) {
                setTimeLeft("Unlimited (Admin Preview)");
                return;
            }
            const now = Date.now();
            const diff = expiry - now;
            if (diff <= 0) {
                clearInterval(timer);
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setSelection(null);
                navigate(-1);
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [borrowRecord, navigate]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'TEXT_SELECTION') {
                const { text, rect } = event.data;
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    const iframeRect = iframe.getBoundingClientRect();
                    setSelection({
                        text,
                        rect: {
                            top: rect.top + iframeRect.top,
                            left: rect.left + iframeRect.left,
                            width: rect.width,
                            height: rect.height
                        }
                    });
                }
            } else if (event.data.type === 'CLEAR_SELECTION') {
                setSelection(null);
            } else if (event.data.type === 'FULL_TEXT_CONTENT') {
                const text = event.data.text;
                if (!text) { setIsSpeaking(false); return; }

                // Cancel primer, then speak the real text
                window.speechSynthesis.cancel();

                const iframe = document.querySelector('iframe');

                // Split into chunks to avoid Chrome's ~15s utterance timeout bug
                const chunkSize = 2000;
                const chunks = [];
                for (let i = 0; i < text.length; i += chunkSize) {
                    chunks.push(text.slice(i, i + chunkSize));
                }

                let chunkIndex = 0;
                const speakNext = () => {
                    if (chunkIndex >= chunks.length) {
                        setIsSpeaking(false);
                        setIsPaused(false);
                        if (iframe) iframe.contentWindow.postMessage({ type: 'SET_HIGHLIGHT', charIndex: -1 }, '*');
                        return;
                    }
                    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
                    utterance.onboundary = (ev) => {
                        if (ev.name === 'word' && iframe) {
                            const globalIndex = chunkIndex * chunkSize + ev.charIndex;
                            iframe.contentWindow.postMessage({
                                type: 'SET_HIGHLIGHT',
                                charIndex: globalIndex,
                                length: ev.charLength || 0
                            }, '*');
                        }
                    };
                    utterance.onend = () => { chunkIndex++; speakNext(); };
                    utterance.onerror = () => {
                        setIsSpeaking(false);
                        setIsPaused(false);
                        if (iframe) iframe.contentWindow.postMessage({ type: 'SET_HIGHLIGHT', charIndex: -1 }, '*');
                    };
                    window.speechSynthesis.speak(utterance);
                };

                speakNext();
            } else if (event.data.type === 'TEXT_FOR_ANALYSIS_CONTENT') {
                setAnalysisText(event.data.text);
                setIsAnalyzerOpen(true);
            }
        };

        window.addEventListener('message', handleMessage);

        const customEventListener = (e) => {
            if (e.type === 'AI_LISTEN_HIGHLIGHT') {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    iframe.contentWindow.postMessage({
                        type: 'SET_HIGHLIGHT',
                        charIndex: e.detail.charIndex,
                        textSnippet: e.detail.text
                    }, '*');
                }
            }
        };
        document.addEventListener('AI_LISTEN_HIGHLIGHT', customEventListener);

        return () => {
            window.removeEventListener('message', handleMessage);
            document.removeEventListener('AI_LISTEN_HIGHLIGHT', customEventListener);
        };
    }, []); // stable — never re-creates, no race condition

    // Cancel speech when component unmounts
    useEffect(() => {
        return () => { window.speechSynthesis.cancel(); };
    }, []);

    if (digitalLoading && !borrowRecord) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    if (!borrowRecord && !digitalLoading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4 bg-gray-50 p-6 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <X size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 max-w-sm">You do not have an active borrow for this book or your access has expired.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 bg-gray-900 text-white px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg"
                >
                    Go Back to Library
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-white">
            {/* Reader Navbar */}
            <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-2.5 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 shadow-sm z-10">
                {/* Left Section: Back button and Title/Author */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-600 shrink-0 mt-0.5"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div className="min-w-0">
                        <h1 className="font-bold text-sm md:text-base text-gray-900 leading-tight">
                            {borrowRecord?.book.title}
                        </h1>
                        <p className="text-[10px] md:text-[11px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">
                            By {borrowRecord?.book.author}
                        </p>
                    </div>
                </div>

                {/* Right Section: AI Controls + Timer */}
                <div className="flex items-center justify-end gap-2 md:gap-3 shrink-0 px-1 md:px-0">
                    {!isIframeLoaded ? (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs font-medium italic">Loading content...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 md:gap-3 md:w-auto mt-1 md:mt-0">
                            {/* Story Analyzer Button */}
                            <button
                                onClick={openStoryAnalyzer}
                                className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all group shrink-0"
                                title="Analyze Characters & Themes"
                            >
                                <Sparkles size={14} md:size={18} className="group-hover:animate-pulse" />
                                <span className="text-[10px] sm:text-sm font-semibold hidden min-[461px]:inline">Story Analyzer</span>
                            </button>

                            {/* Read Aloud All */}
                            <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                    onClick={handleReadAloud}
                                    className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all ${isSpeaking ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-200' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700'} shrink-0`}
                                >
                                    <Volume2 size={14} md:size={18} className={isSpeaking && !isPaused ? "animate-pulse" : ""} />
                                    <span className="text-[10px] sm:text-sm font-semibold hidden min-[461px]:inline">
                                        {isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read Aloud"}
                                    </span>
                                </button>
                                {isSpeaking && (
                                    <button
                                        onClick={stopReading}
                                        className="p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md shadow-red-100"
                                        title="Stop Reading"
                                    >
                                        <X size={14} md:size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Timer on Mobile (positioned next to features) */}
                            <div className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white shrink-0 ${borrowRecord.isAdminPreview ? 'text-blue-700 border-blue-200' : 'text-amber-700 border-amber-200'}`}>
                                <Clock size={14} />
                                <span className="text-[10px] font-bold">{borrowRecord.isAdminPreview ? "Admin" : timeLeft}</span>
                            </div>
                        </div>
                    )}

                    {/* Timer on Desktop */}
                    <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border ${borrowRecord.isAdminPreview ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        <Clock size={16} />
                        <span className="text-[11px] font-bold">{borrowRecord.isAdminPreview ? "Admin Mode" : timeLeft}</span>
                    </div>
                </div>
            </nav>

            {/* Reader Content */}
            <div className="flex-1 relative overflow-hidden bg-white">
                {!isIframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
                        <p className="text-gray-500 text-xs font-medium tracking-wide">Loading Book Content...</p>
                    </div>
                )}

                <iframe
                    src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/read/${id}`}
                    onLoad={() => setIsIframeLoaded(true)}
                    className={`w-full h-full border-none transition-opacity duration-300 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    title="Book Reader"
                />
            </div >

            <StoryAnalyzer
                isOpen={isAnalyzerOpen}
                onClose={() => setIsAnalyzerOpen(false)}
                textToAnalyze={analysisText}
            />

            <AnimatePresence>
                {selection && (
                    <AIAssistantMenu
                        text={selection.text}
                        position={selection.rect}
                        onClear={() => setSelection(null)}
                    />
                )}
            </AnimatePresence>

            <style>{`
                body { overflow: hidden; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div >
    );
};

export default ReaderPage;
