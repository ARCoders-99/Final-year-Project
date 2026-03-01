import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { recordBorrowBook, fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { toggleRecordBookPopup } from "../store/slices/popUpSlice";
import { fetchAllBooks } from "../store/slices/bookSlice";
import { Loader2, X, User, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { popupVariants, backdropVariants } from "../utils/animations";

const RecordBookPopup = ({ bookId }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.borrow);
  const [userEmail, setUserEmail] = useState("");

  const handleClose = () => {
    dispatch(toggleRecordBookPopup({ isOpen: false, bookId: "" }));
  };

  const handleRecordBorrow = (e) => {
    e.preventDefault();
    dispatch(recordBorrowBook(userEmail, bookId)).then(() => {
      dispatch(fetchAllBooks());
      dispatch(fetchUserBorrowedBooks());
      handleClose();
    });
  };

  return (
    <div className="fixed inset-0 p-5 flex items-center justify-center z-50">
      {/* Backdrop */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={backdropVariants}
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={popupVariants}
        className="relative w-full bg-white rounded-3xl shadow-2xl md:w-[450px] overflow-hidden no-scrollbar"
      >
        <div className="bg-black p-8 text-white relative">
          <button
            onClick={handleClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-2">Record Borrow</h2>
          <p className="text-gray-400 text-sm font-medium">Link a physical book borrow to a user's email.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleRecordBorrow} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} /> User Email Address
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter user's email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Recording...
                </>
              ) : (
                "Record Borrow"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RecordBookPopup;
