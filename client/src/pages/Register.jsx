import { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { register, googleLogin, resetAuthSlice } from "../store/slices/authSlice";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import Button from "../components/ui/Button";
const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();

  const { error, message, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  const navigateTo = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    if (name.length < 3 || name.length > 30) {
      return toast.error("Name must be between 3 and 30 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (password.length < 8 || password.length > 16) {
      return toast.error("Password must be between 8 and 16 characters.");
    }

    dispatch(register({ name, email, password }));
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      dispatch(googleLogin({
        name: user.displayName,
        email: user.email,
        uid: user.uid
      }));
    } catch (error) {
      toast.error(error.message);
    }
  };


  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(resetAuthSlice());
      if (message.includes("Verification code sent")) {
        navigateTo(`/otp-verification/${email}`);
      }
    }

    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error, email, navigateTo]);

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      {/* LEFT SIDE (Branding) */}
      <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
        <div className="text-center space-y-12">
          <div className="flex justify-center">
            <img src={logo_with_title} alt="logo" className="h-44 w-auto" />
          </div>
          <p className="text-gray-300">Already have an account? Sign in now.</p>
          <Link
            to="/login"
            className="block w-fit mx-auto border-2 border-white rounded-lg font-bold py-2 px-6 text-white hover:bg-white hover:text-black transition-all duration-300 ease-in-out"
          >
            SIGN IN
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-5">
              <h3 className="font-bold text-4xl">Sign Up</h3>
              <img src={logo} alt="logo" className="h-auto w-20" />
            </div>
          </div>

          <form onSubmit={handleRegister}>

            <div className="mb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                required
              />
            </div>
            <div className="mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                required
              />
            </div>
            <div className="mb-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none pr-12"
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

            <Button
              type="submit"
              loading={loading}
              className="border-2 mt-5 border-black w-full font-bold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
            >
              SIGN UP
            </Button>

            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="px-3 text-gray-500 text-sm">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="border-2 border-gray-300 w-full font-bold bg-white text-black py-2 rounded-lg hover:border-black transition"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="h-5 w-5" />
              CONTINUE WITH GOOGLE
            </Button>
          </form>


          <div className="mt-6 text-center text-sm md:hidden">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
