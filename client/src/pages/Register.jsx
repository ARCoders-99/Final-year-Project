import { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { register, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  const { error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const navigateTo = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", name);
    data.append("email", email);
    data.append("password", password);
    dispatch(register(data));
  };

  useEffect(() => {
    if (message) {
      toast.success(message); // Show success toast
      dispatch(resetAuthSlice()); // Reset Redux state
      navigateTo(`/otp-verification/${email}`); // Navigate to OTP
    }

    if (error) {
      toast.error(error); // Show error toast
      dispatch(resetAuthSlice()); // Reset Redux state
    }
  }, [dispatch, message, error, email, navigateTo]);

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }
  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      {/* LEFT SIDE (Static/Branding) */}
      <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
        <div className="text-center space-y-12">
          <div className="flex justify-center">
            {/* Logo and Title */}
            <img src={logo_with_title} alt="logo" className="h-44 w-auto" />
          </div>

          <p className="text-gray-300 text-center">
            Already have an account? Sign in now.
          </p>

          <Link
            to="/login"
            className="block w-fit mx-auto 
      border-2 border-white rounded-lg font-semibold 
      py-2 px-6 text-white 
      hover:bg-white hover:text-black 
      transition-all duration-300 ease-in-out 
      focus:outline-none focus:ring-2 focus:ring-white"
          >
            SIGN IN
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE (Registration Form) */}

      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-12">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-5">
              <h3 className="font-medium text-4xl overflow-hidden">Sign Up</h3>
              <img src={logo} alt="logo" className="h-auto w-24 object-cover" />
            </div>
          </div>

          <p className="text-gray-800 text-center mb-12">
            Please provide your information to sign up.
          </p>
          <form onSubmit={handleRegister}>
            <div className="mb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
              />
            </div>
            <div className="mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
              />
            </div>
            <div className="mb-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
              />
            </div>

            {/* Hidden link for mobile view (from j.PNG) */}
            <div className="block md:hidden font-semibold mt-5">
              <p>
                Already have Account?
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Submit button (from j.PNG) */}
            <button
              type="submit"
              className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
            >
              SIGN UP
            </button>
          </form>

          {/* Form inputs would go here */}
        </div>
      </div>
    </div>
  );
};

export default Register;
