import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import Sidebar from "../layout/SideBar";
import UserDashboard from "../components/UserDashboard";
import AdminDashboard from "../admin/AdminDashboard";
import Catalog from "../admin/Catalog";
import MyBorrowedBooks from "../components/MyBorrowedBooks";
import BookManagement from "../admin/BookManagement";
import Users from "../admin/Users";
import ImportDigitalBook from "../admin/ImportDigitalBook";
import DigitalLibrary from "../components/DigitalLibrary";
import Payments from "../admin/Payments";
import ChatbotWidget from "../components/ChatbotWidget";

const Home = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  const renderComponent = () => {
    const path = location.pathname;

    switch (path) {
      case "/admin/dashboard":
        return <AdminDashboard />;
      case "/admin/books":
        return <BookManagement />;
      case "/admin/catalog":
        return <Catalog />;
      case "/admin/users":
        return <Users />;
      case "/admin/import-digital":
        return <ImportDigitalBook />;
      case "/admin/payments":
        return <Payments />;
      case "/digital-library":
        return <DigitalLibrary />;
      case "/books":
        return <BookManagement />;
      case "/catalog":
      case "/dashboard":
      case "/":
        return user?.role === "Admin" ? <AdminDashboard /> : <UserDashboard />;
      case "/borrowed":
        return <MyBorrowedBooks />;
      default:
        return user?.role === "Admin" ? <AdminDashboard /> : <UserDashboard />;
    }
  };

  return (
    <>
      <div className="relative md:pl-64 flex min-h-screen bg-gray-100">
        {/* Hamburger button for mobile */}
        <div className="md:hidden z-10 absolute right-6 top-4 sm:top-6 flex justify-center items-center bg-black rounded-md h-9 w-9 text-white">
          <GiHamburgerMenu
            className="text-2xl cursor-pointer"
            onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          />
        </div>

        {/* Sidebar */}
        <Sidebar
          isSideBarOpen={isSideBarOpen}
          setIsSideBarOpen={setIsSideBarOpen}
        />

        {/* Main Content */}
        <div className="flex-1 p-4">{renderComponent()}</div>
        <ChatbotWidget />
      </div>
    </>
  );
};

export default Home;
