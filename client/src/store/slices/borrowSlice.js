import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const borrowSlice = createSlice({
  name: "borrow",
  initialState: {
    loading: false,
    error: null,
    userBorrowedBooks: [],
    allBorrowedBooks: [],
    message: null,
    stripeSessionUrl: null,
    payments: [], // kept for legacy if needed
    physicalPayments: [],
    digitalPayments: [],
    physicalEarnings: 0,
    digitalEarnings: 0,
    totalEarnings: 0,
  },
  reducers: {
    fetchUserBorrowedBooksRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchUserBorrowedBooksSuccess(state, action) {
      state.loading = false;
      state.userBorrowedBooks = action.payload;
    },
    fetchUserBorrowedBooksFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    recordBookRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    recordBookSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    recordBookFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    fetchAllBorrowedBooksRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchAllBorrowedBooksSuccess(state, action) {
      state.loading = false;
      state.allBorrowedBooks = action.payload;
    },
    fetchAllBorrowedBooksFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    returnBookRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    returnBookSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    returnBookFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    resetBorrowSlice(state) {
      state.loading = false;
      state.error = null;
      state.message = null;
      state.stripeSessionUrl = null;
    },
    paymentRequest(state) {
      state.loading = true;
      state.error = null;
    },
    paymentSuccess(state, action) {
      state.loading = false;
      state.stripeSessionUrl = action.payload;
    },
    paymentFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchAllPaymentsSuccess(state, action) {
      state.loading = false;
      state.physicalPayments = action.payload.physicalPayments || [];
      state.digitalPayments = action.payload.digitalPayments || [];
      state.physicalEarnings = action.payload.physicalEarnings || 0;
      state.digitalEarnings = action.payload.digitalEarnings || 0;
      state.totalEarnings = action.payload.totalEarnings || 0;
    },
  },
});

export const fetchUserBorrowedBooks = () => async (dispatch) => {
  dispatch(borrowSlice.actions.fetchUserBorrowedBooksRequest());
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/borrow/my-borrowed-books`,
      { withCredentials: true }
    );
    dispatch(
      borrowSlice.actions.fetchUserBorrowedBooksSuccess(res.data.borrowedBooks)
    );
  } catch (err) {
    dispatch(
      borrowSlice.actions.fetchUserBorrowedBooksFailed(
        err.response?.data?.message || "Something went wrong"
      )
    );
  }
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(borrowSlice.actions.fetchAllBorrowedBooksRequest());
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/borrow/borrowed-books-by-users`,
      { withCredentials: true }
    );
    dispatch(
      borrowSlice.actions.fetchAllBorrowedBooksSuccess(res.data.borrowedBooks)
    );
  } catch (err) {
    dispatch(
      borrowSlice.actions.fetchAllBorrowedBooksFailed(
        err.response?.data?.message || "Something went wrong"
      )
    );
  }
};

export const recordBorrowBook = (email, id) => async (dispatch) => {
  dispatch(borrowSlice.actions.recordBookRequest());
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/borrow/record-borrow-book/${id}`,
      { email },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );

    dispatch(borrowSlice.actions.recordBookSuccess(res.data.message));
    return res.data.message;
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Something went wrong";
    dispatch(borrowSlice.actions.recordBookFailed(errorMsg));
    throw errorMsg;
  }
};


export const returnBook = ({ email, borrowId }) => async (dispatch) => {
  dispatch(borrowSlice.actions.returnBookRequest());
  try {
    const res = await axios.put(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/borrow/return-borrowed-book/${borrowId}`,
      { email },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    dispatch(borrowSlice.actions.returnBookSuccess(res.data.message));

    // Return response so component can await it
    return res.data;
  } catch (err) {
    dispatch(
      borrowSlice.actions.returnBookFailed(
        err.response?.data?.message || "Something went wrong"
      )
    );
    // Throw error to handle in component
    throw err;
  }
};


export const createPaymentIntent = (bookId) => async (dispatch) => {
  dispatch(borrowSlice.actions.paymentRequest());
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/payment/create-payment-intent/${bookId}`,
      {},
      { withCredentials: true }
    );
    // In this new flow, we return the clientSecret to the caller
    return res.data.clientSecret;
  } catch (err) {
    dispatch(
      borrowSlice.actions.paymentFailed(
        err.response?.data?.message || "Failed to initiate payment"
      )
    );
    throw err;
  }
};

export const recordPaidBorrow = (bookId, sessionId) => async (dispatch) => {
  dispatch(borrowSlice.actions.recordBookRequest());
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/borrow/record-paid-borrow/${bookId}`,
      { sessionId },
      { withCredentials: true }
    );
    dispatch(borrowSlice.actions.recordBookSuccess(res.data.message));
    return res.data;
  } catch (err) {
    dispatch(
      borrowSlice.actions.recordBookFailed(
        err.response?.data?.message || "Something went wrong"
      )
    );
    throw err;
  }
};

export const fetchAllPayments = () => async (dispatch) => {
  dispatch(borrowSlice.actions.paymentRequest());
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/payment/admin/payments`,
      { withCredentials: true }
    );
    dispatch(borrowSlice.actions.fetchAllPaymentsSuccess(res.data));
  } catch (err) {
    dispatch(
      borrowSlice.actions.paymentFailed(
        err.response?.data?.message || "Failed to fetch payments"
      )
    );
  }
};

export const resetBorrowSlice = () => (dispatch) => {
  dispatch(borrowSlice.actions.resetBorrowSlice());
};

export default borrowSlice.reducer;
