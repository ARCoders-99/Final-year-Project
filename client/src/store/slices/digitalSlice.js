import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const digitalSlice = createSlice({
    name: "digital",
    initialState: {
        loading: false,
        error: null,
        message: null,
        searchByGutenbergResults: [],
        digitalBooks: [],
        myDigitalBorrows: [],
        allDigitalBorrows: [],
    },
    reducers: {
        requestForDigital(state) {
            state.loading = true;
            state.error = null;
            state.message = null;
        },
        successForDigitalSearch(state, action) {
            state.loading = false;
            state.searchByGutenbergResults = action.payload;
        },
        successForDigitalBooks(state, action) {
            state.loading = false;
            state.digitalBooks = action.payload;
        },
        successForImportDigitalBook(state, action) {
            state.loading = false;
            state.message = action.payload;
        },
        successForBorrowDigitalBook(state, action) {
            state.loading = false;
            state.message = action.payload;
        },
        successForMyDigitalBorrows(state, action) {
            state.loading = false;
            state.myDigitalBorrows = action.payload;
        },
        successForAllDigitalBorrows(state, action) {
            state.loading = false;
            state.allDigitalBorrows = action.payload;
        },
        failureForDigital(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        resetDigitalSlice(state) {
            state.error = null;
            state.message = null;
        },
    },
});

export const searchGutenbergBooks = (title, author) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/search`,
            {
                params: { title, author },
                withCredentials: true
            }
        );
        dispatch(digitalSlice.actions.successForDigitalSearch(response.data.results));
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const importGutenbergBook = (bookData) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/import`,
            bookData,
            {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            }
        );
        dispatch(digitalSlice.actions.successForImportDigitalBook(response.data.message));
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const fetchAllDigitalBooks = () => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/all`,
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForDigitalBooks(response.data.books));
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const borrowDigitalBook = (id) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/borrow/${id}`,
            {},
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForBorrowDigitalBook(response.data.message));
        // Re-fetch borrows to update UI immediately
        dispatch(fetchMyDigitalBorrows());
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || "Something went wrong";
        dispatch(digitalSlice.actions.failureForDigital(errorMsg));
        throw errorMsg;
    }
};

export const recordPaidDigitalBorrow = (bookId, sessionId) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/record-paid-borrow/${bookId}`,
            { sessionId },
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForBorrowDigitalBook(res.data.message));
        dispatch(fetchMyDigitalBorrows());
        return res.data;
    } catch (err) {
        const errorMsg = err.response?.data?.message || "Something went wrong";
        dispatch(digitalSlice.actions.failureForDigital(errorMsg));
        throw errorMsg;
    }
};

export const fetchMyDigitalBorrows = () => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/my-borrows`,
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForMyDigitalBorrows(response.data.borrows));
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const fetchAllDigitalBorrows = () => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/admin/all-borrows`,
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForAllDigitalBorrows(response.data.borrows));
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const returnDigitalBook = (id) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/return/${id}`,
            {},
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForBorrowDigitalBook(response.data.message));
        // Re-fetch borrows to update UI immediately
        dispatch(fetchMyDigitalBorrows());
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || "Something went wrong";
        dispatch(digitalSlice.actions.failureForDigital(errorMsg));
        throw errorMsg;
    }
};

export const deleteDigitalBook = (id) => async (dispatch) => {
    dispatch(digitalSlice.actions.requestForDigital());
    try {
        const response = await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/v1/digital/delete/${id}`,
            { withCredentials: true }
        );
        dispatch(digitalSlice.actions.successForImportDigitalBook(response.data.message));
        dispatch(fetchAllDigitalBooks()); // Re-fetch to update list
    } catch (error) {
        dispatch(digitalSlice.actions.failureForDigital(error.response?.data?.message || "Something went wrong"));
    }
};

export const resetDigitalSlice = () => (dispatch) => {
    dispatch(digitalSlice.actions.resetDigitalSlice());
};

export default digitalSlice.reducer;
