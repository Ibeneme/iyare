import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// --- Change 1: Import the configured axiosInstance ---
import axiosInstance from '../axiosInstance';

// Base URL (relative path used by axiosInstance)
const API_URL = `/api/admin-parent`;

// --- Thunks (Refactored to use axiosInstance) ---

/**
 * Fetch all parents.
 */
export const fetchAllParents = createAsyncThunk<
    any, // Assuming array of Parent objects
    void,
    { rejectValue: any }
>(
    'adminParent/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(API_URL);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
);

/**
 * Fetch parent by ID.
 */
export const fetchParentById = createAsyncThunk<
    any, // Assuming single Parent object
    string,
    { rejectValue: any }
>(
    'adminParent/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_URL}/${id}`);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
);

/**
 * Create a new parent.
 */
export const createParent = createAsyncThunk<
    any, // Assuming object with data/message
    any, // Parent data input
    { rejectValue: any }
>(
    'adminParent/create',
    async (parentData, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.post(API_URL, parentData);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
);

/**
 * Update an existing parent.
 */
export const updateParent = createAsyncThunk<
    any, // Assuming updated Parent object
    { id: string; updateData: any },
    { rejectValue: any }
>(
    'adminParent/update',
    async ({ id, updateData }, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.put(`${API_URL}/${id}`, updateData);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
);

/**
 * Delete a parent.
 */
export const deleteParent = createAsyncThunk<
    any, // { id: string, message: string }
    string,
    { rejectValue: any }
>(
    'adminParent/delete',
    async (id, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.delete(`${API_URL}/${id}`);
            return { id, ...res.data };
        } catch (err: any) {
            return rejectWithValue(err.response?.data);
        }
    }
);

// --- Slice ---
const adminParentSlice = createSlice({
    name: 'adminParent',
    initialState: {
        parents: [] as any[],
        selectedParent: null as any | null,
        loading: false,
        error: null as any,
        successMessage: null as string | null,
    },
    reducers: {
        clearAdminParentState: (state) => {
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        builder

            // --- fetchAllParents ---
            .addCase(fetchAllParents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllParents.fulfilled, (state, action) => {
                state.loading = false;
                // Assuming action.payload is the array of parents
                state.parents = action.payload;
            })
            .addCase(fetchAllParents.rejected, (state, action) => {
                state.loading = false;
                // Assuming action.payload is the rejected object/string
                state.error = action.payload?.message || action.payload;
            })

            // --- fetchParentById ---
            .addCase(fetchParentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParentById.fulfilled, (state, action) => {
                state.loading = false;
                // Assuming action.payload is the selected parent object
                state.selectedParent = action.payload;
            })
            .addCase(fetchParentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || action.payload;
            })

            // --- createParent ---
            .addCase(createParent.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createParent.fulfilled, (state, action) => {
                state.loading = false;
                // You might want to update state.parents here too
                state.successMessage = action.payload?.message || "Parent created successfully.";
            })
            .addCase(createParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || action.payload;
            })

            // --- updateParent ---
            .addCase(updateParent.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(updateParent.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Parent updated successfully.";
                // Assuming action.payload is the updated object
                state.selectedParent = action.payload;
                // Note: Logic to update the parent in state.parents is missing here
            })
            .addCase(updateParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || action.payload;
            })


            // --- deleteParent ---
            .addCase(deleteParent.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(deleteParent.fulfilled, (state, action) => {
                state.loading = false;
                // action.payload.id comes from the thunk return { id, ... }
                state.parents = state.parents.filter((p: any) => p._id !== action.payload.id);
                state.successMessage = action.payload.message || "Parent deleted successfully.";
            })
            .addCase(deleteParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || action.payload;
            });
    },
});

export const { clearAdminParentState } = adminParentSlice.actions;

export default adminParentSlice.reducer;