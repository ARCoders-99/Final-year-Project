import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toggleAddBookPopup } from "./popUpSlice";

const bookSlice = createSlice({
  name: "book",
  initialState: {
    loading: false,
    error: null,
    message: null,
    books: [],
  },
  reducers: {
    fetchBooksRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchBooksSuccess(state, action) {
      state.loading = false;
      state.books = action.payload;
    },
    fetchBooksFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    addBookRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    addBookSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    addBookFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    resetBookSlice(state) {
      state.error = null;
      state.message = null;
      state.loading = false;
    },
  },
});

export const fetchAllBooks = () => async (dispatch) => {
  dispatch(bookSlice.actions.fetchBooksRequest());
  await axios
    .get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/book/all`, {
      withCredentials: true,
    })
    .then((res) => {
      dispatch(bookSlice.actions.fetchBooksSuccess(res.data.books));
    })
    .catch((err) => {
      dispatch(
        bookSlice.actions.fetchBooksFailed(
          err.response?.data?.message || "Something went wrong"
        )
      );
    });
};

export const addBook = (formData) => async (dispatch) => {
  dispatch(bookSlice.actions.addBookRequest());
  await axios
    .post(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/book/admin/add`, formData, {
      withCredentials: true,
      // Do NOT set Content-Type manually — axios sets it with boundary for FormData
    })
    .then((res) => {
      dispatch(bookSlice.actions.addBookSuccess(res.data.message));
      dispatch(toggleAddBookPopup());
    })
    .catch((err) => {
      dispatch(
        bookSlice.actions.addBookFailed(
          err.response?.data?.message || "Error adding book"
        )
      );
    });
};

export const resetBookSlice = () => (dispatch) => {
  dispatch(bookSlice.actions.resetBookSlice());
};
export default bookSlice.reducer;
