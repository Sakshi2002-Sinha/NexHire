import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getMeApi, loginApi, registerApi } from "../api/authApi";
import { getErrorMessage, TOKEN_KEY } from "../api/axiosClient";

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { access_token: token } = await loginApi(credentials);
    localStorage.setItem(TOKEN_KEY, token);
    const user = await getMeApi();
    return { token, user };
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    return rejectWithValue(getErrorMessage(error, "Login failed"));
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { dispatch, rejectWithValue }) => {
  try {
    await registerApi(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Registration failed"));
  }
  return dispatch(login({ email: payload.email, password: payload.password })).unwrap();
});

// After a refresh only the token survives, so the profile is fetched again.
export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    return await getMeApi();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    error: null,
    isLoading: false,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.clear();
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.isLoading = true;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Request failed";
    };
    const authenticated = (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
    };
    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, authenticated)
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, authenticated)
      .addCase(register.rejected, rejected)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
