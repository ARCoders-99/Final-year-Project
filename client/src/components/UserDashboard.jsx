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
    <>
      <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-col-reverse xl:flex-row gap-8">
          {/* LEFT SIDE */}
          <div className="flex flex-col flex-1 gap-8 justify-between">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-3 bg-white p-5 min-h-[120px] rounded-lg hover:shadow-inner transition duration-300">
                <span className="w-[2px] bg-black h-20"></span>
                <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                  <img src={bookIcon} alt="book-icon" className="w-8 h-8" />
                </span>
                <p className="text-lg xl:text-xl font-semibold">
                  Your Borrowed Book List
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white p-5 min-h-[120px] rounded-lg hover:shadow-inner transition duration-300">
                <span className="w-[2px] bg-black h-20"></span>
                <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                  <img src={returnIcon} alt="return-icon" className="w-8 h-8" />
                </span>
                <p className="text-lg xl:text-xl font-semibold">
                  Your Returned Book List
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-7 items-center justify-between">
                <div className="flex items-center gap-3 bg-white p-5 max-h-[120px] rounded-lg hover:shadow-inner transition duration-300 w-full lg:w-auto">
                  <span className="w-[2px] bg-black h-20"></span>
                  <span className="bg-gray-300 h-20 w-20 flex justify-center items-center rounded-lg">
                    <img
                      src={browseIcon}
                      alt="browse-icon"
                      className="w-8 h-8"
                    />
                  </span>
                  <p className="text-lg xl:text-xl font-semibold">
                    Let&apos;s browse books inventory
                  </p>
                </div>
                <img
                  src={logo_with_title}
                  alt="logo"
                  className="hidden lg:block w-52 mx-auto"
                />
              </div>
            </div>

            <div className="bg-white p-7 text-lg sm:text-xl xl:text-3xl font-semibold flex justify-center items-center rounded-2xl min-h-52 relative">
              <h4 className="text-center text-gray-700">
                “Reading is to the mind what exercise is to the body.”
              </h4>
              <p className="text-gray-500 text-sm absolute right-6 bottom-4">
                ~ BookWorm Team
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col xl:w-[35%] w-full gap-10 items-center">
            <div className="bg-white rounded-xl p-6 w-full flex justify-center items-center shadow-md">
              <Pie data={data} options={{ cutout: 0, responsive: true }} />
            </div>

            <div className="flex items-center p-5 w-full sm:w-[400px] bg-white rounded-lg shadow-md gap-3">
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserDashboard;
