import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// --- Change 1: Import the configured axiosInstance ---
import axiosInstance from "../axiosInstance";

// Types
export interface Grade {
    _id: string;
    title: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

interface GradeState {
    grades: Grade[];
    selectedGrade: Grade | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: GradeState = {
    grades: [],
    selectedGrade: null,
    loading: false,
    error: null,
};

// --- API Path ---
const API_BASE = "/api/admin/grades"; // Relative path used by axiosInstance

// === ASYNC THUNKS (Refactored to use axiosInstance) ===

// Create Grade
// We will use the Grade interface directly for the fulfilled payload, 
// assuming the API response wrapper is handled, or just use the data property.
export const createGrade = createAsyncThunk<
    Grade, // Expected payload is the created Grade object
    { title: string; description: string },
    { rejectValue: string }
>("grades/createGrade", async ({ title, description }, { rejectWithValue }) => {
    try {
        // Use axiosInstance
        const response = await axiosInstance.post<{ data: Grade }>(API_BASE, { title, description });
        return response.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to create grade");
    }
});

// Get All Grades
export const getGrades = createAsyncThunk<
    Grade[],
    void,
    { rejectValue: string }
>("grades/getGrades", async (_, { rejectWithValue }) => {
    try {
        // Use axiosInstance
        const response = await axiosInstance.get<{ data: Grade[] }>(API_BASE);
        return response.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch grades");
    }
});

// Get Grade by ID
export const getGradeById = createAsyncThunk<
    Grade,
    string,
    { rejectValue: string }
>("grades/getGradeById", async (id, { rejectWithValue }) => {
    try {
        // Use axiosInstance
        const response = await axiosInstance.get<{ data: Grade }>(`${API_BASE}/${id}`);
        return response.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch grade");
    }
});

// Update Grade
export const updateGrade = createAsyncThunk<
    Grade,
    { id: string; title: string; description: string },
    { rejectValue: string }
>("grades/updateGrade", async ({ id, title, description }, { rejectWithValue }) => {
    try {
        // Use axiosInstance
        const response = await axiosInstance.put<{ data: Grade }>(`${API_BASE}/${id}`, { title, description });
        return response.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to update grade");
    }
});

// Delete Grade
export const deleteGrade = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>("grades/deleteGrade", async (id, { rejectWithValue }) => {
    try {
        // Use axiosInstance
        await axiosInstance.delete(`${API_BASE}/${id}`);
        return id;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to delete grade");
    }
});

// === SLICE ===

const gradeSlice = createSlice({
    name: "grades",
    initialState,
    reducers: {
        clearSelectedGrade(state) {
            state.selectedGrade = null;
        },
    },
    extraReducers: (builder) => {
        // Create
        builder.addCase(createGrade.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        // Action payload is now Grade, not GradeResponse
        builder.addCase(createGrade.fulfilled, (state, action: PayloadAction<Grade>) => {
            state.loading = false;
            state.grades.unshift(action.payload);
        });
        builder.addCase(createGrade.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Create failed";
        });

        // Get All
        builder.addCase(getGrades.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getGrades.fulfilled, (state, action: PayloadAction<Grade[]>) => {
            state.loading = false;
            state.grades = action.payload;
        });
        builder.addCase(getGrades.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Fetch failed";
        });

        // Get By ID
        builder.addCase(getGradeById.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getGradeById.fulfilled, (state, action: PayloadAction<Grade>) => {
            state.loading = false;
            state.selectedGrade = action.payload;
        });
        builder.addCase(getGradeById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Fetch failed";
        });

        // Update
        builder.addCase(updateGrade.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(updateGrade.fulfilled, (state, action: PayloadAction<Grade>) => {
            state.loading = false;
            const index = state.grades.findIndex((g) => g._id === action.payload._id);
            if (index !== -1) {
                state.grades[index] = action.payload;
            }
            if (state.selectedGrade && state.selectedGrade._id === action.payload._id) {
                state.selectedGrade = action.payload;
            }
        });
        builder.addCase(updateGrade.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Update failed";
        });

        // Delete
        builder.addCase(deleteGrade.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deleteGrade.fulfilled, (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.grades = state.grades.filter((g) => g._id !== action.payload);
            if (state.selectedGrade && state.selectedGrade._id === action.payload) {
                state.selectedGrade = null;
            }
        });
        builder.addCase(deleteGrade.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Delete failed";
        });
    },
});

export const { clearSelectedGrade } = gradeSlice.actions;
export default gradeSlice.reducer;