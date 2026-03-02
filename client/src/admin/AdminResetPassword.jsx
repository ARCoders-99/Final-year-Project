import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import Button from "../components/ui/Button";
import { resetPassword, resetAuthSlice } from "../store/slices/authSlice";

const AdminResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { token } = useParams();
    const dispatch = useDispatch();
    const navigateTo = useNavigate();

    const { loading, error, message, isAuthenticated } = useSelector(
        (state) => state.auth
    );

    const handleResetPassword = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);
        dispatch(resetPassword(formData, token));
    };
    useEffect(() => {
        if (message === "Password Reset Successfully") {
            toast.success(message);
            dispatch(resetAuthSlice());
            navigateTo("/admin-login");
        }

        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, message, error, loading]);


    return (
        <>
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* LEFT SECTION */}
                <div
                    className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center
    justify-center p-8 rounded-tr-[80px] rounded-br-[80px]"
                >
                    <div className="text-center h-[450px]">
                        <div className="flex justify-center mb-12">
                            <img
                                src={logo_with_title}
                                alt="logo"
                                className="mb-12 h-44 w-auto"
                            />
                        </div>
                        <h3 className="text-gray-300 max-w-[320px] mx-auto text-3xl font-bold leading-10">
                            Your premier digital library for borrowing and reading books
                        </h3>
                    </div>
                </div>
                {/* RIGHT SECTION */}
                <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative">
                    <Link
                        to={"/admin/password/forgot"}
                        className="border-2 border-red-600 rounded-3xl font-bold w-52 py-2 px-4 fixed top-10 left-28
              hover:bg-red-600 hover:text-white transition duration-300 text-end"
                    >
                        Back
                    </Link>
                    <div className="w-full max-w-sm">
                        <div className="flex justify-center mb-12">
                            <div className="rounded-full flex items-center justify-center">
                                <img src={logo} alt="logo" className="h-24 w-auto" />
                            </div>
                        </div>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-center mb-5 overflow-hidden text-red-600">
                                Admin Reset Password
                            </h1>
                            <p className="text-gray-800 text-center mb-12">
                                Please Enter Your New Admin Password
                            </p>
                            <form onSubmit={handleResetPassword}>
                                <div className="mb-4 relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter New Password"
                                        className="w-full px-4 py-3 border border-black rounded-md focus:outline-none focus:border-red-600 pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="mb-4 relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        className="w-full px-4 py-3 border border-black rounded-md focus:outline-none focus:border-red-600 pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="border-2 mt-5 border-red-600 w-full font-bold bg-red-600 text-white py-2 rounded-lg hover:bg-white hover:text-red-600 transition"
                                >
                                    Reset Password
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminResetPassword;
