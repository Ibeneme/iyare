import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../baseurl";

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

// === ASYNC THUNKS ===

// Create Grade
// Modify response structure
interface GradeResponse {
    success: boolean;
    data: Grade;
  }
  
  // Then update your thunk like this:
  export const createGrade = createAsyncThunk<
    GradeResponse,
    { title: string; description: string },
    { rejectValue: string }
  >("grades/createGrade", async ({ title, description }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/grades`, { title, description });
      return response.data as GradeResponse;
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
        const response = await axios.get(`${BASE_URL}/api/admin/grades`);
        return response.data.data as Grade[];
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
        const response = await axios.get(`${BASE_URL}/api/admin/grades/${id}`);
        return response.data.data as Grade;
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
        const response = await axios.put(`${BASE_URL}/api/admin/grades/${id}`, { title, description });
        return response.data.data as Grade;
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
        await axios.delete(`${BASE_URL}/api/admin/grades/${id}`);
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
        builder.addCase(createGrade.fulfilled, (state, action) => {
            state.loading = false;
            state.grades.unshift(action.payload as any);
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
        builder.addCase(getGrades.fulfilled, (state, action) => {
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
        builder.addCase(getGradeById.fulfilled, (state, action) => {
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
        builder.addCase(updateGrade.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.grades.findIndex((g) => g._id === action.payload._id);
            if (index !== -1) {
                state.grades[index] = action.payload;
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
        builder.addCase(deleteGrade.fulfilled, (state, action) => {
            state.loading = false;
            state.grades = state.grades.filter((g) => g._id !== action.payload);
        });
        builder.addCase(deleteGrade.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Delete failed";
        });
    },
});

export const { clearSelectedGrade } = gradeSlice.actions;
export default gradeSlice.reducer;