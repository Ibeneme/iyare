import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

// Base URL - adjust if needed
const API_URL = `${BASE_URL}/api/admin-parent`;

// Thunks
export const fetchAllParents = createAsyncThunk(
    'adminParent/fetchAll',
    async (_, thunkAPI) => {
        try {
            const res = await axios.get(API_URL);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    }
);

export const fetchParentById = createAsyncThunk(
    'adminParent/fetchOne',
    async (id, thunkAPI) => {
        try {
            const res = await axios.get(`${API_URL}/${id}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    }
);

export const createParent = createAsyncThunk(
    'adminParent/create',
    async (parentData, thunkAPI) => {
        try {
            const res = await axios.post(API_URL, parentData);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    }
);

export const updateParent = createAsyncThunk(
    'adminParent/update',
    async ({ id, updateData }, thunkAPI) => {
        try {
            const res = await axios.put(`${API_URL}/${id}`, updateData);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    }
);

export const deleteParent = createAsyncThunk(
    'adminParent/delete',
    async (id, thunkAPI) => {
        try {
            const res = await axios.delete(`${API_URL}/${id}`);
            return { id, ...res.data };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    }
);

// Slice
const adminParentSlice = createSlice({
    name: 'adminParent',
    initialState: {
        parents: [],
        selectedParent: null,
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearAdminParentState: (state) => {
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        builder
        
            .addCase(fetchAllParents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllParents.fulfilled, (state, action) => {
                state.loading = false;
                state.parents = action.payload;
            })
            .addCase(fetchAllParents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })


            .addCase(fetchParentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParentById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedParent = action.payload;
            })
            .addCase(fetchParentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })


            .addCase(createParent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createParent.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(createParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })


            .addCase(updateParent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateParent.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Parent updated successfully.";
                state.selectedParent = action.payload;
            })
            .addCase(updateParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            })

        
            .addCase(deleteParent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteParent.fulfilled, (state, action) => {
                state.loading = false;
                state.parents = state.parents.filter((p) => p._id !== action.payload.id);
                state.successMessage = "Parent deleted successfully.";
            })
            .addCase(deleteParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            });
    },
});

export const { clearAdminParentState } = adminParentSlice.actions;

export default adminParentSlice.reducer;