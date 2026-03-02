import { useDispatch } from "react-redux";
import { returnBook } from "../store/slices/borrowSlice";
import { toggleReturnBookPopup } from "../store/slices/popUpSlice";
import Button from "../components/ui/Button";

const ReturnBookPopup = ({ bookId, email }) => {
  const dispatch = useDispatch();

  const handleReturnBook = (e) => {
    e.preventDefault();
    dispatch(returnBook({ email, bookId }));
    dispatch(toggleReturnBookPopup());
  };

  return <>
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-50">
      <div className="w-full bg-white rounded-lg shadow-lg md:w-1/3">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Return Book</h3>
          <form onSubmit={handleReturnBook}>
            <div className="mb-4">
              <label className="block text-gray-900 font-bold">
                User Email
              </label>
              <input
                type="email"
                defaultValue={email}
                placeholder="Borrower's Email"
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
                disabled
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 font-bold text-black border-none shadow-none translate-y-0"
                type="button"
                onClick={() => dispatch(toggleReturnBookPopup())}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-bold"
              >
                Return
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>;
};

export default ReturnBookPopup;

import PropTypes from "prop-types";

ReturnBookPopup.propTypes = {
  bookId: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
};
