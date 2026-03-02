import { useDispatch } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popUpSlice";
import { X, Calendar, User, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { popupVariants, backdropVariants } from "../utils/animations";

const ReadBookPopup = ({ book }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(toggleReadBookPopup());
  };

  if (!book) return null;

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
        className="relative w-full bg-white rounded-3xl shadow-2xl md:w-[550px] overflow-hidden no-scrollbar"
      >
        <div className="bg-black p-8 text-white relative">
          <button
            onClick={handleClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
          <p className="text-gray-400 font-medium italic">by {book.author}</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-xl">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Author</p>
                <p className="font-bold text-gray-800">{book.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-xl">
                <FileText size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Format</p>
                <p className="font-bold text-gray-800">{book.gutenbergId ? "Digital (Web/HTML)" : "Physical (PDF/Print)"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-xl">
                <Calendar size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Access Limit</p>
                <p className="font-bold text-gray-800">{book.borrowLimitDays || 0}d {book.borrowLimitHours || 0}h {book.borrowLimitMinutes || 0}m</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-xl">
                <span className="text-gray-600 font-bold">$</span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fee</p>
                <p className="font-bold text-gray-800">${book.price}</p>
              </div>
            </div>
          </div>

          {book.description && (
            <div className="mt-8 border-t pt-6">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Description</p>
              <div className="text-sm text-gray-600 leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {book.description}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Close Details
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReadBookPopup;
