// src/store/api/accountsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance'; // Centralized API client

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    [key: string]: any; // Allows for dynamic user properties (e.g., role, children, etc.)
}

interface AccountsState {
    userType: 'student' | 'parent' | null;
    data: User[];
    loading: boolean;
    error: string | null;
}

const initialState: AccountsState = {
    userType: null,
    data: [],
    loading: false,
    error: null,
};

// -------------------- ASYNC THUNKS --------------------

/**
 * GET user details of the currently authenticated user.
 * Assumes axiosInstance handles the Authorization token via interceptors.
 */
export const fetchUser = createAsyncThunk<
    any, // Expected fulfilled payload: { userType: string, data: User[] }
    void,
    { rejectValue: string }
>(
    'accounts/fetchUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/api/accounts/me');
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

/**
 * UPDATE user details for the currently authenticated user.
 * Assumes axiosInstance handles the Authorization token.
 */
export const updateUser = createAsyncThunk<
    any, // Expected fulfilled payload: { userType: string, data: User }
    Partial<User>, // Data to update
    { rejectValue: string }
>(
    'accounts/updateUser',
    async (updateData: Partial<User>, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put('/api/accounts/update', updateData);
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// -------------------- SLICE --------------------
const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        /**
         * Clears all non-initial state data (useful for logout).
         */
        clearAccountsState: (state) => {
            state.userType = null;
            state.data = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // -------- fetchUser --------
        builder.addCase(fetchUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUser.fulfilled, (state, action: PayloadAction<any>) => {
            state.loading = false;
            // Assuming the payload structure is { userType: string, data: User[] }
            state.userType = action.payload.userType;
            state.data = action.payload.data;
        });
        builder.addCase(fetchUser.rejected, (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = action.payload;
        });

        // -------- updateUser --------
        builder.addCase(updateUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(updateUser.fulfilled, (state, action: PayloadAction<any>) => {
            state.loading = false;
            // Assuming the payload structure is { userType: string, data: User }
            state.userType = action.payload.userType;
            // Store the updated single user object inside the 'data' array for consistency
            state.data = Array.isArray(action.payload.data) ? action.payload.data : [action.payload.data];
        });
        builder.addCase(updateUser.rejected, (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const { clearAccountsState } = accountsSlice.actions;
export default accountsSlice.reducer;