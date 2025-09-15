import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

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

// --- Helper to get token ---
const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('token') || null;
    } catch {
        return null;
    }
};

// --- Async thunk to fetch all teachers ---
export const fetchTeachers = createAsyncThunk<
    TeacherInfo[],
    void,
    { rejectValue: string }
>('dashboardTeachers/fetch', async (_, { rejectWithValue }) => {
    try {
        const token = getAuthToken();
        if (!token) return rejectWithValue('No auth token found');

        const response = await axios.get(`${BASE_URL}/api/admin-classes/dashboard-teachers`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data.data;
    } catch (error: any) {
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