import { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, resetMessageErrorAction } from "../store/slices/authSlice";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, message, isAuthenticated } = useSelector(
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
      navigateTo("/");
    }
  }, [dispatch, error, message, isAuthenticated, navigateTo]);

  return (
    <>
      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative overflow-y-auto">
          <div className="max-w-sm w-full">
            <div className="flex justify-center mb-8">
              <img src={logo} alt="logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-4xl font-medium text-center mb-4">Welcome Back!!!</h1>
            <p className="text-gray-600 text-center mb-8">Please enter your credentials to login</p>

            <form onSubmit={handleLogin} noValidate>

              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
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

              <div className="flex justify-between items-center mb-8">
                <Link to={"/password/forgot"} className="font-semibold text-sm hover:underline">Forgot Password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="border-2 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
              >
                {loading ? "AUTHENTICATING..." : "SIGN IN"}
              </button>
            </form>


            <div className="mt-8 text-center text-sm md:hidden font-semibold">
              New to our platform? <Link to="/register" className="text-blue-600 hover:underline">Sign Up</Link>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (Branding) */}
        <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]">
          <div className="text-center">
            <img src={logo_with_title} alt="logo" className="mb-12 h-44 w-auto mx-auto" />
            <p className="text-gray-300 mb-12">New to our platform? Sign up now.</p>
            <Link
              to="/register"
              className="border-2 border-white px-8 font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition inline-block"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
