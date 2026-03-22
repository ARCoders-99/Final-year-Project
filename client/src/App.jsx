import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OTP from "./pages/OTP";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useRef } from "react";
import { getUser } from "./store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers } from "./store/slices/userSlice";
import { fetchAllBooks } from "./store/slices/bookSlice";
import { fetchAllBorrowedBooks, fetchUserBorrowedBooks } from "./store/slices/borrowSlice";
import { fetchAllDigitalBooks, fetchMyDigitalBorrows } from "./store/slices/digitalSlice";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import BookManagement from "./admin/BookManagement";
import Users from "./admin/Users";
import Catalog from "./admin/Catalog";
import UserDashboard from "./components/UserDashboard";
import ForgotPasswordOTP from "./pages/ForgotPasswordOTP";
import MyBorrowedBooks from "./components/MyBorrowedBooks";
import ImportDigitalBook from "./admin/ImportDigitalBook";
import ReaderPage from "./pages/ReaderPage";
import PhysicalBookReader from "./pages/PhysicalBookReader";
import Payments from "./admin/Payments";
import AdminForgotPassword from "./admin/AdminForgotPassword";
import AdminForgotPasswordOTP from "./admin/AdminForgotPasswordOTP";
import AdminResetPassword from "./admin/AdminResetPassword";
import ChatWidget from "./components/ChatWidget.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";
import { fetchConversations } from "./store/slices/messageSlice";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, initLoading, user } = useSelector((state) => state.auth);

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} replace />;
  }

  if (adminOnly && user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    dispatch(getUser());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchAllBooks());
    dispatch(fetchConversations());
    if (user?.role === "User") {
      dispatch(fetchUserBorrowedBooks());
      dispatch(fetchAllDigitalBooks());
      dispatch(fetchMyDigitalBorrows());
    }
    if (user?.role === "Admin") {
      dispatch(fetchAllUsers());
      dispatch(fetchAllBorrowedBooks());
      dispatch(fetchAllDigitalBooks());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/books" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/borrowed" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/digital-library" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/reader/:id" element={<ProtectedRoute><ReaderPage /></ProtectedRoute>} />
        <Route path="/read-book/:id" element={<ProtectedRoute><PhysicalBookReader /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/otp-verification/:email" element={<OTP />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />

        {/* Admin Portal Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/admin/books" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/admin/catalog" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/admin/import-digital" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute adminOnly={true}><Home /></ProtectedRoute>} />
        <Route path="/password/forgot/otp/:email" element={<ForgotPasswordOTP />} />
        <Route path="/admin/password/forgot" element={<AdminForgotPassword />} />
        <Route path="/admin/password/forgot/otp/:email" element={<AdminForgotPasswordOTP />} />
        <Route path="/admin/password/reset/:token" element={<AdminResetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer theme="dark" position="top-right" />
      {isAuthenticated && (
        <>
          <ChatWidget />
          {user?.role !== "Admin" && <ChatbotWidget />}
        </>
      )}
    </Router>
  );
};

export default App;
