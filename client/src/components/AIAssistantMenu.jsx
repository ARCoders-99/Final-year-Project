import React, { useState, useEffect } from "react";
import { Brain, Languages, Sparkles, Volume2, X, Loader2, ChevronLeft, GripHorizontal } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { toast } from "react-toastify";

const AIAssistantMenu = ({ text, position, onClear }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [view, setView] = useState("main"); // "main" or "languages"
    const [actionType, setActionType] = useState("");
    const dragControls = useDragControls();

    const languages = [
        { code: "Urdu", name: "Urdu" },
        { code: "Spanish", name: "Spanish" },
        { code: "French", name: "French" },
        { code: "German", name: "German" },
        { code: "Chinese", name: "Chinese" },
        { code: "Arabic", name: "Arabic" },
    ];

    const handleAIAction = async (action, targetLanguage = null) => {
        setActionType(action === "translate" ? `Translation (${targetLanguage})` : action.charAt(0).toUpperCase() + action.slice(1));
        setLoading(true);
        setResult("");
        const loadingToast = toast.info("AI is thinking...", { autoClose: false });
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/process`,
                { text, action, targetLanguage },
                { withCredentials: true }
            );
            if (data.success) {
                setResult(data.result);
                setView("main");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "AI Error");
        } finally {
            toast.dismiss(loadingToast);
            setLoading(false);
        }
    };

    const handleListen = () => {
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

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Determine if we are in Digital Reader or Physical Reader
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    iframe.contentWindow.postMessage({
                        type: 'SET_HIGHLIGHT',
                        charIndex: event.charIndex,
                        length: event.charLength || 0,
                        isSelectionOnly: true // Internal flag to handle selection offset
                    }, '*');
                } else {
                    // Physical Reader highlighting logic (handled via custom event or similar)
                    const eventDetail = { charIndex: event.charIndex, text };
                    document.dispatchEvent(new CustomEvent('AI_LISTEN_HIGHLIGHT', { detail: eventDetail }));
                }
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            const iframe = document.querySelector('iframe');
            if (iframe) iframe.contentWindow.postMessage({ type: 'SET_HIGHLIGHT', charIndex: -1 }, '*');
            document.dispatchEvent(new CustomEvent('AI_LISTEN_HIGHLIGHT', { detail: { charIndex: -1 } }));
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
    };

    const stopListen = (e) => {
        e.stopPropagation();
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        const iframe = document.querySelector('iframe');
        if (iframe) iframe.contentWindow.postMessage({ type: 'SET_HIGHLIGHT', charIndex: -1 }, '*');
        document.dispatchEvent(new CustomEvent('AI_LISTEN_HIGHLIGHT', { detail: { charIndex: -1 } }));
    };

    const formatResult = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.includes(':')) {
                const [label, content] = line.split(':');
                return (
                    <p key={i} className="mb-2 last:mb-0">
                        <strong className="text-black block text-sm mb-0.5">{label.trim()}:</strong>
                        <span className="text-gray-700 leading-relaxed text-sm">{content.trim()}</span>
                    </p>
                );
            }
            return <p key={i} className="mb-2 last:mb-0 text-gray-700 leading-relaxed text-sm">{line}</p>;
        });
    };

    const menuStyle = {
        top: Math.max(10, position.top - 120),
        left: Math.min(window.innerWidth - 320, Math.max(10, position.left + position.width / 2 - 150)),
    };

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            style={menuStyle}
            className="fixed z-[100] w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden"
        >
            {/* Header / Drag Handle */}
            <div
                className="bg-black p-3.5 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="flex items-center gap-2.5">
                    {view === "languages" ? (
                        <button onClick={(e) => { e.stopPropagation(); setView("main"); }} className="text-white hover:text-gray-300 flex items-center gap-1 transition-colors">
                            <ChevronLeft size={20} />
                            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Brain size={20} className="text-white" />
                            <span className="text-white text-xs font-bold uppercase tracking-widest">AI ASSISTANT</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <GripHorizontal size={20} className="text-gray-500" />
                    <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="p-1.5 min-h-[160px] bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-10 gap-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2 size={36} className="text-black" />
                        </motion.div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processing Request...</p>
                    </div>
                ) : result ? (
                    <div className="p-5">
                        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Sparkles size={16} className="text-purple-600" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">{actionType}</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="max-h-[250px] overflow-y-auto pr-2 no-scrollbar scroll-smooth">
                                {formatResult(result)}
                            </div>
                            <button
                                onClick={() => setResult("")}
                                className="w-full mt-2 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                            >
                                Great, Thanks!
                            </button>
                        </div>
                    </div>
                ) : view === "main" ? (
                    <div className="grid grid-cols-2 gap-1.5 p-1">
                        <button
                            onClick={() => handleAIAction("explain")}
                            className="flex flex-col items-center gap-2 p-5 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-purple-100 group"
                        >
                            <Sparkles size={22} className="text-purple-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Explain</span>
                        </button>
                        <button
                            onClick={() => handleAIAction("simplify")}
                            className="flex flex-col items-center gap-2 p-5 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-blue-100 group"
                        >
                            <Brain size={22} className="text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Simplify</span>
                        </button>
                        <button
                            onClick={() => setView("languages")}
                            className="flex flex-col items-center gap-2 p-5 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-green-100 group"
                        >
                            <Languages size={22} className="text-green-600 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Translate</span>
                        </button>
                        <div className="relative group">
                            <button
                                onClick={handleListen}
                                className={`w-full flex flex-col items-center gap-2 p-5 rounded-xl transition-all border border-transparent ${isSpeaking ? 'bg-purple-50 border-purple-100' : 'hover:bg-gray-50 hover:border-orange-100'}`}
                            >
                                <Volume2 size={22} className={`${isSpeaking ? 'text-purple-600 animate-pulse' : 'text-orange-600 group-hover:scale-110 transition-transform'}`} />
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isSpeaking ? 'text-purple-600' : 'text-gray-700'}`}>
                                    {isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}
                                </span>
                            </button>
                            {isSpeaking && (
                                <button
                                    onClick={stopListen}
                                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-2 grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleAIAction("translate", lang.code)}
                                className="flex items-center justify-center p-4 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all text-[11px] font-bold uppercase tracking-wider border border-gray-100"
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Selection Snippet</span>
                <p className="text-[9px] text-gray-500 italic max-w-[180px] truncate">
                    "{text}"
                </p>
            </div>
        </motion.div>
    );
};

export default AIAssistantMenu;
