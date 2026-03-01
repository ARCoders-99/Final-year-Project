import { BookA, BookOpen, Clock, Loader2, Undo2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popUpSlice";
import { returnBook, fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchMyDigitalBorrows, returnDigitalBook } from "../store/slices/digitalSlice";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "../layout/Header";
import ReadBookPopup from "../popups/ReadBookPopup";
import { AnimatePresence } from "framer-motion";

// ─── Live countdown helper ─────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const calc = () => {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return { label: "Expired", status: "expired" };
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const label = [d > 0 && `${d}d`, h > 0 && `${h}h`, m > 0 && `${m}m`, `${sec}s`]
      .filter(Boolean).join(" ");
    return { label, status: diff < 24 * 3600 * 1000 ? "urgent" : "ok" };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return state;
};

const ExpiryBadge = ({ expiryDate }) => {
  const { label, status } = useCountdown(expiryDate);
  const cls = {
    ok: "text-green-700 bg-green-50 border-green-200",
    urgent: "text-amber-700 bg-amber-50 border-amber-200",
    expired: "text-red-700 bg-red-50 border-red-200",
  };
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold bg-white p-2 rounded-lg border">
      <Clock size={13} className={status === "ok" ? "text-green-600" : status === "urgent" ? "text-amber-600" : "text-red-500"} />
      <span className={`px-1.5 py-0.5 rounded-full border ${cls[status]}`}>{label}</span>
    </div>
  );
};
// ──────────────────────────────────────────────────────────────────────────────

const MyBorrowedBooks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books } = useSelector((state) => state.book);
  const { userBorrowedBooks } = useSelector((state) => state.borrow);
  const { myDigitalBorrows, loading: digitalLoading } = useSelector((state) => state.digital);
  const { readBookPopup } = useSelector((state) => state.popup);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [readBook, setReadBook] = useState({});
  const [filter, setFilter] = useState("nonReturned"); // Shared filter: nonReturned | returned
  const [activeTab, setActiveTab] = useState("physical"); // physical | digital

  // Open book details popup
  const openReadPopup = (id) => {
    const book = books.find((book) => book._id === id);
    setReadBook(book);
    dispatch(toggleReadBookPopup());
  };

  // Fetch all borrows on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserBorrowedBooks());
      dispatch(fetchMyDigitalBorrows());
    }
  }, [dispatch, isAuthenticated]);

  // Auto-return expired physical borrows in real-time
  useEffect(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return;
    const timers = [];
    const now = Date.now();
    const runReturn = async (borrow) => {
      try { await dispatch(returnBook({ borrowId: borrow._id })); } catch (_) { }
      dispatch(fetchUserBorrowedBooks());
    };
    for (const borrow of userBorrowedBooks) {
      if (borrow.returned) continue;
      const msUntilExpiry = new Date(borrow.dueDate).getTime() - now;
      if (msUntilExpiry <= 0) { runReturn(borrow); }
      else { timers.push(setTimeout(() => runReturn(borrow), msUntilExpiry)); }
    }
    return () => timers.forEach(clearTimeout);
  }, [userBorrowedBooks, dispatch]);

  const formatDate = (timeStamp) => {
    if (!timeStamp) return "N/A";
    const date = new Date(timeStamp);
    if (isNaN(date.getTime())) return "Invalid Date";
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // Filtering for Physical Books
  const physicalReturned = userBorrowedBooks?.filter((b) => b.returned === true) || [];
  const physicalBorrowed = userBorrowedBooks?.filter((b) => b.returned === false) || [];
  const physicalToDisplay = filter === "returned" ? physicalReturned : physicalBorrowed;

  // Filtering for Digital Books
  const digitalReturned = myDigitalBorrows?.filter((b) => b.returned === true || new Date(b.expiryDate) <= new Date()) || [];
  const digitalBorrowed = myDigitalBorrows?.filter((b) => b.returned === false && new Date(b.expiryDate) > new Date()) || [];
  const digitalToDisplay = filter === "returned" ? digitalReturned : digitalBorrowed;

  const handleReturnPhysical = async (borrowId) => {
    try {
      await dispatch(returnBook({ borrowId }));
      toast.success("Physical book returned!");
      dispatch(fetchUserBorrowedBooks());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return.");
    }
  };

  const handleReturnDigital = async (borrowId) => {
    try {
      await dispatch(returnDigitalBook(borrowId));
      toast.success("Digital book returned!");
      dispatch(fetchMyDigitalBorrows());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return.");
    }
  };

  return (
    <>
      <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
        <Header />
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Borrowed Books</h2>
        </header>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("physical")} className={`px-6 py-2 text-sm font-semibold transition-all ${activeTab === "physical" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}>Physical Books</button>
          <button onClick={() => setActiveTab("digital")} className={`px-6 py-2 text-sm font-semibold transition-all ${activeTab === "digital" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}>Digital Books</button>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-col gap-3 sm:flex-row md:items-center mt-4">
          <button onClick={() => setFilter("nonReturned")} className={`rounded-lg border-2 font-semibold py-2 w-full sm:w-64 transition-all ${filter === "nonReturned" ? "bg-black text-white border-black shadow-lg" : "bg-white text-gray-600 border-gray-200"}`}>Currently Borrowed</button>
          <button onClick={() => setFilter("returned")} className={`rounded-lg border-2 font-semibold py-2 w-full sm:w-64 transition-all ${filter === "returned" ? "bg-black text-white border-black shadow-lg" : "bg-white text-gray-600 border-gray-200"}`}>Returned Books</button>
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {(activeTab === "physical" ? physicalToDisplay : digitalToDisplay)?.length > 0 ? (
            <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Book Title</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Borrowed</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due / Expiry</th>
                    {filter !== "returned" && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>}
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {filter === "returned" && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Returned At</th>}
                    {filter !== "returned" && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(activeTab === "physical" ? physicalToDisplay : digitalToDisplay).map((record, index) => (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">#{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{activeTab === "physical" ? record.bookTitle : record.book?.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(activeTab === "physical" ? record.borrowedDate : record.borrowDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(activeTab === "physical" ? record.dueDate : record.expiryDate)}</td>
                      {filter !== "returned" && (
                        <td className="px-6 py-4">
                          <ExpiryBadge expiryDate={activeTab === "physical" ? record.dueDate : record.expiryDate} />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${record.returned || (activeTab === "digital" && new Date(record.expiryDate) <= new Date())
                            ? "bg-green-100 text-green-700"
                            : (new Date(activeTab === "physical" ? record.dueDate : record.expiryDate) > new Date()
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700")
                          }`}>
                          {record.returned || (activeTab === "digital" && new Date(record.expiryDate) <= new Date())
                            ? "Returned"
                            : (new Date(activeTab === "physical" ? record.dueDate : record.expiryDate) > new Date() ? "Active" : "Expired")}
                        </span>
                      </td>
                      {filter === "returned" && (
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(record.returnDate || record.updatedAt)}</td>
                      )}
                      {filter !== "returned" && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <BookA onClick={() => openReadPopup(activeTab === "physical" ? record.bookId : record.book?._id)} className="text-gray-400 hover:text-black cursor-pointer transition-colors" size={18} title="View Details" />
                            {!record.returned && new Date(activeTab === "physical" ? record.dueDate : record.expiryDate) > new Date() && (
                              <button onClick={() => navigate(activeTab === "physical" ? `/read-book/${record.bookId}` : `/reader/${record.book?._id}`)} className="px-3 py-1.5 bg-black text-white text-[10px] rounded-lg hover:bg-gray-800 font-semibold uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><BookOpen size={12} /> Read</div>
                              </button>
                            )}
                            {!record.returned && (
                              <button onClick={() => activeTab === "physical" ? handleReturnPhysical(record._id) : handleReturnDigital(record._id)} className="px-3 py-1.5 bg-red-100 text-red-600 text-[10px] rounded-lg hover:bg-red-200 font-semibold uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                <Undo2 size={12} /> Return
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm text-gray-400 italic">
              No {activeTab} records found in this category.
            </div>
          )}
        </div>
      </main>
      <AnimatePresence>
        {readBookPopup && <ReadBookPopup key="read-book-popup" book={readBook} />}
      </AnimatePresence>
    </>
  );
};

export default MyBorrowedBooks;
