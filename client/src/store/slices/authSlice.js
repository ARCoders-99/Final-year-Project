import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    initLoading: true,
    error: null,
    message: null,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    registerRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    registerSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
    },
    registerFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    otpVerificationRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    otpVerificationSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    otpVerificationFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    loginRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    loginFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    logoutRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    logoutSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
      state.isAuthenticated = false;
      state.user = null;
    },
    logoutFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    getUserRequest(state) {
      state.initLoading = true;
      state.error = null;
      state.message = null;
    },
    getUserSuccess(state, action) {
      state.initLoading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    getUserFailed(state) {
      state.initLoading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    forgotPasswordRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    forgotPasswordSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    forgotPasswordFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    resetPasswordRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    resetPasswordSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    resetPasswordFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    updatePasswordRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    updatePasswordSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    updatePasswordFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    updateProfileRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    updateProfileSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.user = action.payload.user;
    },
    updateProfileFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    resetAuthSlice(state) {
      state.loading = false;
      state.error = null;
      state.message = null;
    },
    resetMessageError(state) {
      state.loading = false;
      state.error = null;
      state.message = null;
    },
  },
});

export const resetMessageErrorAction = () => (dispatch) => {
  dispatch(authSlice.actions.resetMessageError());
};

export const resetAuthSlice = () => (dispatch) => {
  dispatch(authSlice.actions.resetAuthSlice());
};

export const register = (data) => async (dispatch) => {
  dispatch(authSlice.actions.registerRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/register",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.registerSuccess(res.data));
  } catch (error) {
    dispatch(
      authSlice.actions.registerFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const otpVerification = (email, otp) => async (dispatch) => {
  dispatch(authSlice.actions.otpVerificationRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/verify-otp",
      { email, otp },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.otpVerificationSuccess(res.data));
  } catch (error) {
    dispatch(
      authSlice.actions.otpVerificationFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(authSlice.actions.loginRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/login",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.loginSuccess(res.data));
  } catch (error) {
    dispatch(
      authSlice.actions.loginFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const googleLogin = (data) => async (dispatch) => {
  dispatch(authSlice.actions.loginRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/social-login",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.loginSuccess(res.data));
  } catch (error) {
    dispatch(
      authSlice.actions.loginFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};


export const logout = () => async (dispatch) => {
  dispatch(authSlice.actions.logoutRequest());
  try {
    const res = await axios.get("http://localhost:4000/api/v1/auth/logout", {
      withCredentials: true,
    });
    dispatch(authSlice.actions.logoutSuccess(res.data.message));
  } catch (error) {
    dispatch(
      authSlice.actions.logoutFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const getUser = () => async (dispatch) => {
  dispatch(authSlice.actions.getUserRequest());
  try {
    const res = await axios.get("http://localhost:4000/api/v1/auth/me", {
      withCredentials: true,
    });
    dispatch(authSlice.actions.getUserSuccess(res.data));
  } catch {
    dispatch(authSlice.actions.getUserFailed());
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch(authSlice.actions.forgotPasswordRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/password/forgot",
      { email },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.forgotPasswordSuccess(res.data.message));
  } catch (error) {
    dispatch(
      authSlice.actions.forgotPasswordFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const verifyForgotPasswordOtp = (email, otp) => async (dispatch) => {
  dispatch(authSlice.actions.forgotPasswordRequest());
  try {
    const res = await axios.post(
      "http://localhost:4000/api/v1/auth/password/verify-otp",
      { email, otp },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.forgotPasswordSuccess(res.data.message));
    return res.data.token;
  } catch (error) {
    dispatch(
      authSlice.actions.forgotPasswordFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const resetPassword = (data, token) => async (dispatch) => {
  dispatch(authSlice.actions.resetPasswordRequest());
  try {
    const res = await axios.put(
      `http://localhost:4000/api/v1/auth/password/reset/${token}`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.resetPasswordSuccess(res.data.message));
  } catch (error) {
    dispatch(
      authSlice.actions.resetPasswordFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const updatePassword = (data) => async (dispatch) => {
  dispatch(authSlice.actions.updatePasswordRequest());
  try {
    const res = await axios.put(
      "http://localhost:4000/api/v1/auth/password/update",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.updatePasswordSuccess(res.data.message));
  } catch (error) {
    dispatch(
      authSlice.actions.updatePasswordFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export const updateCredentials = (data) => async (dispatch) => {
  dispatch(authSlice.actions.updateProfileRequest());
  try {
    const res = await axios.put(
      "http://localhost:4000/api/v1/auth/update/profile",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(authSlice.actions.updateProfileSuccess(res.data));
  } catch (error) {
    dispatch(
      authSlice.actions.updateProfileFailed(
        error.response?.data?.message || error.message
      )
    );
  }
};

export default authSlice.reducer;
