import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

export interface ClassData {
    _id: string;
    title: string;
    course: string;
    courseId: { _id: string; title?: string; name?: string };
    departmentId: { _id: string; title?: string; name?: string };
    teacherId: { _id: string; firstName?: string; lastName?: string };
    gradeId: { _id: string; title?: string; name?: string };
    date: string;
    time: string;
    duration: number;
    status: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
    createdAt: string;
    updatedAt: string;
    data: {
        _id: string;
        title: string;
        course: string;
        courseId: { _id: string; title?: string; name?: string };
        departmentId: { _id: string; title?: string; name?: string };
        teacherId: { _id: string; firstName?: string; lastName?: string };
        gradeId: { _id: string; title?: string; name?: string };
        date: string;
        time: string;
        duration: number;
        status: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
        createdAt: string;
        updatedAt: string;
    }

}

export interface ClassFormInput {
    title: string;
    course: string;
    courseId: string;
    departmentId: string;
    teacherId: string;
    gradeId: string;
    date: string;
    time: string;
    duration: number;
    status?: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
}

interface AdminClassesState {
    classes: ClassData[];
    selectedClass: ClassData | null;
    loading: boolean;
    error: string | null;
}

const initialState: AdminClassesState = {
    classes: [],
    selectedClass: null,
    loading: false,
    error: null,
};

const API_URL = `${BASE_URL}/api/admin-classes`;

export const fetchClasses = createAsyncThunk<ClassData[], void, { rejectValue: string }>(
    'adminClasses/fetchClasses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get<ClassData[]>(API_URL);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
        }
    }
);

export const fetchClassById = createAsyncThunk<ClassData, string, { rejectValue: string }>(
    'adminClasses/fetchClassById',
    async (classId, { rejectWithValue }) => {
        try {
            const response = await axios.get<ClassData>(`${API_URL}/${classId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to fetch class ${classId}`);
        }
    }
);

export const createClass = createAsyncThunk<ClassData, ClassFormInput, { rejectValue: string }>(
    'adminClasses/createClass',
    async (newClassData, { rejectWithValue }) => {
        try {
            const response = await axios.post<ClassData>(API_URL, newClassData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create class');
        }
    }
);

export const updateClass = createAsyncThunk<ClassData, { id: string; data: Partial<ClassFormInput> }, { rejectValue: string }>(
    'adminClasses/updateClass',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axios.put<ClassData>(`${API_URL}/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to update class ${id}`);
        }
    }
);

export const deleteClass = createAsyncThunk<string, string, { rejectValue: string }>(
    'adminClasses/deleteClass',
    async (classId, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/${classId}`);
            return classId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to delete class ${classId}`);
        }
    }
);

const adminClassesSlice = createSlice({
    name: 'adminClasses',
    initialState,
    reducers: {
        clearSelectedClass: (state) => {
            state.selectedClass = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchClasses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassData[]>) => {
                state.loading = false;
                state.classes = action.payload;
            })
            .addCase(fetchClasses.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error fetching classes';
            })

            .addCase(fetchClassById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.selectedClass = null;
            })
            .addCase(fetchClassById.fulfilled, (state, action: PayloadAction<ClassData>) => {
                state.loading = false;
                state.selectedClass = action.payload;
            })
            .addCase(fetchClassById.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error fetching single class';
            })

            .addCase(createClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action: PayloadAction<ClassData>) => {
                state.loading = false;
                //state.classes.push(action.payload);
            })
            .addCase(createClass.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error creating class';
            })

            .addCase(updateClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateClass.fulfilled, (state, action: PayloadAction<ClassData>) => {
                state.loading = false;
                // const index = state.classes.findIndex(cls => cls._id === action.payload._id);
                // if (index !== -1) {
                //     state.classes[index] = action.payload;
                // }
                // if (state.selectedClass && state.selectedClass._id === action.payload._id) {
                //     state.selectedClass = action.payload;
                // }
            })
            .addCase(updateClass.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error updating class';
            })

            .addCase(deleteClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteClass.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                // state.classes = state.classes.filter(cls => cls._id !== action.payload);
                // if (state.selectedClass && state.selectedClass._id === action.payload) {
                //     state.selectedClass = null;
                // }
            })
            .addCase(deleteClass.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error deleting class';
            });
    },
});

export const { clearSelectedClass } = adminClassesSlice.actions;
export default adminClassesSlice.reducer;