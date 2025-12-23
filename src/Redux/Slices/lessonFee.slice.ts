import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance'; // Centralized API client


interface StudentInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface PaidInfo {
    status: 'success' | 'failed' | 'pending';
    date: string;
}

export interface LessonFeeModel {
    _id: string;
    studentId: StudentInfo | string;
    payerId?: string;
    planName?: string;
    duration: string;
    amount: number;
    currency: string;
    expired: boolean;
    expiresAt?: string;
    reference?: string;
    paid: PaidInfo;
    createdAt: string;
    updatedAt: string;
}

interface LessonFeeState {
    lessonFees: LessonFeeModel[];
    loading: boolean;
    error: string | null;
}

const initialState: LessonFeeState = {
    lessonFees: [],
    loading: false,
    error: null,
};

// --- LOGGING HELPER (Kept as is for debugging) ---
const log = (type: 'REQ' | 'RES' | 'ERR', action: string, data?: any) => {
    const now = new Date().toLocaleString('en-NG', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    });
    const prefix = `[${now}] [NG] FEE SLICE`;
    const color = type === 'REQ' ? '\x1b[36m' : type === 'RES' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`\x1b[35m${prefix}\x1b[0m ${color}[${type}] ${action}${reset}`, data || '');
};

// --- ASYNC THUNKS ---

/**
 * Fetches lesson fee history relevant to the currently logged-in user (student or parent).
 */
export const fetchLessonFeesByUser = createAsyncThunk<
    LessonFeeModel[], // Return type
    void, // Argument type
    { rejectValue: string }
>(
    'lessonFee/fetchByUser',
    async (_, { rejectWithValue }) => {
        log('REQ', 'Fetching lesson fees by user');
        try {
            // Use axiosInstance to fetch data
            const response = await axiosInstance.get('/api/class/class/lesson-fees/lesson-fees');
            log('RES', 'Fetched lesson fees', { count: response.data.data.length });
            return response.data.data as LessonFeeModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch lesson fees', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

// --- SLICE ---

const lessonFeeSlice = createSlice({
    name: 'lessonFee',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Lesson Fees By User
        builder
            .addCase(fetchLessonFeesByUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLessonFeesByUser.fulfilled, (state, action: PayloadAction<LessonFeeModel[]>) => {
                state.loading = false;
                state.lessonFees = action.payload;
            })
            .addCase(fetchLessonFeesByUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = lessonFeeSlice.actions;
export default lessonFeeSlice.reducer;