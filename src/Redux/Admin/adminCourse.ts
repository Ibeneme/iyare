import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance"; // Import the centralized axios instance

// Note: BASE_URL and the token retrieval logic from thunkAPI are no longer needed
// because they are handled by axiosInstance's configuration and interceptors.

// Base URL (relative path only, since the full path is in axiosInstance)
const API_URL = `/api/courses`;

// --- Interfaces (Recommended for better typing) ---
// Define a Course interface if you don't have one yet.
// Since your state uses 'any', I'll use 'any' for the payload, but strongly recommend
// defining a type like 'CourseData' (e.g., export interface CourseData { _id: string; title: string; /* ... */ })
interface CourseData {
    _id: string;
    title: string;
    // Add other course properties here for type safety
    [key: string]: any;
}


// --- Async Thunks (Refactored to use axiosInstance) ---

/**
 * Creates a new Course.
 */
export const createCourse = createAsyncThunk<CourseData, any, { rejectValue: any }>(
    "adminCourse/createCourse",
    async (courseData, { rejectWithValue }) => {
        try {
            // Use axiosInstance, which automatically handles the token and base URL
            const res = await axiosInstance.post<{ data: CourseData }>(API_URL, courseData);
            return res.data.data;
        } catch (err: any) {
            // Interceptor handles logging, thunk handles error payload
            return rejectWithValue(err.response?.data || "Error creating course");
        }
    }
);

/**
 * Get all courses.
 */
export const fetchCourses = createAsyncThunk<CourseData[], void, { rejectValue: any }>(
    "adminCourse/fetchCourses",
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get<{ data: CourseData[] }>(API_URL);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || "Error fetching courses");
        }
    }
);

/**
 * Get course by ID.
 */
export const fetchCourseById = createAsyncThunk<CourseData, string, { rejectValue: any }>(
    "adminCourse/fetchCourseById",
    async (id, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get<CourseData>(`${API_URL}/${id}`);
            // Assuming single fetch returns the data directly, not wrapped in a 'data' property
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || "Error fetching course");
        }
    }
);

// --- Redux Slice ---

const adminCourseSlice = createSlice({
    name: "adminCourse",
    initialState: {
        courses: [],
        course: null,
        loading: false,
        error: null,
    } as {
        courses: CourseData[]; // Changed to use CourseData interface
        course: CourseData | null;
        loading: boolean;
        error: any;
    },
    reducers: {
        clearCourse(state) {
            state.course = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create course
            .addCase(createCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCourse.fulfilled, (state, action) => {
                state.loading = false;
                state.courses.push(action.payload);
            })
            .addCase(createCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch all
            .addCase(fetchCourses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                state.loading = false;
                state.courses = action.payload;
            })
            .addCase(fetchCourses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch by ID
            .addCase(fetchCourseById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseById.fulfilled, (state, action) => {
                state.loading = false;
                state.course = action.payload;
            })
            .addCase(fetchCourseById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCourse } = adminCourseSlice.actions;
export default adminCourseSlice.reducer;