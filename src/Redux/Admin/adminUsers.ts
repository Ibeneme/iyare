import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../baseurl";

const API_BASE_URL = `${BASE_URL}/api/users`;

// Utility to get token
const getAuthHeaders = () => {
    const token = localStorage.getItem("yareadmintoken");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Thunks
export const createUser = createAsyncThunk(
    "users/createUser",
    async (userData, thunkAPI) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/create`, userData, getAuthHeaders());
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchAllUsersByType = createAsyncThunk(
    "users/fetchAllUsersByType",
    async (userType, thunkAPI) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/all/${userType}`, getAuthHeaders());
            return { userType, users: res.data.data };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchUserById = createAsyncThunk(
    "users/fetchUserById",
    async ({ userType, id }, thunkAPI) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/${userType}/${id}`, getAuthHeaders());
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const updateUser = createAsyncThunk(
    "users/updateUser",
    async ({ userType, id, updateData }, thunkAPI) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/update/${userType}/${id}`,
                updateData,
                getAuthHeaders()
            );
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Slice
const userSlice = createSlice({
    name: "users",
    initialState: {
        loading: false,
        error: null,
        allUsers: {
            teacher: [],
            student: [],
            parent: [],
        },
        currentUser: null,
        createResponse: null,
        updateResponse: null,
    },
    reducers: {
        clearUserState: (state) => {
            state.error = null;
            state.currentUser = null;
            state.createResponse = null;
            state.updateResponse = null;
        },
    },
    extraReducers: (builder) => {
        // Create user
        builder
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.createResponse = action.payload;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch all users
        builder
            .addCase(fetchAllUsersByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsersByType.fulfilled, (state, action) => {
                state.loading = false;
                state.allUsers[action.payload.userType.toLowerCase()] =
                    action.payload.users;
            })
            .addCase(fetchAllUsersByType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch one user
        builder
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentUser = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update user
        builder
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.updateResponse = action.payload;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;