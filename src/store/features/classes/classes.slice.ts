import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axiosInstance'; // Centralized API client

export interface ParentInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export interface SubjectStudentInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    parentId?: string;
    isSubscribed?: boolean;
    subjects?: string[];
    parents?: ParentInfo[];
}

export type ClassScope = 'general' | 'specific';

export interface TeacherInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isDeleted?: boolean;
    deleted?: boolean;
    deletedAt?: string | null;
}

export interface SubjectInfo {
    _id: string;
    name: string;
    code: string;
    description?: string;
    teachers?: Array<TeacherInfo | string>;
}

export interface ClassModel {
    _id: string;
    title: string;
    subjectId: SubjectInfo | string;
    teacherId?: TeacherInfo | string | null;
    teacherIds?: Array<TeacherInfo | string>;
    studentIds: Array<SubjectStudentInfo | string>;
    scope?: ClassScope;
    isGeneral?: boolean;
    audience?: 'grade' | 'groups' | 'students';
    gradeId?: string;
    groupIds?: string[];
    schedules?: any[];
    scheduleDisplay?: string;
    studentCount?: number;
    date?: string;
    time?: string;
    duration?: number; // Duration in minutes/hours
    createdAt: string;
    updatedAt: string;
    status: string;
}

export interface CreateOrUpdateClassPayload {
    title?: string;
    subjectId?: string;
    teacherId?: string | null;
    teacherIds?: string[];
    scope?: ClassScope;
    isGeneral?: boolean;
    studentIds?: string[];
    students?: SubjectStudentInfo[];
    audience?: 'grade' | 'groups' | 'students';
    gradeId?: string;
    groupIds?: string[];
    schedules?: any[];
    date?: string;
    time?: string;
    duration?: number;
}

interface ClassState {
    classes: ClassModel[];
    subjectStudents: SubjectStudentInfo[];
    studentsLoading: boolean;
    currentClass: ClassModel | null;
    loading: boolean;
    error: string | null;
}

const initialState: ClassState = {
    classes: [],
    subjectStudents: [],
    studentsLoading: false,
    currentClass: null,
    loading: false,
    error: null,
};

// --- LOGGING HELPER ---
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
    const prefix = `[${now}] [NG] CLASS SLICE`;
    const color = type === 'REQ' ? '\x1b[36m' : type === 'RES' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`\x1b[35m${prefix}\x1b[0m ${color}[${type}] ${action}${reset}`, data || '');
};

// --- ASYNC THUNKS (CRUD & Subject Students) ---

/**
 * Fetch all students (with details and parent info) for a given subject.
 */
export const fetchSubjectStudents = createAsyncThunk<
    SubjectStudentInfo[],
    string,
    { rejectValue: string }
>(
    'class/fetchSubjectStudents',
    async (subjectId: string, { rejectWithValue }) => {
        log('REQ', `Fetching students for subject ID: ${subjectId}`);
        try {
            const response = await axiosInstance.get(`/api/class/class/students/${subjectId}`);
            const list = (response.data.data || []) as SubjectStudentInfo[];
            log('RES', `Fetched ${list.length} students for subject`, { subjectId });
            return list;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch subject students';
            log('ERR', 'Failed to fetch subject students', { subjectId, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Fetch all classes (Generic/Admin view).
 */
export const fetchClass = createAsyncThunk<
    ClassModel[],
    void,
    { rejectValue: string }
>(
    'class/fetchClass',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/class/class`);
            log('RES', 'Fetched classes (All)', { count: response.data.data.length });
            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch classes (All)', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Fetch classes, filtered by subject ID.
 */
export const fetchClasses = createAsyncThunk<
    ClassModel[],
    string | undefined,
    { rejectValue: string }
>(
    'class/fetchAll',
    async (subjectId, { rejectWithValue }) => {
        try {
            const endpoint = subjectId ? `/api/class/class/${subjectId}` : `/api/class/class`;
            const response = await axiosInstance.get(endpoint);
            log('RES', `Fetched classes by subject: ${subjectId || 'None'}`, { count: response.data.data.length });
            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch classes by subject', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Fetch classes relevant to the currently logged-in user.
 */
export const fetchClassesByUser = createAsyncThunk<
    ClassModel[],
    void,
    { rejectValue: string }
>(
    'class/fetchByUser',
    async (_, { rejectWithValue }) => {
        log('REQ', 'Fetching classes by user');
        try {
            const response = await axiosInstance.get(`/api/class/class/by-user`);
            log('RES', 'Fetched classes by user', { count: response.data.data.length });
            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch classes by user', {
                error: msg,
                status: err.response?.status,
            });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Fetch a single class by its ID.
 */
export const fetchClassById = createAsyncThunk<
    ClassModel,
    string,
    { rejectValue: string }
>(
    'class/fetchById',
    async (id: string, { rejectWithValue }) => {
        log('REQ', `Fetching class by ID: ${id}`);
        try {
            const response = await axiosInstance.get(`/api/class/class/${id}`);
            log('RES', `Fetched class: ${response.data.data.title}`, { id });
            return response.data.data as ClassModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Class not found';
            log('ERR', 'Failed to fetch class', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Create a new class (general for all subject students or specific for selected students)
 * with one or multiple assigned teachers.
 */
export const createClass = createAsyncThunk<
    ClassModel,
    CreateOrUpdateClassPayload,
    { rejectValue: string }
>(
    'class/create',
    async (classData: CreateOrUpdateClassPayload, { rejectWithValue }) => {
        log('REQ', 'Creating class', classData);
        try {
            const response = await axiosInstance.post('/api/class/class', classData);
            log('RES', 'Class created', {
                id: response.data.data._id,
                title: response.data.data.title,
                scope: response.data.data.scope,
                teacherIds: response.data.data.teacherIds,
            });
            return response.data.data as ClassModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to create class';
            log('ERR', 'Create class failed', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Update an existing class by ID.
 */
export const updateClass = createAsyncThunk<
    ClassModel,
    { id: string; data: CreateOrUpdateClassPayload },
    { rejectValue: string }
>(
    'class/update',
    async ({ id, data }, { rejectWithValue }) => {
        log('REQ', `Updating class ID: ${id}`, data);
        try {
            const response = await axiosInstance.put(`/api/class/class/${id}`, data);
            log('RES', 'Class updated', {
                id,
                title: response.data.data.title,
                scope: response.data.data.scope,
                teacherIds: response.data.data.teacherIds,
            });
            return response.data.data as ClassModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update class';
            log('ERR', 'Update failed', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Delete a class by ID.
 */
export const deleteClass = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>(
    'class/delete',
    async (id: string, { rejectWithValue }) => {
        log('REQ', `Deleting class ID: ${id}`);
        try {
            await axiosInstance.delete(`/api/class/class/${id}`);
            log('RES', 'Class deleted', { id });
            return id;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete class';
            log('ERR', 'Delete failed', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

const classSlice = createSlice({
    name: 'class',
    initialState,
    reducers: {
        clearCurrentClass: (state) => {
            state.currentClass = null;
        },
        clearSubjectStudents: (state) => {
            state.subjectStudents = [];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // --- fetchSubjectStudents ---
        builder
            .addCase(fetchSubjectStudents.pending, (state) => {
                state.studentsLoading = true;
                state.error = null;
            })
            .addCase(fetchSubjectStudents.fulfilled, (state, action: PayloadAction<SubjectStudentInfo[]>) => {
                state.studentsLoading = false;
                state.subjectStudents = action.payload;
            })
            .addCase(fetchSubjectStudents.rejected, (state, action) => {
                state.studentsLoading = false;
                state.error = action.payload as string;
            });

        // --- fetchClasses (By Subject ID) ---
        builder
            .addCase(fetchClasses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassModel[]>) => {
                state.loading = false;
                state.classes = action.payload;
            })
            .addCase(fetchClasses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- fetchClass (All) ---
        builder
            .addCase(fetchClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClass.fulfilled, (state, action: PayloadAction<ClassModel[]>) => {
                state.loading = false;
                state.classes = action.payload;
            })
            .addCase(fetchClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- fetchClassesByUser ---
        builder
            .addCase(fetchClassesByUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClassesByUser.fulfilled, (state, action: PayloadAction<ClassModel[]>) => {
                state.loading = false;
                state.classes = action.payload;
            })
            .addCase(fetchClassesByUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- fetchClassById (Fetch One) ---
        builder
            .addCase(fetchClassById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClassById.fulfilled, (state, action: PayloadAction<ClassModel>) => {
                state.loading = false;
                state.currentClass = action.payload;
            })
            .addCase(fetchClassById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- Create ---
        builder
            .addCase(createClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action: PayloadAction<ClassModel>) => {
                state.loading = false;
                state.classes.push(action.payload);
            })
            .addCase(createClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- Update ---
        builder
            .addCase(updateClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateClass.fulfilled, (state, action: PayloadAction<ClassModel>) => {
                state.loading = false;
                const index = state.classes.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) state.classes[index] = action.payload;
                if (state.currentClass?._id === action.payload._id) {
                    state.currentClass = action.payload;
                }
            })
            .addCase(updateClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- Delete ---
        builder
            .addCase(deleteClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteClass.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.classes = state.classes.filter((c) => c._id !== action.payload);
                if (state.currentClass?._id === action.payload) {
                    state.currentClass = null;
                }
            })
            .addCase(deleteClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentClass, clearSubjectStudents, clearError } = classSlice.actions;
export default classSlice.reducer;