import { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyForgotPasswordOtp, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const ForgotPasswordOTP = ({ adminPortal = false }) => {
    const { email } = useParams();
    const [otp, setOtp] = useState("");
    const dispatch = useDispatch();
    const navigateTo = useNavigate();

    const { loading, error, message, isAuthenticated } = useSelector(
        (state) => state.auth
    );

    const handleOtpVerification = async (e) => {
        e.preventDefault();
        const token = await dispatch(verifyForgotPasswordOtp(email, otp));
        if (token) {
            toast.success("OTP Verified Successfully");
            const resetPath = adminPortal ? `/admin/password/reset/${token}` : `/password/reset/${token}`;
            navigateTo(resetPath);
        }
    };

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, error]);


    const themeColor = adminPortal ? "red-600" : "black";
    const hoverColor = adminPortal ? "hover:bg-red-600 hover:text-white" : "hover:bg-black hover:text-white";
    const borderColor = adminPortal ? "border-red-600" : "border-black";
    const bgColor = adminPortal ? "bg-red-600" : "bg-black";
    const backLink = adminPortal ? "/admin/password/forgot" : "/password/forgot";

    return (
        <>
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* LEFT SIDE */}
                <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative">
                    <Link
                        to={backLink}
                        className={`border-2 ${borderColor} rounded-lg font-bold w-52 py-2 px-4 fixed top-10 left-28 ${hoverColor} transition duration-300 text-end`}
                    >
                        Back
                    </Link>
                    <div className="max-w-sm w-full">
                        <div className="flex justify-center mb-12">
                            <div className="rounded-full flex items-center justify-center">
                                <img src={logo} alt="logo" className="h-24 w-auto" />
                            </div>
                        </div>
                        <h1 className={`text-4xl font-bold text-center mb-12 overflow-hidden ${adminPortal ? "text-red-600" : ""}`}>
                            Verification Code
                        </h1>
                        <p className="text-gray-800 text-center mb-12">
                            Please enter the code sent to <strong>{email}</strong>
                        </p>
                        <form onSubmit={handleOtpVerification}>
                            <div className="mb-4">
                                <input
                                    type="number"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="OTP"
                                    className={`w-full px-4 py-3 border border-black rounded-md focus:outline-none focus:border-${themeColor}`}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`border-2 mt-5 ${borderColor} w-full font-bold ${bgColor} text-white py-2 rounded-lg hover:bg-white hover:text-${themeColor} transition`}
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </form>
                    </div>
                </div>
                {/* RIGHT SIDE */}
                <div className={`hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]`}>
                    <div className="text-center h-[400px]">
                        <div className="flex justify-center mb-12">
                            <img
                                src={logo_with_title}
                                alt="logo"
                                className="mb-12 h-44 w-auto"
                            />
                        </div>

                        <p className="text-gray-300 mb-12">
                            Securing your access to the digital library.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordOTP;
