import { BookA, BookOpen, Clock, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popUpSlice";
import { returnBook, fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchMyDigitalBorrows } from "../store/slices/digitalSlice";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "../layout/Header";
import ReadBookPopup from "../popups/ReadBookPopup";

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
  const [filter, setFilter] = useState("nonReturned"); // default to non-returned
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

  // Auto-return expired borrows in real-time
  useEffect(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return;

    const timers = [];
    const now = Date.now();

    const runReturn = async (borrow) => {
      try {
        await dispatch(returnBook({ borrowId: borrow._id }));
      } catch (_) {
        // Silently skip — may already be returned
      }
      dispatch(fetchUserBorrowedBooks());
    };

    for (const borrow of userBorrowedBooks) {
      if (borrow.returned) continue;

      const msUntilExpiry = new Date(borrow.dueDate).getTime() - now;

      if (msUntilExpiry <= 0) {
        // Already expired but not yet returned — return it immediately
        runReturn(borrow);
      } else {
        // Schedule return at the exact expiry moment
        const timer = setTimeout(() => runReturn(borrow), msUntilExpiry);
        timers.push(timer);
      }
    }

    // Cleanup timers if component unmounts or borrows update
    return () => timers.forEach(clearTimeout);
  }, [userBorrowedBooks, dispatch]);

  // Date formatting function
  const formatDate = (timeStamp) => {
    if (!timeStamp) return "N/A";
    const date = new Date(timeStamp);
    if (isNaN(date.getTime())) return "Invalid Date";
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
    const formattedTime = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  // Separate returned and non-returned books (Physical)
  const returnedBooks = userBorrowedBooks?.filter((book) => book.returned === true);
  const nonReturnedBooks = userBorrowedBooks?.filter((book) => book.returned === false);
  const physicalBooksToDisplay = filter === "returned" ? returnedBooks : nonReturnedBooks;

  // Handle returning a physical book
  const handleReturnBook = async (borrowId) => {
    try {
      await dispatch(returnBook({ borrowId }));
      toast.success("Book returned successfully!");
      dispatch(fetchUserBorrowedBooks());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return book.");
    }
  };

  return (
    <>
      <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
        <Header />
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Borrowed Books</h2>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("physical")}
            className={`px-6 py-2 text-sm font-semibold transition-all ${activeTab === "physical"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Physical Books
          </button>
          <button
            onClick={() => setActiveTab("digital")}
            className={`px-6 py-2 text-sm font-semibold transition-all ${activeTab === "digital"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Digital Books
          </button>
        </div>

        {activeTab === "physical" && (
          <>
            {/* Filter buttons */}
            <div className="flex flex-col gap-3 sm:flex-row md:items-center mt-4">
              <button
                onClick={() => setFilter("returned")}
                className={`rounded-lg border-2 font-semibold py-2 w-full sm:w-64 transition-all ${filter === "returned" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200"
                  }`}
              >
                Returned
              </button>
              <button
                onClick={() => setFilter("nonReturned")}
                className={`rounded-lg border-2 font-semibold py-2 w-full sm:w-64 transition-all ${filter === "nonReturned" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200"
                  }`}
              >
                Currently Borrowed
              </button>
            </div>

            {/* Physical Books Table */}
            {physicalBooksToDisplay && physicalBooksToDisplay.length > 0 ? (
              <div className="mt-6 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Borrowed Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remaining Time</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      {filter === "returned" && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Returned Date</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fine</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {physicalBooksToDisplay.map((book, index) => (
                      <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{book.bookTitle}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(book.borrowedDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(book.dueDate)}</td>
                        <td className="px-6 py-4">
                          {!book.returned ? (
                            <ExpiryBadge expiryDate={book.dueDate} />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.returned ? "bg-green-100 text-green-700" : (new Date(book.dueDate) > new Date() ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}`}>
                            {book.returned ? "Returned" : (new Date(book.dueDate) > new Date() ? "Active" : "Expired")}
                          </span>
                        </td>
                        {filter === "returned" && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(book.returnDate)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-red-600">${book.fine?.toFixed(2) || "0.00"}</td>
                          </>
                        )}
                        <td className="px-6 py-4 flex gap-3 items-center">
                          <BookA
                            onClick={() => openReadPopup(book.bookId)}
                            className="text-gray-400 hover:text-black cursor-pointer transition-colors"
                            size={20}
                            title="View details"
                          />
                          {!book.returned && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/read-book/${book.bookId}`)}
                                disabled={new Date(book.dueDate) <= new Date()}
                                className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                <BookOpen size={14} />
                                Read
                              </button>
                              <button
                                onClick={() => handleReturnBook(book._id)}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                              >
                                Return
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-10 text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No collections found in this category.</p>
              </div>
            )}
          </>
        )}

        {activeTab === "digital" && (
          <div className="mt-4">
            {digitalLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-black" size={40} />
              </div>
            ) : myDigitalBorrows && myDigitalBorrows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myDigitalBorrows.map((borrow) => (
                  <div key={borrow._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                    <div className="flex p-4 gap-4">
                      <div className="relative overflow-hidden rounded shadow-sm flex-shrink-0">
                        <img
                          src={borrow.book.coverImage || "/placeholder.png"}
                          alt={borrow.book.title}
                          className="w-24 h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col flex-1 justify-between py-1">
                        <div>
                          <h3 className="font-bold text-gray-800 line-clamp-2 leading-snug">{borrow.book.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{borrow.book.author}</p>
                        </div>
                        <div className="space-y-3">
                          <ExpiryBadge expiryDate={borrow.expiryDate} />
                          <button
                            onClick={() => navigate(`/reader/${borrow.book._id}`)}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                          >
                            <BookOpen size={16} />
                            Read Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">You haven't borrowed any digital books yet.</p>
                <button
                  onClick={() => navigate("/digital-library")}
                  className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Browse Digital Library
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {readBookPopup && <ReadBookPopup book={readBook} />}
    </>
  );
};

export default MyBorrowedBooks;
