import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../baseurl";

const API_BASE_URL = `${BASE_URL}/api/users`;

// 1. Define Interfaces for State and Payloads
interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    subjects: [];
    userType?:string;
    children?:[];
    parentId?:string;
    isSubscribed?: string;
    class?:string
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
    error: any | null; // Use 'any' to handle potential complex error objects
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
    resetToken: string | null; // Added for verify-forgot-password
}

// 2. Utility to get token and headers
const getAuthHeaders = () => {
    const token =
        localStorage.getItem("yareadmintoken") || localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token || ""}`,
        },
    };
};
// 3. Update Thunks with proper generics for types
// The generics are: <Returned, ThunkArg, ThunkApiConfig>
// We are primarily concerned with 'Returned' and 'ThunkApiConfig' to type the payload and errors.

export const createUser = createAsyncThunk<
    ApiResponse<User>, // Fulfilled payload
    any, // Arguments
    { rejectValue: any } // ThunkAPI configuration
>("users/createUser", async (userData, thunkAPI) => {
    try {

        console.log(getAuthHeaders(), 'getAuthHeaders')
        const res = await axios.post(`${API_BASE_URL}/create`, userData, getAuthHeaders());
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const fetchAllUsersByType = createAsyncThunk<
    AllUsersPayload, // Fulfilled payload
    "teacher" | "student" | "parent" | "admin" | "grade" | "course", // userType argument
    { rejectValue: any }
>("users/fetchAllUsersByType", async (userType) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/all/${userType}`, getAuthHeaders());
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
    User, // Fulfilled payload
    FetchUserByIdParams, // Arguments
    { rejectValue: any }
>("users/fetchUserById", async ({ userType, id }, thunkAPI) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/${userType}/${id}`, getAuthHeaders());
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const updateUser = createAsyncThunk<
    User, // Fulfilled payload
    FetchUserByIdParams, // Arguments
    { rejectValue: any }
>("users/updateUser", async ({ userType, id, updateData }, thunkAPI) => {
    try {

        console.log(updateData, 'updateData')
        const res = await axios.put(
            `${API_BASE_URL}/update/${userType}/${id}`,
            updateData,
            getAuthHeaders()
        );
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// New Thunks for Authentication and Password Reset
export const signInUser = createAsyncThunk<
    ApiResponse<User>, // Fulfilled payload
    { userType: string; email: string; password: string }, // Arguments
    { rejectValue: any }
>("auth/signInUser", async ({ userType, email, password }, thunkAPI) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/signin`, {
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
    ApiResponse<null>, // No data returned on success, just a message
    { userType: string; email: string }, // Arguments
    { rejectValue: any }
>("auth/forgotPassword", async ({ userType, email }, thunkAPI) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/forgot-password`, {
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
    ApiResponse<null>, // No data returned on success, just a message
    { userType: string; email: string }, // Arguments
    { rejectValue: any }
>("auth/resendOtp", async ({ userType, email }, thunkAPI) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/resend-otp`, {
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
    ApiResponse<VerifyOtpResponse>, // Returns a resetToken on success
    { email: string; otp: string }, // Arguments
    { rejectValue: any }
>("auth/verifyForgotPassword", async ({ email, otp }, thunkAPI) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/verify-forgot-password`, {
            email,
            otp,
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const resetPassword = createAsyncThunk<
    ApiResponse<null>, // No data returned on success
    { userType: string; email: string; password: string; token: string }, // Arguments (added token)
    { rejectValue: any }
>("auth/resetPassword", async ({ userType, email, password, token }, thunkAPI) => {
    try {
        const res = await axios.post(
            `${API_BASE_URL}/reset-password`,
            {
                userType,
                email,
                password,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Send token in headers
                },
            }
        );
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

// 4. Update Slice with the new State Interface
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
        resetToken: null, // Initialize resetToken
    } as AuthState, // Cast initialState to the AuthState type
    reducers: {
        clearUserState: (state) => {
            state.error = null;
            state.currentUser = null;
            state.createResponse = null;
            state.updateResponse = null;
            state.authStatus = "idle";
            state.authMessage = null;
            state.resetToken = null; // Clear resetToken on state clear
        },
    },
    extraReducers: (builder) => {
        // Existing cases
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
            .addCase(fetchAllUsersByType.fulfilled, (state) => {
                state.loading = false;
                // const userTypeKey = action.payload.userType.toLowerCase();
                // state.allUsers[userTypeKey] = action.payload.users;
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
            // New: Forgot Password
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
            // New: Resend OTP
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
            // New: Verify Forgot Password
            .addCase(verifyForgotPassword.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
                state.resetToken = null;
            })
            .addCase(verifyForgotPassword.fulfilled, (state, action: PayloadAction<ApiResponse<VerifyOtpResponse>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.resetToken = action.payload.data?.resetToken || null; // Store the reset token
                state.error = null;
            })
            .addCase(verifyForgotPassword.rejected, (state, action) => {
                state.authStatus = "failed";
                state.authMessage = action.payload?.message || "OTP verification failed";
                state.error = action.payload;
                state.resetToken = null;
            })
            .addCase(resetPassword.pending, (state) => {
                state.authStatus = "loading";
                state.authMessage = null;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action: PayloadAction<ApiResponse<null>>) => {
                state.authStatus = "succeeded";
                state.authMessage = action.payload.message;
                state.error = null;
                state.resetToken = null; // Clear token after successful reset
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