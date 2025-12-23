import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// --- Change 1: Import the centralized axios instance ---
import axiosInstance from '../axiosInstance';

// Base URL for awards API (relative path)
const API_BASE = `/api/awards-for-student/awarding`;

// 📦 Types
export interface Award {
    _id: string;
    title?: string;
    description?: string;
    studentId?: string;
    teacherId?: string;
    classId?: string;
    createdAt: string;
    updatedAt: string;
    course?: {
        title: string;
    }
    student?: {
        name?: any
    }

}



interface AwardState {
    awards: Award[];
    currentAward: Award | null;
    loading: boolean;
    error: string | null;
}

interface CreateAwardPayload {
    title?: string;
    description?: string;
    studentId?: string;
    teacherId?: string;
    classId?: string;
}

// 🆕 Create Award (Refactored)
export const createAward = createAsyncThunk<
    Award,
    CreateAwardPayload,
    { rejectValue: string }
>("awards/create", async (awardData, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token handling removed
        const res = await axiosInstance.post(API_BASE, awardData);
        // Assuming response.data is the Award object
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📥 Get All Awards (Refactored)
export const getAwards = createAsyncThunk<
    Award[],
    void,
    { rejectValue: string }
>("awards/getAll", async (_, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token handling removed
        const res = await axiosInstance.get<{ data: Award[] }>(API_BASE);
        // Assuming your API returns { data: [...] }
        return res.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📥 Get Award by ID (Refactored)
export const getAwardById = createAsyncThunk<
    Award,
    string,
    { rejectValue: string }
>("awards/getById", async (id, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token handling removed
        const res = await axiosInstance.get(`${API_BASE}/${id}`);
        // Assuming response.data is the Award object
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📝 Update Award (Refactored)
interface UpdateAwardPayload {
    id: string;
    data: Partial<CreateAwardPayload>;
}
export const updateAward = createAsyncThunk<
    Award,
    UpdateAwardPayload,
    { rejectValue: string }
>("awards/update", async ({ id, data }, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token handling removed
        const res = await axiosInstance.put(`${API_BASE}/${id}`, data);
        // Assuming response.data is the updated Award object
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 🗑 Delete Award (Refactored)
export const deleteAward = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>("awards/delete", async (id, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token handling removed
        await axiosInstance.delete(`${API_BASE}/${id}`);
        return id;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📦 Initial State
const initialState: AwardState = {
    awards: [],
    currentAward: null,
    loading: false,
    error: null,
};

// 🧩 Slice
const awardSlice = createSlice({
    name: "awards",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createAward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAward.fulfilled, (state, action) => {
                state.loading = false;
                state.awards.push(action.payload);
            })
            .addCase(createAward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create award.";
            })

            // Get All
            .addCase(getAwards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAwards.fulfilled, (state, action) => {
                state.loading = false;
                state.awards = action.payload;
            })
            .addCase(getAwards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch awards.";
            })

            // Get by ID
            .addCase(getAwardById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAwardById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentAward = action.payload;
            })
            .addCase(getAwardById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch award.";
            })

            // Update
            .addCase(updateAward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAward.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.awards.findIndex((a) => a._id === action.payload._id);
                if (index !== -1) state.awards[index] = action.payload;
                // Update currentAward if the updated award is currently selected
                if (state.currentAward && state.currentAward._id === action.payload._id) {
                    state.currentAward = action.payload;
                }
            })
            .addCase(updateAward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to update award.";
            })

            // Delete
            .addCase(deleteAward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAward.fulfilled, (state, action) => {
                state.loading = false;
                state.awards = state.awards.filter((a) => a._id !== action.payload);
                // Clear currentAward if the deleted award was currently selected
                if (state.currentAward && state.currentAward._id === action.payload) {
                    state.currentAward = null;
                }
            })
            .addCase(deleteAward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to delete award.";
            });
    },
});

export default awardSlice.reducer;