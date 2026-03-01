import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateCredentials, resetAuthSlice } from "../store/slices/authSlice";
import { toggleSettingPopup } from "../store/slices/popUpSlice";
import { toast } from "react-toastify";
import { Loader2, X, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { popupVariants, backdropVariants } from "../utils/animations";

const SettingPopup = () => {
  const dispatch = useDispatch();
  const { loading, error, message, user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleClose = () => {
    dispatch(toggleSettingPopup());
  };

  const handleUpdateCredentials = (e) => {
    e.preventDefault();

    if (name.length < 3 || name.length > 30) {
      return toast.error("Name must be between 3 and 30 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }

    const updateData = { name, email };

    if (!oldPassword || !newPassword) {
      return toast.error("Both old and new password are required to save changes.");
    }
    if (oldPassword === newPassword) {
      return toast.error("New password cannot be the same as the old password.");
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      return toast.error("New password must be between 8 and 16 characters.");
    }
    updateData.oldPassword = oldPassword;
    updateData.newPassword = newPassword;

    dispatch(updateCredentials(updateData));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
    if (message) {
      toast.success(message);
      dispatch(resetAuthSlice());
      handleClose();
    }
  }, [dispatch, error, message]);

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
        className="relative w-full bg-white rounded-3xl shadow-2xl md:w-[480px] max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-black p-3 rounded-xl">
                <Lock size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Update Credentials</h3>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpdateCredentials} className="flex flex-col gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <User size={16} /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Mail size={16} /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Change Password (Optional)</h4>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Old Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold text-sm transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold text-sm flex items-center gap-2 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingPopup;
