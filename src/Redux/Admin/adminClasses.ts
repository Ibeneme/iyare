import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl'; // Ensure BASE_URL is correctly defined

// --- Interfaces ---

// Represents a single class object fetched from the API
export interface ClassData {
    _id: string;
    title: string;
    course: string;
    courseId: { _id: string; title?: string; name?: string };
    departmentId?: { _id: string; title?: string; name?: string }; // Made optional
    teacherId: { _id: string; firstName?: string; lastName?: string };
    gradeId?: { _id: string; title?: string; name?: string }; // Made optional
    date: string;
    time: string;
    duration: number;
    status: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
    createdAt: string;
    updatedAt: string;
    // The 'data' field seems redundant if ClassData is already the main structure.
    // Consider removing it if the API directly returns ClassData.
    // For now, keeping it as optional to match your original interface.
    data?: {
        _id: string;
        title: string;
        course: string;
        courseId: { _id: string; title?: string; name?: string };
        departmentId?: { _id: string; title?: string; name?: string };
        teacherId: { _id: string; firstName?: string; lastName?: string };
        gradeId?: { _id: string; title?: string; name?: string };
        date: string;
        time: string;
        duration: number;
        status: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
        createdAt: string;
        updatedAt: string;
    }
}

// Input type for creating a new class
export interface ClassFormInput {
    title: string;
    course: string;
    courseId: string;
    departmentId?: string; // Made optional
    teacherId: string;
    gradeId?: string; // Made optional
    date: string;
    time: string;
    duration: number;
    status?: 'ongoing' | 'upcoming' | 'finished' | 'canceled';
}

// State shape for the adminClasses slice
interface AdminClassesState {
    classes: ClassData[];
    selectedClass: ClassData | null;
    loading: boolean;
    error: string | null;
}

// --- Initial State ---

const initialState: AdminClassesState = {
    classes: [],
    selectedClass: null,
    teacherClasses: [],
    loading: false,
    error: null,
};

const API_URL = `${BASE_URL}/api/admin-classes`;

// --- Helper function to get the authorization token ---
const getAuthToken = (): string | null => {
    try {
        const token = localStorage.getItem("token");
        console.log(token, 'tokentoken')
        return token || null;
    } catch (error) {
        console.error("Failed to retrieve token from localStorage:", error);
        return null;
    }
};
// --- Async Thunks ---

/**
 * Fetches all classes from the API.
 */
export const fetchClasses = createAsyncThunk<ClassData[], void, { rejectValue: string }>(
    'adminClasses/fetchClasses',
    async (_, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            const response = await axios.get<{ data: ClassData[] }>(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
        }
    }
);

/**
 * Fetches a single class by its ID.
 */
export const fetchClassById = createAsyncThunk<ClassData, string, { rejectValue: string }>(
    'adminClasses/fetchClassById',
    async (classId, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            const response = await axios.get<ClassData>(`${API_URL}/${classId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to fetch class ${classId}`);
        }
    }
);

/**
 * Creates a new class.
 */
export const createClass = createAsyncThunk<ClassData, ClassFormInput, { rejectValue: string }>(
    'adminClasses/createClass',
    async (newClassData, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            const response = await axios.post<ClassData>(API_URL, newClassData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create class');
        }
    }
);

/**
 * Updates an existing class.
 */
export const updateClass = createAsyncThunk<ClassData, { id: string; data: Partial<ClassFormInput> }, { rejectValue: string }>(
    'adminClasses/updateClass',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            const response = await axios.put<ClassData>(`${API_URL}/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to update class ${id}`);
        }
    }
);

/**
 * Deletes a class by its ID.
 */
export const deleteClass = createAsyncThunk<string, string, { rejectValue: string }>(
    'adminClasses/deleteClass',
    async (classId, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            await axios.delete(`${API_URL}/${classId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return classId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || `Failed to delete class ${classId}`);
        }
    }
);


export const fetchTeacherClasses = createAsyncThunk<ClassData[], string, { rejectValue: string }>(
    'adminClasses/fetchTeacherClasses',
    async (teacherId, { rejectWithValue }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                return rejectWithValue('Authentication token not found. Please log in.');
            }

            const response = await axios.get<{ data: ClassData[] }>(
                `${API_URL}/teacher/${teacherId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher classes');
        }
    }
);




// --- Redux Slice ---

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
            // --- fetchClasses ---
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

            // --- fetchClassById ---
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

            // --- createClass ---
            .addCase(createClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action: PayloadAction<ClassData>) => {
                state.loading = false;
                state.classes.unshift(action.payload);
            })
            .addCase(createClass.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error creating class';
            })

            // --- updateClass ---
            .addCase(updateClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateClass.fulfilled, (state, action: PayloadAction<ClassData>) => {
                state.loading = false;
                const index = state.classes.findIndex(cls => cls._id === action.payload._id);
                if (index !== -1) {
                    state.classes[index] = action.payload;
                }
                if (state.selectedClass && state.selectedClass._id === action.payload._id) {
                    state.selectedClass = action.payload;
                }
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
                state.classes = state.classes.filter(cls => cls._id !== action.payload);
                if (state.selectedClass && state.selectedClass._id === action.payload) {
                    state.selectedClass = null;
                }
            })
            .addCase(deleteClass.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error deleting class';
            })

            .addCase(fetchTeacherClasses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeacherClasses.fulfilled, (state, action: PayloadAction<ClassData[]>) => {
                state.loading = false;
                state.teacherClasses = action.payload;
            })
            .addCase(fetchTeacherClasses.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || 'Unknown error fetching teacher classes';
            });

    },
});

export const { clearSelectedClass } = adminClassesSlice.actions;
export default adminClassesSlice.reducer;