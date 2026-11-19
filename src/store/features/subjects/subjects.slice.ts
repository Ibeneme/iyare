import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axiosInstance'; // Centralized API client

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

export interface Subject {
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
    gradeLevelTitle?: any;
    gradeLevelId?: any;
}

export interface SubjectMembersPayload {
    subjectId: string;
    teacherIds?: string[];
    studentIds?: string[];
    action?: 'add' | 'remove';
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

// --- Async Thunks (CRUD & Member Management Operations) ---

/**
 * Fetch all subjects relevant to the authenticated user's token.
 * Note: Endpoint is `/api/subject/token`.
 */
export const fetchSubjects = createAsyncThunk<
    Subject[],
    void,
    { rejectValue: string }
>('subject/fetchAll', async (_, { rejectWithValue }) => {
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

/**
 * Fetch a single subject by its ID.
 */
export const fetchSubjectById = createAsyncThunk<
    Subject,
    string,
    { rejectValue: string }
>('subject/fetchById', async (id: string, { rejectWithValue }) => {
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

/**
 * Create a new subject.
 */
export const createSubject = createAsyncThunk<
    Subject,
    Partial<Subject>,
    { rejectValue: string }
>(
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

/**
 * Update an existing subject by ID.
 */
export const updateSubject = createAsyncThunk<
    Subject,
    { id: string; data: Partial<Subject> },
    { rejectValue: string }
>(
    'subject/update',
    async ({ id, data }, { rejectWithValue }) => {
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

/**
 * Delete a subject by ID.
 */
export const deleteSubject = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>('subject/delete', async (id: string, { rejectWithValue }) => {
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

/**
 * Add or remove teachers and/or students on a subject.
 */
export const updateSubjectMembers = createAsyncThunk<
    Subject,
    SubjectMembersPayload,
    { rejectValue: string }
>(
    'subject/updateMembers',
    async ({ subjectId, teacherIds = [], studentIds = [], action = 'add' }, { rejectWithValue }) => {
        log('REQ', `${action === 'remove' ? 'Removing' : 'Adding'} subject members`, {
            subjectId,
            teacherIds,
            studentIds,
            action,
        });
        try {
            const response = await axiosInstance.post(`/api/subject/${subjectId}/members`, {
                teacherIds,
                studentIds,
                action,
            });
            log('RES', 'Subject members updated', {
                id: response.data.data?._id || subjectId,
                action,
            });
            return response.data.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update subject members';
            log('ERR', 'Update subject members failed', {
                subjectId,
                action,
                error: msg,
                status: err.response?.status,
            });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Convenience thunk: Add teachers and/or students to a subject.
 */
export const addSubjectMembers = createAsyncThunk<
    Subject,
    Omit<SubjectMembersPayload, 'action'>,
    { rejectValue: string }
>('subject/addMembers', async (payload, { dispatch, rejectWithValue }) => {
    const result = await dispatch(updateSubjectMembers({ ...payload, action: 'add' }));
    if (updateSubjectMembers.rejected.match(result)) {
        return rejectWithValue(result.payload || 'Failed to add subject members');
    }
    return result.payload;
});

/**
 * Convenience thunk: Remove teachers and/or students from a subject.
 */
export const removeSubjectMembers = createAsyncThunk<
    Subject,
    Omit<SubjectMembersPayload, 'action'>,
    { rejectValue: string }
>('subject/removeMembers', async (payload, { dispatch, rejectWithValue }) => {
    const result = await dispatch(updateSubjectMembers({ ...payload, action: 'remove' }));
    if (updateSubjectMembers.rejected.match(result)) {
        return rejectWithValue(result.payload || 'Failed to remove subject members');
    }
    return result.payload;
});

const syncUpdatedSubjectInState = (state: SubjectState, updated: Subject | undefined) => {
    if (!updated?._id) return;
    const index = state.subjects.findIndex((s) => s._id === updated._id);
    if (index !== -1) state.subjects[index] = updated;
    if (state.currentSubject?._id === updated._id) {
        state.currentSubject = updated;
    }
};

// --- Slice ---
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
                syncUpdatedSubjectInState(state, action.payload);
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

        // Update / Add / Remove Subject Members
        builder
            .addCase(updateSubjectMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSubjectMembers.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                syncUpdatedSubjectInState(state, action.payload);
            })
            .addCase(updateSubjectMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addSubjectMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addSubjectMembers.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                syncUpdatedSubjectInState(state, action.payload);
            })
            .addCase(addSubjectMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(removeSubjectMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeSubjectMembers.fulfilled, (state, action: PayloadAction<Subject>) => {
                state.loading = false;
                syncUpdatedSubjectInState(state, action.payload);
            })
            .addCase(removeSubjectMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentSubject, clearError } = subjectSlice.actions;
export default subjectSlice.reducer;