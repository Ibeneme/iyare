import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance'; // Import the centralized axios instance

// --- Interfaces ---
export interface TeacherInfo {
    _id: string;
    name: string;
    email: string;
    certifications?: string[];
    courseIds?: string[];
    createdAt: string;
    isSuspended: boolean;
}

interface DashboardTeachersState {
    loading: boolean;
    error: string | null;
    data: TeacherInfo[];
}

// --- Initial state ---
const initialState: DashboardTeachersState = {
    loading: false,
    error: null,
    data: [],
};

// Base URL (relative path only, handled by axiosInstance)
const API_URL = `/api/admin-classes/dashboard-teachers`;

// --- Async thunk to fetch all teachers (Refactored) ---
export const fetchTeachers = createAsyncThunk<
    TeacherInfo[],
    void,
    { rejectValue: string }
>('dashboardTeachers/fetch', async (_, { rejectWithValue }) => {
    try {
        // Use axiosInstance; token and base URL are handled by interceptors
        const response = await axiosInstance.get<{ data: TeacherInfo[] }>(API_URL);

        return response.data.data;
    } catch (error: any) {
        // Interceptors handle token/server error logging; thunk handles payload
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch teachers');
    }
});

// --- Slice ---
const dashboardTeachersSlice = createSlice({
    name: 'dashboardTeachers',
    initialState,
    reducers: {
        clearTeachers: (state) => {
            state.data = [];
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTeachers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeachers.fulfilled, (state, action: PayloadAction<TeacherInfo[]>) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchTeachers.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch teachers';
            });
    },
});

export const { clearTeachers } = dashboardTeachersSlice.actions;
export default dashboardTeachersSlice.reducer;