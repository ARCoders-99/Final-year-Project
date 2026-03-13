import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, User, Users, Feather } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StoryAnalyzer = ({ isOpen, onClose, textToAnalyze }) => {
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && textToAnalyze) {
            handleAnalyze();
        }
    }, [isOpen]);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/ai/analyze`,
                { text: textToAnalyze },
                { withCredentials: true }
            );

            if (data.success) {
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error("Story Analysis Error:", error);
            toast.error(error.response?.data?.message || "Failed to analyze story");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // Helper to format the AI response into sections
    const renderAnalysis = () => {
        if (!analysis || typeof analysis !== 'object') return null;

        const sections = [
            { title: 'Characters', content: analysis.characters?.map(c => `* ${c}`).join('\n'), icon: <User size={18} /> },
            { title: 'Relationships', content: analysis.relationships?.map(r => `* ${r}`).join('\n'), icon: <Users size={18} /> },
            { title: 'Themes', content: analysis.themes?.map(t => `* ${t}`).join('\n'), icon: <Feather size={18} /> },
            { title: 'Summary', content: analysis.summary, icon: <Sparkles size={18} /> }
        ];

        return sections.map((section, index) => (
            <div key={section.title} className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                        {section.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {section.content || "No data detected for this section."}
                </div>
            </div>
        ));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Story Analyzer</h2>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">AI Insights</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar bg-white">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="relative">
                                        <Loader2 className="animate-spin text-purple-600" size={48} strokeWidth={1.5} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-purple-400 animate-pulse" size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">Analyzing Story</h3>
                                        <p className="text-gray-500 text-sm max-w-[240px]">Advanced NLP is identifying characters and themes from the current content...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {analysis ? renderAnalysis() : (
                                        <div className="text-center py-12">
                                            <p className="text-gray-400">No analysis available.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-widest">
                                Powered by Advanced Local NLP
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default StoryAnalyzer;
