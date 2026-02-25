import { BookOpen, NotebookPen, ExternalLink, BookA, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAddBookPopup,
  toggleReadBookPopup,
  toggleRecordBookPopup,
} from "../store/slices/popUpSlice";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllBooks, resetBookSlice } from "../store/slices/bookSlice";
import {
  recordBorrowBook,
  resetBorrowSlice,
  fetchUserBorrowedBooks,
} from "../store/slices/borrowSlice";
import { toast } from "react-toastify";
import Header from "../layout/Header";
import AddBookPopup from "../popups/AddBookPopup";
import ReadBookPopup from "../popups/ReadBookPopup";
import RecordBookPopup from "../popups/RecordBookPopup";


const BookManagement = () => {
  const dispatch = useDispatch();

  const { error, message, books, loading } = useSelector((state) => state.book);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { addBookPopup, readBookPopup, recordBookPopup } = useSelector(
    (state) => state.popup
  );
  const { userBorrowedBooks, loading: borrowSliceError, message: borrowSliceMessage } = useSelector(
    (state) => state.borrow
  );

  const [readBook, setReadBook] = useState({});
  const [borrowBookId, setBorrowBookId] = useState("");
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const navigate = useNavigate();

  // Open book popup
  const openReadPopup = (id) => {
    const book = books.find((book) => book._id === id);
    setReadBook(book);
    dispatch(toggleReadBookPopup());
  };

  // Open record book popup (admin)
  const openRecordBookPopup = (bookId) => {
    setBorrowBookId(bookId);
    dispatch(toggleRecordBookPopup({ isOpen: true, bookId }));
  };

  // Borrow book
  const handleBorrowBook = async (bookId) => {
    try {
      const actionResult = await dispatch(recordBorrowBook(user.email, bookId));
      if (actionResult?.payload) {
        toast.success(actionResult.payload);
      }
      dispatch(fetchUserBorrowedBooks());
      dispatch(fetchAllBooks());
    } catch (err) {
      toast.error(err || "Failed to borrow book");
    }
  };

  // Fetch books and user borrowed books on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAllBooks());
      dispatch(fetchUserBorrowedBooks());
    }
  }, [dispatch, isAuthenticated]);

  // Handle global messages and errors
  useEffect(() => {
    if (message || borrowSliceMessage) {
      toast.success(message || borrowSliceMessage);
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }

    if (error || borrowSliceError) {
      toast.error(error || borrowSliceError);
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
  }, [dispatch, error, message, borrowSliceError, borrowSliceMessage]);

  const handleSearch = (e) => {
    setSearchedKeyword(e.target.value.toLowerCase());
  };

  const searchedBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchedKeyword)
  );

  const isAdmin = user?.role === "Admin";

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">
            {isAdmin ? "Book Management" : "Books"}
          </h2>

          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {isAuthenticated && isAdmin && (
              <button
                onClick={() => dispatch(toggleAddBookPopup())}
                className="relative pl-14 w-full sm:w-52 flex gap-4 justify-center items-center py-2 pr-4 bg-black text-white rounded-md hover:bg-gray-800 overflow-hidden hover-scale"
              >
                <span className="bg-white flex justify-center items-center rounded-full text-black w-7 h-7 text-lg absolute left-4 top-1/2 -translate-y-1/2 shadow-md">
                  +
                </span>
                Add Book
              </button>
            )}

            <input
              type="text"
              placeholder="Search books..."
              className="w-full sm:w-52 border p-2 border-gray-300 rounded-md"
              value={searchedKeyword}
              onChange={handleSearch}
            />
          </div>
        </header>

        {/* ───── ADMIN VIEW: Table ───── */}
        {isAdmin && (
          <>
            {searchedBooks.length > 0 ? (
              <div className="mt-2 overflow-auto bg-white rounded-md shadow-lg">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Cover</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Author</th>
                      <th className="px-4 py-2 text-left">Qty</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedBooks.map((book, index) => (
                      <tr key={book._id} className={(index + 1) % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">
                          <img
                            src={book.coverImageUrl || "https://via.placeholder.com/40x50?text=N/A"}
                            alt={book.title}
                            className="h-12 w-9 object-cover rounded"
                          />
                        </td>
                        <td className="px-4 py-2 font-medium">{book.title}</td>
                        <td className="px-4 py-2 text-gray-600">{book.author}</td>
                        <td className="px-4 py-2">{book.quantity}</td>
                        <td className="px-4 py-2">${book.price}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${book.availability
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {book.availability ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-3">
                            {book.pdfUrl && (
                              <button
                                onClick={() => navigate(`/read-book/${book._id}`)}
                                title="Read PDF"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink size={17} />
                              </button>
                            )}
                            <BookA
                              size={17}
                              onClick={() => openReadPopup(book._id)}
                              className="hover:cursor-pointer text-indigo-600 hover:text-indigo-800"
                              title="Book details"
                            />
                            <NotebookPen
                              size={17}
                              onClick={() => openRecordBookPopup(book._id)}
                              className="hover:cursor-pointer text-green-600 hover:text-green-800"
                              title="Record borrow"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <h3 className="text-3xl mt-5 font-medium">No books found in the library!</h3>
            )}
          </>
        )}

        {/* ───── USER VIEW: Card Grid ───── */}
        {!isAdmin && (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin" size={48} />
              </div>
            ) : searchedBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                {searchedBooks.map((book) => {
                  const alreadyBorrowed = userBorrowedBooks?.some(
                    (borrow) =>
                      borrow.bookId === book._id && borrow.returned === false
                  );

                  return (
                    <div
                      key={book._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col"
                    >
                      {/* Cover Image */}
                      <div className="h-52 bg-gray-200 overflow-hidden relative group">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://via.placeholder.com/200x260?text=No+Cover"
                          }
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col gap-1">
                        <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                          {book.title}
                        </h4>
                        <p className="text-sm text-gray-500">by {book.author}</p>
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="font-semibold text-gray-800">
                            ${book.price} <span className="font-normal text-gray-400">/ borrow</span>
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.availability
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {book.availability
                              ? `${book.quantity} left`
                              : "Unavailable"}
                          </span>
                        </div>

                        {/* Buttons */}
                        <div className="mt-auto pt-3 flex flex-col gap-2">
                          {book.pdfUrl && (
                            <button
                              onClick={() => navigate(`/read-book/${book._id}`)}
                              disabled={(() => {
                                const borrow = userBorrowedBooks?.find(b => b.bookId === book._id && !b.returned);
                                if (!borrow) return true; // Must borrow first
                                return new Date(borrow.dueDate) <= new Date(); // Must not be expired
                              })()}
                              className="flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <BookOpen size={15} />
                              {(() => {
                                const borrow = userBorrowedBooks?.find(b => b.bookId === book._id && !b.returned);
                                if (!borrow) return "Read Book";
                                if (new Date(borrow.dueDate) <= new Date()) return "Access Expired";
                                return "Read Book";
                              })()}
                            </button>
                          )}
                          <button
                            onClick={() => handleBorrowBook(book._id)}
                            disabled={!book.availability || alreadyBorrowed}
                            className="py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {alreadyBorrowed ? "Already Borrowed" : "Borrow"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <h3 className="text-2xl mt-10 font-medium text-gray-500 text-center">
                No books found in the library!
              </h3>
            )}
          </>
        )}
      </main>

      {addBookPopup && <AddBookPopup />}
      {readBookPopup && <ReadBookPopup book={readBook} />}
      {recordBookPopup && <RecordBookPopup bookId={borrowBookId} />}
    </>
  );
};

export default BookManagement;
