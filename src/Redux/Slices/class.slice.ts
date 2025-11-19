import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance';


interface TeacherInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface SubjectInfo {
    _id: string;
    name: string;
    code: string;
    description?: string;
}

interface ClassModel {
    _id: string;
    title: string;
    subjectId: SubjectInfo | string;
    teacherId: TeacherInfo | string;
    studentIds: string[];
    date: string;
    time: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
}

interface ClassState {
    classes: ClassModel[];
    currentClass: ClassModel | null;
    loading: boolean;
    error: string | null;
}

const initialState: ClassState = {
    classes: [],
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

export const fetchClass = createAsyncThunk(
    'class/fetchClass',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/class/class`);
            log('RES', 'Fetched classes', { count: response.data.data.length });
            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch classes', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

export const fetchClasses = createAsyncThunk(
    'class/fetchAll',
    async (subjectId?: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/class/class/${subjectId}`);
            log('RES', 'Fetched classes', { count: response.data.data.length });
            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch classes', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

export const fetchClassesByUser = createAsyncThunk(
    "class/fetchByUser",
    async (_, { rejectWithValue }) => {
        log("REQ", "Fetching classes by user");

        try {
            const response = await axiosInstance.get(`/api/class/class/by-user`);
            log("RES", "Fetched classes by user", { count: response.data.data.length });

            return response.data.data as ClassModel[];
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Network error";
            log("ERR", "Failed to fetch classes by user", {
                error: msg,
                status: err.response?.status,
            });
            return rejectWithValue(msg);
        }
    }
);

export const fetchClassById = createAsyncThunk(
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


export const createClass = createAsyncThunk(
    'class/create',
    async (classData: Partial<ClassModel>, { rejectWithValue }) => {
        log('REQ', 'Creating class', classData);
        try {
            const response = await axiosInstance.post('/api/class/class', classData);
            log('RES', 'Class created', { id: response.data.data._id, title: response.data.data.title });
            return response.data.data as ClassModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to create class';
            log('ERR', 'Create class failed', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);


export const updateClass = createAsyncThunk(
    'class/update',
    async ({ id, data }: { id: string; data: Partial<ClassModel> }, { rejectWithValue }) => {
        log('REQ', `Updating class ID: ${id}`, data);
        try {
            const response = await axiosInstance.put(`/api/class/class/${id}`, data);
            log('RES', 'Class updated', { id, title: response.data.data.title });
            return response.data.data as ClassModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update class';
            log('ERR', 'Update failed', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);


export const deleteClass = createAsyncThunk(
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
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch All
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

        // Fetch One fetchClass
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

        // Create
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

        // Update
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
            })
        // Delete
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

export const { clearCurrentClass, clearError } = classSlice.actions;
export default classSlice.reducer;