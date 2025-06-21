import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';


const API_BASE = `${BASE_URL}/api/departments`;


// Fetch departments
export const fetchDepartments = createAsyncThunk(
    'adminDepartment/fetchDepartments',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.get(API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.departments;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Fetch single department by id
export const fetchDepartmentById = createAsyncThunk(
    'adminDepartment/fetchDepartmentById',
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.get(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.department;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Create department
export const createDepartment = createAsyncThunk(
    'adminDepartment/createDepartment',
    async ({ name }: any, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.post(
                API_BASE,
                { name },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data.department;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Update department
export const updateDepartment = createAsyncThunk(
    'adminDepartment/updateDepartment',
    async ({ id, name, courseIds }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.put(
                `${API_BASE}/${id}`,
                { name, courseIds },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data.department;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Delete department
export const deleteDepartment = createAsyncThunk(
    'adminDepartment/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.delete(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { id, message: res.data.message };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);





const adminDepartmentSlice = createSlice({
    name: 'adminDepartment',
    initialState: {
        departments: [],
        currentDepartment: null,
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearMessages(state) {
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchDepartments
            .addCase(fetchDepartments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.loading = false;
                state.departments = action.payload;
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetchDepartmentById
            .addCase(fetchDepartmentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartmentById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentDepartment = action.payload;
            })
            .addCase(fetchDepartmentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // createDepartment
            .addCase(createDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.loading = false;
                state.departments.push(action.payload);
                state.successMessage = 'Department created successfully';
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // updateDepartment
            .addCase(updateDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.departments.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.departments[index] = action.payload;
                }
                if (state.currentDepartment && state.currentDepartment._id === action.payload._id) {
                    state.currentDepartment = action.payload;
                }
                state.successMessage = 'Department updated successfully';
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // deleteDepartment
            .addCase(deleteDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.loading = false;
                state.departments = state.departments.filter(d => d._id !== action.payload.id);
                if (state.currentDepartment && state.currentDepartment._id === action.payload.id) {
                    state.currentDepartment = null;
                }
                state.successMessage = action.payload.message || 'Department deleted successfully';
            })
            .addCase(deleteDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearMessages } = adminDepartmentSlice.actions;
export default adminDepartmentSlice.reducer;