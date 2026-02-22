import { BookA, NotebookPen } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAddBookPopup,
  toggleReadBookPopup,
  toggleRecordBookPopup,
} from "../store/slices/popUpSlice";
import { useEffect, useState } from "react";
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

  const { error, message, books } = useSelector((state) => state.book);
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
      // Only show success message once
      if (actionResult?.payload) {
        toast.success(actionResult.payload);
      }
      // Refresh borrowed books and book list
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

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">
            {user && user.role === "Admin" ? "Book Management" : "Books"}
          </h2>

          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {isAuthenticated && user?.role === "Admin" && (
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

        {books && books.length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Author</th>
                  {user?.role === "Admin" && <th className="px-4 py-2 text-left">Quantity</th>}
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Availability</th>
                  {user?.role === "Admin" && <th className="px-4 py-2 text-center">Record Book</th>}
                  {user?.role === "User" && <th className="px-4 py-2 text-center">Action</th>}
                </tr>
              </thead>
              <tbody>
                {searchedBooks.map((book, index) => {
                  const alreadyBorrowed = userBorrowedBooks?.some(
                    (borrow) => borrow.bookId === book._id && borrow.returned === false
                  );

                  return (
                    <tr key={book._id} className={(index + 1) % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{book.title}</td>
                      <td className="px-4 py-2">{book.author}</td>
                      {user?.role === "Admin" && <td className="px-4 py-2">{book.quantity}</td>}
                      <td className="px-4 py-2">${book.price}</td>
                      <td className="px-4 py-2">{book.availability ? "Available" : "Unavailable"}</td>
                      {user?.role === "Admin" && (
                        <td className="px-4 py-2 flex space-x-2 my-3 justify-center">
                          <BookA
                            onClick={() => openReadPopup(book._id)}
                            className="hover:cursor-pointer hover-scale text-blue-600"
                          />
                          <NotebookPen
                            onClick={() => openRecordBookPopup(book._id)}
                            className="hover:cursor-pointer hover-scale text-green-600"
                          />
                        </td>
                      )}
                      {user?.role === "User" && (
                        <td className="px-4 py-2 flex justify-center">
                          <button
                            onClick={() => handleBorrowBook(book._id)}
                            disabled={!book.availability || alreadyBorrowed}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {alreadyBorrowed ? "Already Borrowed" : "Borrow"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <h3 className="text-3xl mt-5 font-medium">No Book found in Library!</h3>
        )}
      </main>

      {addBookPopup && <AddBookPopup />}
      {readBookPopup && <ReadBookPopup book={readBook} />}
      {recordBookPopup && <RecordBookPopup bookId={borrowBookId} />}
    </>
  );
};

export default BookManagement;
