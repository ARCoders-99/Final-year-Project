import   { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../layout/SideBar";
import UserDashboard from "../components/UserDashboard";
import AdminDashboard from "../components/AdminDashboard";
import Catalogt from "../components/Catalog";
import MyBorrowedBooks from "../components/MyBorrowedBooks";
import BookManagement from "../components/BookManagement";
import Users from "../components/Users";

const Home = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState("");

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  const renderComponent = () => {
    switch (selectedComponent) {
      case "Dashboard":
        return user?.role === "User" ? <UserDashboard /> : <AdminDashboard />;

      case "Books":
        return <BookManagement />;

      case "Catalog":
        if (user?.role === "Admin") {
          return <Catalogt />;
        }
        return null;

      case "Users":
        if (user?.role === "Admin") {
          return <Users />;
        }
        return null;

      case "My Borrowed Books":
        return <MyBorrowedBooks />;

      default:
        return user?.role === "User" ? <UserDashboard /> : <AdminDashboard />;
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
          setSelectedComponent={setSelectedComponent}
        />

        {/* Main Content */}
        <div className="flex-1 p-4">{renderComponent()}</div>
      </div>
    </>
  );
};

export default Home;
