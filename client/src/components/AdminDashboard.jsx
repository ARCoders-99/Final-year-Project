import adminIcon from "../assets/pointing.png";
import usersIcon from "../assets/people-black.png";
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
import { useEffect, useState } from "react";
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

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.user);
  const { books } = useSelector((state) => state.book);
  const { allBorrowedBooks } = useSelector((state) => state.borrow);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmin, setTotalAdmin] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalBorrowedBooks, setTotalBorrowedBooks] = useState(0);
  const [totalReturnedBooks, setTotalReturnedBooks] = useState(0);

  useEffect(() => {
    if (books) setTotalBooks(books.length);
  }, [books]);

  useEffect(() => {
    const userCount = users.filter((u) => u.role === "User").length;
    const adminCount = users.filter((u) => u.role === "Admin").length;
    setTotalUsers(userCount);
    setTotalAdmin(adminCount);

    const borrowed = allBorrowedBooks.filter((b) => b.returnDate === null);
    const returned = allBorrowedBooks.filter((b) => b.returnDate !== null);
    setTotalBorrowedBooks(borrowed.length);
    setTotalReturnedBooks(returned.length);
  }, [users, allBorrowedBooks]);

  const data = {
    labels: ["Borrowed Books", "Returned Books"],
    datasets: [
      {
        data: [totalBorrowedBooks, totalReturnedBooks],
        backgroundColor: ["#3D3E3E", "#151619"],
        hoverOffset: 4,
      },
    ],
  };

  return (
   <main className="relative flex-1 p-6 pt-28 min-h-screen bg-gray-50">
  <Header />

  <div className="flex flex-col xl:flex-row gap-10 xl:gap-16">
    {/* LEFT SIDE */}
    <div className="flex flex-col justify-between items-center flex-1 gap-8 xl:gap-12">
      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 flex justify-center w-full">
        <Pie data={data} options={{ cutout: 0, responsive: true }} />
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row xl:flex-col gap-6 w-full">
        <div className="flex items-center gap-4 bg-white p-5 rounded-lg shadow-md w-full sm:w-1/2 xl:w-full">
          <img src={logo} alt="logo" className="w-20 rounded-lg" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-[#3D3E3E]"></span>
              <span>Borrowed Books</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-[#151619]"></span>
              <span>Returned Books</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex flex-col flex-[1.5] gap-8">
      {/* Profile Section - stays on top */}
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center gap-4">
        <img
          src={user?.avatar?.url}
          alt="avatar"
          className="rounded-full w-28 h-28 object-cover"
        />
        <h2 className="text-xl font-semibold">{user?.name}</h2>
        <p className="text-black-600 text-sm text-center max-w-md"> 
          Welcome to your admin dashboard. Manage settings and monitor
          statistics efficiently.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="flex flex-col items-center bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="bg-gray-100 rounded-full p-4 mb-3">
            <img src={usersIcon} alt="users" className="w-7 h-7" />
          </div>
          <h4 className="text-3xl font-bold">{totalUsers}</h4>
          <p className="text-gray-600 text-sm">Total Users</p>
        </div>

        {/* Total Books */}
        <div className="flex flex-col items-center bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="bg-gray-100 rounded-full p-4 mb-3">
            <img src={bookIcon} alt="books" className="w-7 h-7" />
          </div>
          <h4 className="text-3xl font-bold">{totalBooks}</h4>
          <p className="text-gray-600 text-sm">Total Books</p>
        </div>

        {/* Total Admins */}
        <div className="flex flex-col items-center bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="bg-gray-100 rounded-full p-4 mb-3">
            <img src={adminIcon} alt="admins" className="w-7 h-7" />
          </div>
          <h4 className="text-3xl font-bold">{totalAdmin}</h4>
          <p className="text-gray-600 text-sm">Total Admins</p>
        </div>
      </div>

      {/* Quote Section - only on right side */}
      <div className="bg-white p-6 rounded-xl shadow-sm text-center xl:self-end w-full xl:w-[85%]">
        <h4 className="text-gray-700 font-medium text-base sm:text-lg leading-relaxed italic">
          “Reading fosters personal growth and paves the way to wisdom and
          character.”
        </h4>
        <p className="text-gray-500 text-sm mt-2 text-right w-full">
          ~ BookWorm Team
        </p>
      </div>
    </div>
  </div>
</main>

  );
};

export default AdminDashboard;
