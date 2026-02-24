import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import closeIcon from "../assets/close-square.png";
import { updatePassword, resetAuthSlice } from "../store/slices/authSlice";
import SettingsIcon from "../assets/setting.png";
import { toggleSettingPopup } from "../store/slices/popUpSlice";
import { toast } from "react-toastify";

const SettingPopup = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const dispatch = useDispatch();
  const { loading, message, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
    if (message) {
      toast.success(message);
      dispatch(toggleSettingPopup());
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error]);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    dispatch(updatePassword({ currentPassword, newPassword, confirmNewPassword }));
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-50">
      <div className="w-full bg-white rounded-lg shadow-lg sm:w-auto lg:w-1/2 2xl:w-1/3">
        <div className="p-6">
          <header className="flex justify-between items-center mb-7 pb-5 border-b-[1px] border-black">
            <div className="flex items-center gap-3">
              <img
                src={SettingsIcon}
                alt="setting-icon"
                className="bg-gray-300 p-5 rounded-lg"
              />
              <h3 className="text-xl font-bold">Change Credentials</h3>
            </div>
            <img
              src={closeIcon}
              alt="close-icon"
              className="cursor-pointer"
              onClick={() => dispatch(toggleSettingPopup())}
            />
          </header>
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <div className="sm:flex gap-4 items-center">
                <label className="block text-gray-900 font-medium w-full sm:w-1/3">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="sm:flex gap-4 items-center">
                <label className="block text-gray-900 font-medium w-full sm:w-1/3">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter New Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="sm:flex gap-4 items-center">
                <label className="block text-gray-900 font-medium w-full sm:w-1/3">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-10">
              <button
                type="button"
                onClick={() => dispatch(toggleSettingPopup())}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-semibold"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingPopup;
