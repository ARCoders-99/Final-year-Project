import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addNewAdmin } from "../store/slices/userSlice";
import { toggleAddNewAdminPopup } from "../store/slices/popUpSlice";
import { Loader2, ImagePlus, X, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { popupVariants, backdropVariants } from "../utils/animations";
import placeHolder from "../assets/placeholder.jpg";
import { toast } from "react-toastify";

const AddNewAdmin = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleClose = () => {
    dispatch(toggleAddNewAdminPopup());
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatar(file);
    }
  };

  const handleAddNewAdmin = (e) => {
    e.preventDefault();

    if (name.length < 3 || name.length > 30) {
      return toast.error("Name must be between 3 and 30 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (phone.length < 10 || phone.length > 15) {
      return toast.error("Phone number must be between 10 and 15 digits.");
    }
    if (password.length < 8 || password.length > 16) {
      return toast.error("Password must be between 8 and 16 characters.");
    }
    if (!avatar) {
      return toast.error("Admin avatar is required.");
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("avatar", avatar);
    formData.append("role", "Admin");

    dispatch(addNewAdmin(formData));
  };

  return (
    <div className="fixed inset-0 p-5 flex items-center justify-center z-50">
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={backdropVariants}
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={popupVariants}
        className="relative w-full bg-white rounded-xl shadow-xl md:w-[480px] max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Add New Admin</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleAddNewAdmin} className="flex flex-col gap-4">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-2">
              <label htmlFor="avatarInput" className="cursor-pointer group relative">
                <img
                  src={avatarPreview ? avatarPreview : placeHolder}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 group-hover:border-black transition-all"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus className="text-white" size={24} />
                </div>
                <input
                  type="file"
                  id="avatarInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-wider">Admin Avatar</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Add Admin"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddNewAdmin;
