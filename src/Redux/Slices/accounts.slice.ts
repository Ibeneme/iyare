// src/store/api/accountsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    [key: string]: any;
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

// GET user details
export const fetchUser = createAsyncThunk(
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

// UPDATE user details
export const updateUser = createAsyncThunk(
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
            state.userType = action.payload.userType;
            state.data = [action.payload.data]; // updated user returned as array for consistency
        });
        builder.addCase(updateUser.rejected, (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const { clearAccountsState } = accountsSlice.actions;
export default accountsSlice.reducer;