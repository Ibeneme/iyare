import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../baseurl";

// Base URL for awards API
const baseUrl = `${BASE_URL}/api/awards-for-student/awarding`;

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

// 🆕 Create Award
export const createAward = createAsyncThunk<
    Award,
    CreateAwardPayload,
    { rejectValue: string }
>("awards/create", async (awardData, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            return rejectWithValue("Authentication token not found.");
        }
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const res = await axios.post(baseUrl, awardData, config);
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📥 Get All Awards
export const getAwards = createAsyncThunk<
    Award[],
    void,
    { rejectValue: string }
>("awards/getAll", async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            return rejectWithValue("Authentication token not found.");
        }
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const res = await axios.get(baseUrl, config);
        console.log(res, 'red')
        return res.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📥 Get Award by ID
export const getAwardById = createAsyncThunk<
    Award,
    string,
    { rejectValue: string }
>("awards/getById", async (id, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            return rejectWithValue("Authentication token not found.");
        }
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const res = await axios.get(`${baseUrl}/${id}`, config);
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 📝 Update Award
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
        const token = localStorage.getItem("token");
        if (!token) {
            return rejectWithValue("Authentication token not found.");
        }
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const res = await axios.put(`${baseUrl}/${id}`, data, config);
        return res.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// 🗑 Delete Award
export const deleteAward = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>("awards/delete", async (id, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            return rejectWithValue("Authentication token not found.");
        }
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        await axios.delete(`${baseUrl}/${id}`, config);
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
            })
            .addCase(deleteAward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to delete award.";
            });
    },
});

export default awardSlice.reducer;
