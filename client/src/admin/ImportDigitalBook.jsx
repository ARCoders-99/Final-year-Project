import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchGutenbergBooks, importGutenbergBook, resetDigitalSlice } from "../store/slices/digitalSlice";
import { toast } from "react-toastify";
import Header from "../layout/Header";
import { Search, Loader2, Import } from "lucide-react";

const ImportDigitalBook = () => {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [borrowLimit, setBorrowLimit] = useState(5);

    const dispatch = useDispatch();
    const { loading, error, message, searchByGutenbergResults } = useSelector(
        (state) => state.digital
    );

    useEffect(() => {
        if (!title && !author) {
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            dispatch(searchGutenbergBooks(title, author));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [title, author, dispatch]);

    const handleImport = (book) => {
        const importData = {
            ...book,
            borrowLimitDays: Number(borrowLimit),
        };
        dispatch(importGutenbergBook(importData));
    };

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

    return (
        <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
            <Header />
            <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Import Digital Book</h2>
            </header>

            {/* Search Form */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Title..."
                            className="w-full border p-3 pl-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Author..."
                            className="w-full border p-3 pl-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-600">Borrow Limit (Days):</label>
                        <input
                            type="number"
                            min="1"
                            className="border p-2 w-20 rounded-lg focus:ring-2 focus:ring-black outline-none"
                            value={borrowLimit}
                            onChange={(e) => setBorrowLimit(e.target.value)}
                        />
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Searching...</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Search Results */}
            <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Gutenberg Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchByGutenbergResults && searchByGutenbergResults.length > 0 ? (
                        searchByGutenbergResults.map((book) => (
                            <div key={book.gutenbergId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="h-64 bg-gray-200 overflow-hidden">
                                    <img
                                        src={book.coverImage || "https://via.placeholder.com/150x200?text=No+Cover"}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-bold text-gray-800 line-clamp-2 mb-1">{book.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2 truncate">{book.author}</p>
                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{book.description}</p>
                                    <div className="mt-auto">
                                        <button
                                            onClick={() => handleImport(book)}
                                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Import size={18} />
                                            Import to Library
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && <p className="text-gray-500 italic">No search results to display.</p>
                    )}
                </div>
            </section>
        </main>
    );
};

export default ImportDigitalBook;
