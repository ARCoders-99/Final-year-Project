import { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, resetMessageErrorAction } from "../store/slices/authSlice";
const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigateTo = useNavigate();
    const dispatch = useDispatch();

    const { loading, error, message, isAuthenticated, user } = useSelector(
        (state) => state.auth
    );

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(login({ email, password }));
    };

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(resetMessageErrorAction());
        }

        if (message) {
            toast.success(message);
            dispatch(resetMessageErrorAction());
        }

        if (isAuthenticated) {
            if (user?.role === "Admin") {
                navigateTo("/admin/dashboard");
            } else {
                toast.error("Not authorized as Admin");
                // Optionally logout if we want to be strict, 
                // but for now just redirecting to user area might be confusing if they wanted admin.
            }
        }
    }, [dispatch, error, message, isAuthenticated, user, navigateTo]);

    return (
        <>
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* LEFT SIDE */}
                <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative overflow-y-auto">
                    <div className="max-w-sm w-full">
                        <div className="flex justify-center mb-8">
                            <img src={logo} alt="logo" className="h-20 w-auto" />
                        </div>
                        <h1 className="text-4xl font-bold text-center mb-4 text-red-600">Admin Portal</h1>
                        <p className="text-gray-600 text-center mb-8 font-bold">Restricted Access - Admin Credentials Required</p>

                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Admin Email"
                                    className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="border-2 border-red-600 w-full font-bold bg-red-600 text-white py-2 rounded-lg hover:bg-white hover:text-red-600 transition"
                            >
                                {loading ? "AUTHENTICATING..." : "ADMIN LOGIN"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT SIDE (Branding) */}
                <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]">
                    <div className="text-center">
                        <img src={logo_with_title} alt="logo" className="mb-12 h-44 w-auto mx-auto" />
                        <h2 className="text-2xl font-bold mb-4">Library Management System</h2>
                        <p className="text-gray-400">Secure Administrative Dashboard</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;
