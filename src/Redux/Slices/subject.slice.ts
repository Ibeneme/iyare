import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance';


interface Teacher {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Child {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Class {
    _id: string;
    name: string;
    gradeLevel: string;
}

interface Subject {
    _id: string;
    name: string;
    code: string;
    description?: string;
    gradeLevel: string;
    isActive: boolean;
    teachers: Teacher[];
    children: Child[];
    classes: Class[];
    createdAt: string;
    updatedAt: string;
}

interface SubjectState {
    subjects: Subject[];
    currentSubject: Subject | null;
    loading: boolean;
    error: string | null;
}

const initialState: SubjectState = {
    subjects: [],
    currentSubject: null,
    loading: false,
    error: null,
};

// Helper: Log with timestamp and country
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
    const prefix = `[${now}] [NG] SUBJECT SLICE`;
    const color = type === 'REQ' ? '\x1b[36m' : type === 'RES' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${prefix} [${type}] ${action}${reset}`, data || '');
};

// Async Thunks with logging
export const fetchSubjects = createAsyncThunk('subject/fetchAll', async (_, { rejectWithValue }) => {
    log('REQ', 'Fetching all subjects');
    try {
        const response = await axiosInstance.get('/api/subject/token');
        log('RES', 'Fetched subjects', { count: response.data.data.length });
        return response.data.data;
    } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Network error';
        log('ERR', 'Failed to fetch subjects', { error: msg, status: err.response?.status });
        return rejectWithValue(msg);
    }
});

export const fetchSubjectById = createAsyncThunk('subject/fetchById', async (id: string, { rejectWithValue }) => {
    log('REQ', `Fetching subject by ID: ${id}`);
    try {
        const response = await axiosInstance.get(`/api/subject/${id}`);
        log('RES', `Fetched subject: ${response.data.data.name}`, { id });
        return response.data.data;
    } catch (err: any) {
        const msg = err.response?.data?.message || 'Subject not found';
        log('ERR', 'Failed to fetch subject', { id, error: msg, status: err.response?.status });
        return rejectWithValue(msg);
    }
});

export const createSubject = createAsyncThunk(
    'subject/create',
    async (subjectData: Partial<Subject>, { rejectWithValue }) => {
        log('REQ', 'Creating subject', subjectData);
        try {
            const response = await axiosInstance.post('/api/subject', subjectData);
            log('RES', 'Subject created', { id: response.data.data._id, name: response.data.data.name });
            return response.data.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to create subject';
            log('ERR', 'Create subject failed', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

export const updateSubject = createAsyncThunk(
    'subject/update',
    async ({ id, data }: { id: string; data: Partial<Subject> }, { rejectWithValue }) => {
        log('REQ', `Updating subject ID: ${id}`, data);
        try {
            const response = await axiosInstance.put(`/api/subject/${id}`, data);
            log('RES', 'Subject updated', { id, name: response.data.data.name });
            return response.data.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update subject';
            log('ERR', 'Update failed', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

export const deleteSubject = createAsyncThunk('subject/delete', async (id: string, { rejectWithValue }) => {
    log('REQ', `Deleting subject ID: ${id}`);
    try {
        await axiosInstance.delete(`/api/subject/${id}`);
        log('RES', 'Subject deleted', { id });
        return id;
    } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to delete subject';
        log('ERR', 'Delete failed', { id, error: msg, status: err.response?.status });
        return rejectWithValue(msg);
    }
});

// Slice
const subjectSlice = createSlice({
    name: 'subject',
    initialState,
    reducers: {
        clearCurrentSubject: (state) => {
            state.currentSubject = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch All
        builder
            .addCase(fetchSubjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubjects.fulfilled, (state, action: PayloadAction<Subject[]>) => {
                state.loading = false;
                state.subjects = action.payload;
            })
            .addCase(fetchSubjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch One
        builder
            .addCase(fetchSubjectById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubjectById.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                state.currentSubject = action.payload;
            })
            .addCase(fetchSubjectById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createSubject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSubject.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                state.subjects.push(action.payload);
            })
            .addCase(createSubject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateSubject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSubject.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                const index = state.subjects.findIndex((s) => s._id === action.payload._id);
                if (index !== -1) state.subjects[index] = action.payload;
                if (state.currentSubject?._id === action.payload._id) {
                    state.currentSubject = action.payload;
                }
            })
            .addCase(updateSubject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteSubject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSubject.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.subjects = state.subjects.filter((s) => s._id !== action.payload);
                if (state.currentSubject?._id === action.payload) {
                    state.currentSubject = null;
                }
            })
            .addCase(deleteSubject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentSubject, clearError } = subjectSlice.actions;
export default subjectSlice.reducer;