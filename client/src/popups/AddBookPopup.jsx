import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addBook, fetchAllBooks } from "../store/slices/bookSlice";
import { toggleAddBookPopup } from "../store/slices/popUpSlice";
import { Loader2, FileText, ImagePlus } from "lucide-react";
import { toast } from "react-toastify";

const AddBookPopup = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.book);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [pdf, setPdf] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [pdfPreview, setPdfPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [borrowLimitDays, setBorrowLimitDays] = useState(0);
  const [borrowLimitHours, setBorrowLimitHours] = useState(0);
  const [borrowLimitMinutes, setBorrowLimitMinutes] = useState(0);

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      e.target.value = "";
      return;
    }
    setPdf(file);
    setPdfPreview(file.name);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Cover image must be JPG, PNG, or WebP.");
      e.target.value = "";
      return;
    }
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAddBook = (e) => {
    e.preventDefault();

    if (!pdf) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (!coverImage) {
      toast.error("Please upload a cover image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("price", price);
    formData.append("borrowLimitDays", borrowLimitDays);
    formData.append("borrowLimitHours", borrowLimitHours);
    formData.append("borrowLimitMinutes", borrowLimitMinutes);
    formData.append("pdf", pdf);
    formData.append("coverImage", coverImage);

    dispatch(addBook(formData)).then(() => dispatch(fetchAllBooks()));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-50">
      <div className="w-full bg-white rounded-xl shadow-xl md:w-[480px] max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-5 text-gray-800">Add New Book</h3>
          <form onSubmit={handleAddBook} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Borrowing Fee ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            {/* Borrow Limit */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Borrow Limit</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Days</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={borrowLimitDays}
                    onChange={(e) => setBorrowLimitDays(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={borrowLimitHours}
                    onChange={(e) => setBorrowLimitHours(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={borrowLimitMinutes}
                    onChange={(e) => setBorrowLimitMinutes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 italic">
                Borrower will have exactly {borrowLimitDays}d {borrowLimitHours}h {borrowLimitMinutes}m to access this book.
              </p>
            </div>

            {/* Upload PDF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PDF <span className="text-red-500">*</span>
              </label>
              <label className="flex items-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors">
                <FileText size={18} className="text-gray-500 shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  {pdfPreview || "Click to select PDF file"}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Cover Image <span className="text-red-500">*</span>
              </label>
              <label className="flex items-start gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="h-20 w-14 object-cover rounded shrink-0" />
                ) : (
                  <ImagePlus size={18} className="text-gray-500 mt-1 shrink-0" />
                )}
                <span className="text-sm text-gray-500">
                  {coverPreview ? "Click to change image" : "Click to select JPG, PNG, or WebP"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => dispatch(toggleAddBookPopup())}
                className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Add Book"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBookPopup;
