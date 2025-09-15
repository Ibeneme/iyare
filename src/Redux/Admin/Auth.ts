// src/redux/slices/adminAuthSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';
import { UserType } from '../../Pages/Admin/Admin/Dashboard/AdminDashboard';



interface AdminState {
    admin: {
        _id: string;
        email: string;
        role: string;
        token: string;
    } | null;
    loading: boolean;
    error: string | null;
    successMessage: string | null;
    resetToken: string | null;
}

const initialState: AdminState = {
    admin: null,
    loading: false,
    error: null,
    successMessage: null,
    resetToken: null,
};

// Register Admin
export const registerAdmin = createAsyncThunk(
    'admin/register',
    async ({ email, password, role }: { email: string; password: string; role: string }, thunkAPI) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/register`, { email, password, role });
            return response.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Registration failed');
        }
    }
);

// Login Admin
export const loginAdmin = createAsyncThunk(
    'admin/login',
    async ({ email, password }: { email: string; password: string }, thunkAPI) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/login`, { email, password });
            return response.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
        }
    }
);

// Forgot Password
export const forgotPassword = createAsyncThunk(
    'admin/forgotPassword',
    async ({ email }: { email: string }, thunkAPI) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/forgot-password`, { email });
            return response.data.message;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
        }
    }
);

// Resend OTP
export const resendOtp = createAsyncThunk(
    'admin/resendOtp',
    async ({ email }: { email: string }, thunkAPI) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/resend-otp`, { email });
            return response.data.message;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to resend OTP');
        }
    }
);

// Verify OTP
export const verifyOtp = createAsyncThunk(
    'admin/verifyOtp',
    async ({ email, otp }: { email: string; otp: string }, thunkAPI) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/verify-forgot-password`, { email, otp });
            return response.data.resetToken;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Invalid OTP');
        }
    }
);

// Reset Password
export const resetPassword = createAsyncThunk(
    'admin/resetPassword',
    async (
        { email, password, resetToken }: { email: string; password: string; resetToken: string },
        thunkAPI
    ) => {
        try {
            const response = await axios.post(
                `${BASE_URL}/api/admin/reset-password`,
                { email, password },
                {
                    headers: {
                        Authorization: `Bearer ${resetToken}`,
                    },
                }
            );
            return response.data.message;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || 'Password reset failed');
        }
    }
);



export const fetchAllAdmins = createAsyncThunk("admin/fetchAll", async (_, thunkAPI) => {
    try {
        const res = await axios.get(`${BASE_URL}/api/admin`);
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch admins");
    }
});

export const fetchAdminById = createAsyncThunk(
    "user/fetchAdminById",
    async ({ id, userType }: { id: string; userType: string }, thunkAPI) => {
        try {
            const res = await axios.get(`${BASE_URL}/api/admin/${userType}/${id}`);
            return res.data.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch user"
            );
        }
    }
);

export const toggleSuspendAdmin = createAsyncThunk(
    "admin/suspend",
    async (
        { id, userType }: { id: string; userType: UserType },
        thunkAPI
    ) => {
        try {
            const res = await axios.put(`${BASE_URL}/api/admin/suspend/${id}`, { userType });
            return { id, userType, message: res.data.message };
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to toggle suspension"
            );
        }
    }
);

export const deleteAdmin = createAsyncThunk(
    "admin/delete",
    async (
        { id, userType }: {
            id: string; userType: UserType
        },
        thunkAPI
    ) => {
        try {
            const res = await axios.delete(
                `${BASE_URL}/api/admin/delete/${id}`,
                { data: { userType } } 
            );
            return { id, userType, message: res.data.message };
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to delete admin"
            );
        }
    }
);

export const updateSelfAdmin = createAsyncThunk(
    "admin/updateSelf",
    async (
        { id, email, password, role, token }: { id: string; email?: string; password?: string; role?: string; token: string },
        thunkAPI
    ) => {
        try {
            const res = await axios.put(
                `${BASE_URL}/api/admin/self-update/${id}`,
                { email, password, role },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update profile");
        }
    }
);

// const getAuthHeaders = () => {
//     const token =
//       localStorage.getItem("yareadmintoken") || localStorage.getItem("token");
  
//     return {
//       headers: {
//         Authorization: `Bearer ${token || ""}`,
//       },
//     };
//   };

export const addAdmin = createAsyncThunk(
    "admin/add",
    async (
        { email, password, role, firstName, lastName }: { email: string; password: string; role: string; firstName: string, lastName: string },
        thunkAPI
    ) => {
        try {

            const token: string | null =   localStorage.getItem("yareadmintoken") || localStorage.getItem("token");

            if (!token) {
                return thunkAPI.rejectWithValue("Authorization token not found.");
            }

            const res = await axios.post(
                `${BASE_URL}/api/admin/add-admin`,
                { email, password, role, firstName, lastName },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to add admin");
        }
    }
);



const adminAuthSlice = createSlice({
    name: 'adminAuth',
    initialState,
    reducers: {
        logoutAdmin(state) {
            state.admin = null;
            state.resetToken = null;
            state.successMessage = null;
            state.error = null;
        },
        clearAuthState(state) {
            state.loading = false;
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerAdmin.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.admin = action.payload;
            })
            .addCase(registerAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(loginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.admin = action.payload;
            })
            .addCase(loginAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(forgotPassword.fulfilled, (state, action: PayloadAction<string>) => {
                state.successMessage = action.payload;
                state.error = null;
            })
            .addCase(forgotPassword.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })

            .addCase(resendOtp.fulfilled, (state, action: PayloadAction<string>) => {
                state.successMessage = action.payload;
                state.error = null;
            })
            .addCase(resendOtp.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })

            .addCase(verifyOtp.fulfilled, (state, action: PayloadAction<string>) => {
                state.resetToken = action.payload;
                state.error = null;
            })
            .addCase(verifyOtp.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })

            .addCase(resetPassword.fulfilled, (state, action: PayloadAction<string>) => {
                state.successMessage = action.payload;
                state.resetToken = null;
                state.error = null;
            })
            .addCase(resetPassword.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })

            // Fetch All Admins
            .addCase(fetchAllAdmins.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllAdmins.fulfilled, (state) => {
                state.loading = false;
               // state.admins = action.payload;
            })
            .addCase(fetchAllAdmins.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Admin By ID
            .addCase(fetchAdminById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminById.fulfilled, (state) => {
                state.loading = false;
               // state.currentAdmin = action.payload;
            })
            .addCase(fetchAdminById.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Toggle Suspend
            .addCase(toggleSuspendAdmin.fulfilled, (state, action: PayloadAction<{ id: string; message: string }>) => {
                // state.admins = state.admins.map((admin) =>
                //     admin._id === action.payload.id
                //         ? { ...admin, isSuspended: !admin.isSuspended }
                //         : admin
                // );
                state.successMessage = action.payload.message;
            })
            .addCase(toggleSuspendAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })

            // Soft Delete
            .addCase(deleteAdmin.fulfilled, (state, action: PayloadAction<{ id: string; message: string }>) => {
                //state.admins = state.admins.filter((admin) => admin._id !== action.payload.id);
                state.successMessage = action.payload.message;
            })
            .addCase(deleteAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })


            .addCase(updateSelfAdmin.fulfilled, (state) => {
               // state.currentAdmin = action.payload;
                state.successMessage = "Admin profile updated successfully";
            })
            .addCase(updateSelfAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            })


            .addCase(addAdmin.fulfilled, (state) => {
                //state.admins.push(action.payload);
                state.successMessage = "Admin created successfully";
            })
            .addCase(addAdmin.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload;
            });
    },
});

export const { logoutAdmin, clearAuthState } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;