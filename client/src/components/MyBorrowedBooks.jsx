import { BookA } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popUpSlice";
import { returnBook, fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Header from "../layout/Header";
import ReadBookPopup from "../popups/ReadBookPopup";

const MyBorrowedBooks = () => {
  const dispatch = useDispatch();
  const { books } = useSelector((state) => state.book);
  const { userBorrowedBooks } = useSelector((state) => state.borrow);
  const { readBookPopup } = useSelector((state) => state.popup);
  const { isAuthenticated} = useSelector((state) => state.auth);

  const [readBook, setReadBook] = useState({});
  const [filter, setFilter] = useState("nonReturned"); // default to non-returned

  // Open book details popup
  const openReadPopup = (id) => {
    const book = books.find((book) => book._id === id);
    setReadBook(book);
    dispatch(toggleReadBookPopup());
  };

  // Fetch user's borrowed books on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserBorrowedBooks());
    }
  }, [dispatch, isAuthenticated]);

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

  // Separate returned and non-returned books
  const returnedBooks = userBorrowedBooks?.filter((book) => book.returned === true);
  const nonReturnedBooks = userBorrowedBooks?.filter((book) => book.returned === false);
  const booksToDisplay = filter === "returned" ? returnedBooks : nonReturnedBooks;

  // Handle returning a book
  const handleReturnBook = async (borrowId) => {
    try {
      await dispatch(returnBook({ borrowId })); // no need to pass email, backend uses session
      toast.success("Book returned successfully!");
      dispatch(fetchUserBorrowedBooks()); // refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return book.");
    }
  };

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">Borrowed Books</h2>
        </header>

        {/* Filter buttons */}
        <header className="flex flex-col gap-3 sm:flex-row md:items-center mt-4">
          <button
            onClick={() => setFilter("returned")}
            className={`rounded border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "returned" ? "bg-black text-white border-black" : "bg-gray-200 text-black"
            }`}
          >
            Returned Books
          </button>
          <button
            onClick={() => setFilter("nonReturned")}
            className={`rounded border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "nonReturned" ? "bg-black text-white border-black" : "bg-gray-200 text-black"
            }`}
          >
            Non-Returned Books
          </button>
        </header>

        {/* Books Table */}
        {booksToDisplay && booksToDisplay.length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Book Title</th>
                  <th className="px-4 py-2 text-left">Borrowed Date</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                  <th className="px-4 py-2 text-left">Returned</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {booksToDisplay.map((book, index) => (
                  <tr key={book._id} className={(index + 1) % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{book.bookTitle}</td>
                    <td className="px-4 py-2">{formatDate(book.borrowedDate)}</td>
                    <td className="px-4 py-2">{formatDate(book.dueDate)}</td>
                    <td className="px-4 py-2">{book.returned ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 flex gap-2 items-center">
                      <BookA onClick={() => openReadPopup(book.bookId)} className="cursor-pointer" />
                      {!book.returned && (
                        <button
                          onClick={() => handleReturnBook(book._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filter === "returned" ? (
          <h3 className="text-3xl mt-5 font-medium">No Returned Books</h3>
        ) : (
          <h3 className="text-3xl mt-5 font-medium">No Non-Returned Books!</h3>
        )}
      </main>

      {readBookPopup && <ReadBookPopup book={readBook} />}
    </>
  );
};

export default MyBorrowedBooks;
