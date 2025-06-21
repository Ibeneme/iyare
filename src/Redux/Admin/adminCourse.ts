import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../baseurl";

// Base URL
const API_URL = `${BASE_URL}/api/courses`;

// Helper to get token and set headers
const getAuthHeaders = (token: string | null) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Thunks

// Create Course
export const createCourse = createAsyncThunk(
    "adminCourse/createCourse",
    async (courseData: any, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).adminAuth?.adminToken;
            const res = await axios.post(API_URL, courseData, getAuthHeaders(token));
            return res.data.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || "Error creating course");
        }
    }
);

// Get all courses
export const fetchCourses = createAsyncThunk(
    "adminCourse/fetchCourses",
    async (_, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).adminAuth?.adminToken;
            const res = await axios.get(API_URL, getAuthHeaders(token));
            return res.data.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || "Error fetching courses");
        }
    }
);

// Get course by ID
export const fetchCourseById = createAsyncThunk(
    "adminCourse/fetchCourseById",
    async (id: string, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).adminAuth?.adminToken;
            const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders(token));
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || "Error fetching course");
        }
    }
);
const adminCourseSlice = createSlice({
    name: "adminCourse",
    initialState: {
        courses: [],
        course: null,
        loading: false,
        error: null,
    } as {
        courses: any[];
        course: any | null;
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