import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// --- Change 1: Import the configured axiosInstance ---
import axiosInstance from "../axiosInstance";

// --- Removed imports: axios, BASE_URL ---

const API_BASE_URL = `/api/users`; // Relative path

// 1. Define Interfaces for State and Payloads
interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    subjects: [];
    userType?: string;
    children?: [];
    parentId?: string;
    isSubscribed?: string;
    class?: string
    // Add other user properties here as they exist in your models
}


interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    token?: any;
    resetToken?: any
}

interface AllUsersPayload {
    userType: "teacher" | "student" | "parent" | "admin";
    users: User[];
}

interface AuthState {
    loading: boolean;
    error: any | null;
    allUsers: {
        teacher: User[];
        student: User[];
        parent: User[];
        admin: User[];
    };
    currentUser: User | null;
    createResponse: any | null;
    updateResponse: any | null;
    authStatus: "idle" | "loading" | "succeeded" | "failed";
    authMessage: string | null;
    resetToken: string | null;
}

// --- Removed: getAuthHeaders utility ---

// 3. Update Thunks (Using axiosInstance)

export const createUser = createAsyncThunk<
    ApiResponse<User>,
    any,
    { rejectValue: any }
>("users/createUser", async (userData, thunkAPI) => {
    try {
        // Use axiosInstance; token handled by interceptor
        const res = await axiosInstance.post(`${API_BASE_URL}/create`, userData);
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const fetchAllUsersByType = createAsyncThunk<
    AllUsersPayload,
    "teacher" | "student" | "parent" | "admin" | "grade" | "course",
    { rejectValue: any }
>("users/fetchAllUsersByType", async (userType) => {
    try {
        // Use axiosInstance; token handled by interceptor
        const res = await axiosInstance.get(`${API_BASE_URL}/all/${userType}`);
        return { userType, users: res.data.data };
    } catch (err: any) {
        return (err.response?.data || err.message);
    }
});

interface FetchUserByIdParams {
    id: string;
    userType: string;
    updateData?: any;
}

export const fetchUserById = createAsyncThunk<
    User,
    FetchUserByIdParams,
    { rejectValue: any }
>("users/fetchUserById", async ({ userType, id }, thunkAPI) => {
    try {
        // Use axiosInstance; token handled by interceptor
        const res = await axiosInstance.get(`${API_BASE_URL}/${userType}/${id}`);
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const updateUser = createAsyncThunk<
    User,
    FetchUserByIdParams,
    { rejectValue: any }
>("users/updateUser", async ({ userType, id, updateData }, thunkAPI) => {
    try {
        // Use axiosInstance; token handled by interceptor
        const res = await axiosInstance.put(
            `${API_BASE_URL}/update/${userType}/${id}`,
            updateData
        );
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// New Thunks for Authentication and Password Reset (Authentication is often public, so using axiosInstance is fine)
export const signInUser = createAsyncThunk<
    ApiResponse<User>,
    { userType: string; email: string; password: string },
    { rejectValue: any }
>("auth/signInUser", async ({ userType, email, password }, thunkAPI) => {
    try {
        // Use axiosInstance
        const res = await axiosInstance.post(`${API_BASE_URL}/auth/signin`, {
            userType,
            email,
            password,
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// New: Forgot Password (Send OTP)
export const forgotPassword = createAsyncThunk<
    ApiResponse<null>,
    { userType: string; email: string },
    { rejectValue: any }
>("auth/forgotPassword", async ({ userType, email }, thunkAPI) => {
    try {
        // Use axiosInstance
        const res = await axiosInstance.post(`${API_BASE_URL}/forgot-password`, {
            userType,
            email,
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// New: Resend OTP
export const resendOtp = createAsyncThunk<
    ApiResponse<null>,
    { userType: string; email: string },
    { rejectValue: any }
>("auth/resendOtp", async ({ userType, email }, thunkAPI) => {
    try {
        // Use axiosInstance
        const res = await axiosInstance.post(`${API_BASE_URL}/resend-otp`, {
            userType,
            email,
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// New: Verify Forgot Password (Verify OTP)
interface VerifyOtpResponse {
    resetToken: string;
}

export const verifyForgotPassword = createAsyncThunk<
    ApiResponse<VerifyOtpResponse>,
    { email: string; otp: string },
    { rejectValue: any }
>("auth/verifyForgotPassword", async ({ email, otp }, thunkAPI) => {
    try {
        // Use axiosInstance
        const res = await axiosInstance.post(`${API_BASE_URL}/verify-forgot-password`, {
            email,
            otp,
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const resetPassword = createAsyncThunk<
    ApiResponse<null>,
    { userType: string; email: string; password: string; token: string },
    { rejectValue: any }
>("auth/resetPassword", async ({ userType, email, password, token }, thunkAPI) => {
    try {
        // Use axiosInstance, but manually set the unique reset token header
        const res = await axiosInstance.post(
            `${API_BASE_URL}/reset-password`,
            {
                userType,
                email,
                password,
            },
            {
                // This custom header is necessary because the interceptor only handles the main admin/user token.
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// 4. Slice
const userSlice = createSlice({
    name: "users",
    initialState: {
        loading: false,
        error: null,
        allUsers: {
            teacher: [],
            student: [],
            parent: [],
            admin: [],
        },
        currentUser: null,
        createResponse: null,
        updateResponse: null,
        authStatus: "idle",
        authMessage: null,
        resetToken: null,
    } as AuthState,
    reducers: {
        clearUserState: (state) => {
            state.error = null;
            state.currentUser = null;
            state.createResponse = null;
            state.updateResponse = null;
            state.authStatus = "idle";
            state.authMessage = null;
            state.resetToken = null;
        },
    },
    extraReducers: (builder) => {
        // Existing CRUD cases
        builder
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.createResponse = action.payload;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAllUsersByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsersByType.fulfilled, (state, action) => {
                state.loading = false;
                // Correctly update the specific user type array
                const userTypeKey = action.payload.userType.toLowerCase() as keyof AuthState['allUsers'];
                if (state.allUsers.hasOwnProperty(userTypeKey)) {
                    state.allUsers[userTypeKey] = action.payload.users;
                }
            })
            .addCase(fetchAllUsersByType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentUser = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.updateResponse = action.payload;
                // Optionally update currentUser if it matches the updated user
                if (state.currentUser && state.currentUser._id === action.payload._id) {
                    state.currentUser = action.payload;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // New cases for auth thunks
            .addCase(signInUser.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
            })
            .addCase(signInUser.fulfilled, (state, action: PayloadAction<ApiResponse<User>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.currentUser = action.payload.data || null;
                state.error = null;
            })
            .addCase(signInUser.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "Sign-in failed";
                state.error = action.payload;
            })
            // Forgot Password
            .addCase(forgotPassword.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action: PayloadAction<ApiResponse<null>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.error = null;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "Failed to send OTP";
                state.error = action.payload;
            })
            // Resend OTP
            .addCase(resendOtp.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
            })
            .addCase(resendOtp.fulfilled, (state, action: PayloadAction<ApiResponse<null>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.error = null;
            })
            .addCase(resendOtp.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "Failed to resend OTP";
                state.error = action.payload;
            })
            // Verify Forgot Password
            .addCase(verifyForgotPassword.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
                state.resetToken = null;
            })
            .addCase(verifyForgotPassword.fulfilled, (state, action: PayloadAction<ApiResponse<VerifyOtpResponse>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.resetToken = action.payload.data?.resetToken || null;
                state.error = null;
            })
            .addCase(verifyForgotPassword.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "OTP verification failed";
                state.error = action.payload;
                state.resetToken = null;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action: PayloadAction<ApiResponse<null>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.error = null;
                state.resetToken = null;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "Failed to reset password";
                state.error = action.payload;
            });
    },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;