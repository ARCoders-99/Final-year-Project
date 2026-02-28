import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchAllBooks, resetBookSlice } from "../store/slices/bookSlice";
import {
  fetchAllBorrowedBooks,
  resetBorrowSlice,
} from "../store/slices/borrowSlice";
import { fetchAllDigitalBorrows } from "../store/slices/digitalSlice";
import Header from "../layout/Header";

const Catalog = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("physical");

  const { allBorrowedBooks, message, error } = useSelector((state) => state.borrow);
  const { allDigitalBorrows } = useSelector((state) => state.digital);

  const formatDate = (timeStamp) => {
    if (!timeStamp) return "N/A";
    const date = new Date(timeStamp);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getFullYear())}`;
  };

  const formatDateTime = (timeStamp) => {
    if (!timeStamp) return "N/A";
    const date = new Date(timeStamp);
    const d = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getFullYear())}`;
    const t = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    return `${d} ${t}`;
  };

  useEffect(() => {
    dispatch(fetchAllBorrowedBooks());
    dispatch(fetchAllDigitalBorrows());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(fetchAllBooks());
      dispatch(fetchAllBorrowedBooks());
      dispatch(fetchAllDigitalBorrows());
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
    if (error) {
      toast.error(error);
      dispatch(resetBorrowSlice());
    }
  }, [dispatch, error, message]);

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />

        {/* Sub Header & Tab Navigation */}
        <header className="flex flex-col gap-4 sm:flex-row md:justify-between md:items-center">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">
            Borrowed Books Catalog
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setActiveTab("physical")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "physical" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Physical
            </button>
            <button
              onClick={() => setActiveTab("digital")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "digital" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Digital
            </button>
          </div>
        </header>

        {/* Table Container */}
        {((activeTab === "physical" && allBorrowedBooks?.length > 0) ||
          (activeTab === "digital" && allDigitalBorrows?.length > 0)) ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Book Title</th>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">
                    {activeTab === "physical" ? "Due Date" : "Expiry Date"}
                  </th>
                  <th className="px-4 py-2 text-left">Borrow Date</th>
                </tr>
              </thead>

              <tbody>
                {activeTab === "physical" ? (
                  allBorrowedBooks.map((record, index) => (
                    <tr
                      key={record._id}
                      className={`transition-colors duration-200 ${(index + 1) % 2 === 0 ? "bg-gray-50" : ""} hover:bg-gray-100 cursor-default`}
                    >
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2 font-medium">{record?.book?.title || "N/A"}</td>
                      <td className="px-4 py-2">{record?.user?.name}</td>
                      <td className="px-4 py-2">{record?.user?.email}</td>
                      <td className="px-4 py-2">{formatDate(record.dueDate)}</td>
                      <td className="px-4 py-2">{formatDateTime(record.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  allDigitalBorrows.map((record, index) => (
                    <tr
                      key={record._id}
                      className={`transition-colors duration-200 ${(index + 1) % 2 === 0 ? "bg-gray-50" : ""} hover:bg-gray-100 cursor-default`}
                    >
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2 font-medium">{record?.book?.title || "N/A"}</td>
                      <td className="px-4 py-2">{record?.user?.name}</td>
                      <td className="px-4 py-2">{record?.user?.email}</td>
                      <td className="px-4 py-2">{formatDate(record.expiryDate)}</td>
                      <td className="px-4 py-2">{formatDateTime(record.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <h3 className="text-3xl mt-5 font-medium text-gray-500">
            No borrowed books found in {activeTab} collection.
          </h3>
        )}
      </main>
    </>
  );
};

export default Catalog;
