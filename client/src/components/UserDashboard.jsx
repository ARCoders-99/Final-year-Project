import { useEffect, useState } from "react";
import logo_with_title from "../assets/logo-with-title-black.png";
import returnIcon from "../assets/redo.png";
import browseIcon from "../assets/pointing.png";
import bookIcon from "../assets/book-square.png";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";
import logo from "../assets/black-logo.png";
import { useSelector } from "react-redux";
import Header from "../layout/Header";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, cardHover, pageTransition } from "../utils/animations";
import { Link, useNavigate } from "react-router-dom";
import { BookA, BookOpen, Search, Library } from "lucide-react";
import { useDispatch } from "react-redux";
import { fetchAllDigitalBooks, borrowDigitalBook } from "../store/slices/digitalSlice";
import { fetchAllBooks } from "../store/slices/bookSlice";
import { fetchUserBorrowedBooks } from "../store/slices/borrowSlice";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const UserDashboard = () => {
  const { userBorrowedBooks } = useSelector((state) => state.borrow);

  const [totalBorrowedBooks, setTotalBorrowedBooks] = useState(0);
  const [totalReturnedBooks, setTotalReturnedBooks] = useState(0);

  useEffect(() => {
    let numberOfTotalBorrowedBooks = userBorrowedBooks.filter(
      (book) => book.returned === false
    );
    let numberOfTotalReturnedBooks = userBorrowedBooks.filter(
      (book) => book.returned === true
    );

    setTotalBorrowedBooks(numberOfTotalBorrowedBooks.length);
    setTotalReturnedBooks(numberOfTotalReturnedBooks.length);
  }, [userBorrowedBooks]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { digitalBooks, loading: digitalLoading } = useSelector((state) => state.digital);
  const { books: physicalBooks } = useSelector((state) => state.book);

  useEffect(() => {
    dispatch(fetchAllDigitalBooks());
    dispatch(fetchAllBooks());
    dispatch(fetchUserBorrowedBooks());
  }, [dispatch]);

  // Real-time expiry: schedule a re-fetch at the exact dueDate of each active borrow
  useEffect(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return;
    const now = Date.now();
    const timers = [];
    for (const borrow of userBorrowedBooks) {
      if (borrow.returned) continue;
      const msLeft = new Date(borrow.dueDate).getTime() - now;
      if (msLeft > 0) {
        timers.push(setTimeout(() => {
          dispatch(fetchUserBorrowedBooks());
          dispatch(fetchAllBooks());
        }, msLeft));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [userBorrowedBooks, dispatch]);

  const data = {
    labels: ["Total Borrowed Books", "Total Returned Books"],
    datasets: [
      {
        data: [totalBorrowedBooks, totalReturnedBooks],
        backgroundColor: ["#3D3E3E", "#151619"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <motion.main
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen overflow-hidden no-scrollbar"
    >
      <Header />
      <motion.div
        variants={staggerContainer}
        className="flex flex-col-reverse xl:flex-row gap-8 no-scrollbar"
      >
        {/* LEFT SIDE */}
        <div className="flex flex-col flex-1 gap-8 justify-between no-scrollbar overflow-hidden">
          <motion.div variants={staggerContainer} className="flex flex-col gap-8 no-scrollbar">
            <Link to="/borrowed" className="no-scrollbar overflow-hidden">
              <motion.div
                variants={fadeIn}
                whileHover={cardHover}
                className="flex items-center gap-3 bg-white p-5 min-h-[120px] rounded-lg shadow-sm hover:shadow-md transition duration-300 cursor-pointer no-scrollbar"
              >
                <span className="w-[2px] bg-black h-20"></span>
                <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                  <img src={bookIcon} alt="book-icon" className="w-8 h-8" />
                </span>
                <p className="text-lg xl:text-xl font-bold">
                  Your Borrowed Book List
                </p>
              </motion.div>
            </Link>

            <Link to="/borrowed" className="no-scrollbar overflow-hidden">
              <motion.div
                variants={fadeIn}
                whileHover={cardHover}
                className="flex items-center gap-3 bg-white p-5 min-h-[120px] rounded-lg shadow-sm hover:shadow-md transition duration-300 cursor-pointer no-scrollbar"
              >
                <span className="w-[2px] bg-black h-20"></span>
                <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                  <img src={returnIcon} alt="return-icon" className="w-8 h-8" />
                </span>
                <p className="text-lg xl:text-xl font-bold">
                  Your Returned Book List
                </p>
              </motion.div>
            </Link>

            <div className="flex flex-col lg:flex-row gap-7 items-center justify-between no-scrollbar overflow-hidden">
              <Link to="/books" className="w-full lg:w-auto no-scrollbar overflow-hidden">
                <motion.div
                  variants={fadeIn}
                  whileHover={cardHover}
                  className="flex items-center gap-3 bg-white p-5 max-h-[120px] rounded-lg shadow-sm hover:shadow-md transition duration-300 w-full lg:w-auto cursor-pointer no-scrollbar"
                >
                  <span className="w-[2px] bg-black h-20"></span>
                  <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                    <img
                      src={browseIcon}
                      alt="browse-icon"
                      className="w-8 h-8"
                    />
                  </span>
                  <p className="text-lg xl:text-xl font-bold">
                    Let&apos;s browse books inventory
                  </p>
                </motion.div>
              </Link>
              <Link to="/digital-library" className="w-full lg:w-auto no-scrollbar overflow-hidden">
                <motion.div
                  variants={fadeIn}
                  whileHover={cardHover}
                  className="flex items-center gap-3 bg-white p-5 max-h-[120px] rounded-lg shadow-sm hover:shadow-md transition duration-300 w-full lg:w-auto cursor-pointer no-scrollbar"
                >
                  <span className="w-[2px] bg-black h-20"></span>
                  <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                    <BookA size={32} />
                  </span>
                  <p className="text-lg xl:text-xl font-bold">
                    Explore Digital Library
                  </p>
                </motion.div>
              </Link>
              <motion.img
                variants={fadeIn}
                src={logo_with_title}
                alt="logo"
                className="hidden lg:block w-52 mx-auto filter hover:brightness-110 transition-all"
              />
            </div>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-white p-7 text-lg sm:text-xl xl:text-3xl font-bold flex justify-center items-center rounded-2xl min-h-52 relative shadow-sm no-scrollbar"
          >
            <h4 className="text-center text-gray-700">
              “Reading is to the mind what exercise is to the body.”
            </h4>
            <p className="text-gray-500 text-sm absolute right-6 bottom-4">
              ~ BookWorm Team
            </p>
          </motion.div>
        </div >

        {/* RIGHT SIDE */}
        < div className="flex flex-col xl:w-[35%] w-full gap-10 items-center no-scrollbar overflow-hidden" >
          <motion.div
            variants={fadeIn}
            whileHover={cardHover}
            className="bg-white rounded-xl p-6 w-full flex justify-center items-center shadow-md cursor-pointer no-scrollbar overflow-hidden"
          >
            <Pie data={data} options={{ cutout: 0, responsive: true }} />
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="flex items-center pl-[30px] p-5 w-full sm:w-[400px]  bg-white rounded-lg shadow-md gap-3 cursor-pointer overflow-hidden no-scrollbar"
          >
            <img src={logo} alt="logo" className="w-12 h-12" />
            <span className="w-[2px] bg-black h-full"></span>
            <div className="flex flex-col gap-2 text-gray-700 text-sm">
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3D3E3E]"></span>
                <span>Total Borrowed Books</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#151619]"></span>
                <span>Total Returned Books</span>
              </p>
            </div>
          </motion.div>
        </div >
      </motion.div >

      {/* DIGITAL LIBRARY SECTION */}
      <motion.section variants={fadeIn} className="mt-12 mb-10 overflow-hidden no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookA size={28} />
            Digital Library
          </h3>
          <Link to="/digital-library" className="text-black font-medium hover:underline flex items-center gap-1">
            View All <Search size={16} />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
          {digitalBooks && digitalBooks.length > 0 ? (
            digitalBooks.slice(0, 5).map((book) => (
              <motion.div
                key={book._id}
                whileHover={cardHover}
                className="min-w-[240px] max-w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={book.coverImage || "https://via.placeholder.com/150x200?text=No+Cover"}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-gray-800 line-clamp-1 mb-1">{book.title}</h4>
                  <p className="text-xs text-gray-500 mb-3 truncate">{book.author}</p>
                  <button
                    onClick={() => navigate("/digital-library")}
                    className="mt-auto w-full bg-black text-white text-xs py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-400 italic">No digital books available.</p>
          )}
        </div>
      </motion.section>

      {/* PHYSICAL BOOKS SECTION */}
      <motion.section variants={fadeIn} className="mt-4 mb-10 overflow-hidden no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Library size={28} />
            Physical Books
          </h3>
          <Link to="/books" className="text-black font-medium hover:underline flex items-center gap-1">
            Browse All <Search size={16} />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
          {physicalBooks && physicalBooks.length > 0 ? (
            physicalBooks.slice(0, 6).map((book) => (
              <motion.div
                key={book._id}
                whileHover={cardHover}
                className="min-w-[200px] max-w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                <div className="h-44 bg-gray-200 overflow-hidden">
                  <img
                    src={book.coverImageUrl || "https://via.placeholder.com/150x200?text=No+Cover"}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-gray-800 line-clamp-2 text-sm leading-tight mb-1">{book.title}</h4>
                  <p className="text-xs text-gray-500 truncate">by {book.author}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-gray-700">${book.price}</span>
                    <span className={`text-xs font-medium ${book.availability ? "text-green-600" : "text-red-500"
                      }`}>
                      {book.availability ? `${book.borrowLimitDays || 0}d ${book.borrowLimitHours || 0}h ${book.borrowLimitMinutes || 0}m` : "Unavailable"}
                    </span>
                  </div>
                  {book.pdfUrl && (
                    <button
                      onClick={() => navigate(`/read-book/${book._id}`)}
                      className="mt-auto w-full flex items-center justify-center gap-1 bg-black text-white text-xs py-2 rounded-lg hover:bg-gray-800 transition-colors mt-3"
                    >
                      <BookOpen size={13} />
                      Read Book
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-400 italic">No physical books available.</p>
          )}
        </div>
      </motion.section>
    </motion.main>
  );
};

export default UserDashboard;
