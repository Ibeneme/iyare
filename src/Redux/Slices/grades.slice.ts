import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance"; // Centralized API client

// ======================
// TYPES
// ======================
export interface Grade {
    _id: string;
    title: string;
    description?: string;
    subjectIds?: any[]; // Array of subject IDs or possibly Subject objects
    createdAt?: string;
}

export interface Subject {
    _id: string;
    name: string;
    code: string;
    description?: string;
}

export interface GradeState {
    grades: Grade[];
    selectedGrade: Grade | null;
    subjects: Subject[]; // Subjects associated with the selected grade
    loading: boolean;
    error: string | null;
}

const initialState: GradeState = {
    grades: [],
    selectedGrade: null,
    subjects: [],
    loading: false,
    error: null,
};

// ======================
// ASYNC THUNKS (CRUD Operations)
// ======================

// CREATE GRADE
export const createGrade = createAsyncThunk<
    Grade, // Return type
    Partial<Grade>, // Argument type
    { rejectValue: string }
>("grades/create", async (data, thunkAPI) => {
    try {
        const res = await axiosInstance.post("/api/admin/grades", data);
        return res.data.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(
            err.response?.data?.message || "Failed to create grade"
        );
    }
});

// FETCH ALL GRADES
export const fetchGrades = createAsyncThunk<
    Grade[],
    void,
    { rejectValue: string }
>("grades/getAll", async (_, thunkAPI) => {
    try {
        const res = await axiosInstance.get("/api/admin/grades");
        return res.data.data; // Array of Grade objects
    } catch (err: any) {
        return thunkAPI.rejectWithValue("Failed to fetch grades");
    }
});

// FETCH SINGLE GRADE
export const fetchGradeById = createAsyncThunk<
    Grade,
    string, // Grade ID
    { rejectValue: string }
>("grades/getById", async (id: string, thunkAPI) => {
    try {
        const res = await axiosInstance.get(`/api/admin/grades/${id}`);
        return res.data.data; // Single Grade object
    } catch (err: any) {
        return thunkAPI.rejectWithValue("Failed to fetch grade");
    }
});

// UPDATE GRADE
export const updateGrade = createAsyncThunk<
    Grade, // Return type
    { id: string; data: Partial<Grade> }, // Argument type
    { rejectValue: string }
>("grades/update", async ({ id, data }, thunkAPI) => {
    try {
        const res = await axiosInstance.put(`/api/admin/grades/${id}`, data);
        return res.data.data; // updated grade object
    } catch (err: any) {
        return thunkAPI.rejectWithValue(
            err.response?.data?.message || "Failed to update grade"
        );
    }
});

// DELETE GRADE
export const deleteGrade = createAsyncThunk<
    Grade, // Return the deleted grade object to easily filter the state
    string, // Grade ID
    { rejectValue: string }
>("grades/delete", async (id: string, thunkAPI) => {
    try {
        const res = await axiosInstance.delete(`/api/admin/grades/${id}`);
        return res.data.data; // deleted grade object
    } catch (err: any) {
        return thunkAPI.rejectWithValue("Failed to delete grade");
    }
});

// FETCH SUBJECTS FOR A GRADE
export const fetchSubjectsByGrade = createAsyncThunk<
    Subject[],
    string, // Grade ID
    { rejectValue: string }
>("grades/getSubjects", async (gradeId: string, thunkAPI) => {
    try {
        const res = await axiosInstance.get(`/api/grades/grades/subjects/${gradeId}`);
        return res.data.data; // Array of Subject objects
    } catch (err: any) {
        return thunkAPI.rejectWithValue("Failed to fetch subjects for grade");
    }
});


// ======================
// SLICE
// ======================

const gradeSlice = createSlice({
    name: "grades",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            // CREATE GRADE
            .addCase(createGrade.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGrade.fulfilled, (state, action: PayloadAction<Grade>) => {
                state.loading = false;
                state.grades.push(action.payload);
            })
            .addCase(createGrade.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // GET ALL GRADES
            .addCase(fetchGrades.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGrades.fulfilled, (state, action: PayloadAction<Grade[]>) => {
                state.loading = false;
                state.grades = action.payload;
            })
            .addCase(fetchGrades.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // GET GRADE BY ID
            .addCase(fetchGradeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGradeById.fulfilled, (state, action: PayloadAction<Grade>) => {
                state.loading = false;
                state.selectedGrade = action.payload;
            })
            .addCase(fetchGradeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })


            // DELETE GRADE
            .addCase(deleteGrade.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGrade.fulfilled, (state, action: PayloadAction<Grade>) => {
                state.loading = false;

                // remove from list
                state.grades = state.grades.filter((g) => g._id !== action.payload._id);

                // if selected grade, clear it
                if (state.selectedGrade?._id === action.payload._id) {
                    state.selectedGrade = null;
                    state.subjects = [];
                }
            })
            .addCase(deleteGrade.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // UPDATE GRADE
            .addCase(updateGrade.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGrade.fulfilled, (state, action: PayloadAction<Grade>) => {
                state.loading = false;

                // Update grade in list
                state.grades = state.grades.map((g) =>
                    g._id === action.payload._id ? action.payload : g
                );

                // If this grade is selected, update it too
                if (state.selectedGrade?._id === action.payload._id) {
                    state.selectedGrade = action.payload;
                }
            })
            .addCase(updateGrade.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // GET SUBJECTS FOR GRADE
            .addCase(fetchSubjectsByGrade.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubjectsByGrade.fulfilled, (state, action: PayloadAction<Subject[]>) => {
                state.loading = false;
                state.subjects = action.payload;
            })
            .addCase(fetchSubjectsByGrade.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default gradeSlice.reducer;