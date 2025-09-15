import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

const API_BASE = `${BASE_URL}/api/departments`;

// 📦 Define core types for data models and thunk arguments
interface Course {
    _id: string;
    name: string;
    // ... other course properties
}

interface Department {
    _id: string;
    name: string;
    courses: Course[];
}

interface UpdateDepartmentParams {
    id: string;
    name: string;
    courseIds: string[];
}

interface CreateDepartmentParams {
    name: string;
}

interface DeleteDepartmentResult {
    id: string;
    message: string;
}

interface AdminDepartmentState {
    departments: Department[];
    currentDepartment: Department | null;
    loading: boolean;
    error: string | null;
    successMessage: string | null;
}

// 🔄 Async Thunks

// Fetch all departments
export const fetchDepartments = createAsyncThunk<
    Department[],
    void,
    { rejectValue: string }
>(
    'adminDepartment/fetchDepartments',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.get(API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.departments;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Fetch single department by id
export const fetchDepartmentById = createAsyncThunk<
    Department,
    string,
    { rejectValue: string }
>(
    'adminDepartment/fetchDepartmentById',
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.get(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.department;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Create department
export const createDepartment = createAsyncThunk<
    Department,
    CreateDepartmentParams,
    { rejectValue: string }
>(
    'adminDepartment/createDepartment',
    async ({ name }, { rejectWithValue }) => {
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
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Update department
export const updateDepartment = createAsyncThunk<
    Department,
    UpdateDepartmentParams,
    { rejectValue: string }
>(
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
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Delete department
export const deleteDepartment = createAsyncThunk<
    DeleteDepartmentResult,
    string,
    { rejectValue: string }
>(
    'adminDepartment/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('yareadmintoken');
            const res = await axios.delete(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { id, message: res.data.message };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// 📦 Initial State
const initialState: AdminDepartmentState = {
    departments: [],
    currentDepartment: null,
    loading: false,
    error: null,
    successMessage: null,
};

// 🧩 Slice
const adminDepartmentSlice = createSlice({
    name: 'adminDepartment',
    initialState,
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
            .addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<Department[]>) => {
                state.loading = false;
                state.departments = action.payload;
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // fetchDepartmentById
            .addCase(fetchDepartmentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartmentById.fulfilled, (state, action: PayloadAction<Department>) => {
                state.loading = false;
                state.currentDepartment = action.payload;
            })
            .addCase(fetchDepartmentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // createDepartment
            .addCase(createDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createDepartment.fulfilled, (state, action: PayloadAction<Department>) => {
                state.loading = false;
                state.departments.push(action.payload);
                state.successMessage = 'Department created successfully';
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // updateDepartment
            .addCase(updateDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(updateDepartment.fulfilled, (state, action: PayloadAction<Department>) => {
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
                state.error = action.payload as string;
            })
            // deleteDepartment
            .addCase(deleteDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(deleteDepartment.fulfilled, (state, action: PayloadAction<DeleteDepartmentResult>) => {
                state.loading = false;
                state.departments = state.departments.filter(d => d._id !== action.payload.id);
                if (state.currentDepartment && state.currentDepartment._id === action.payload.id) {
                    state.currentDepartment = null;
                }
                state.successMessage = action.payload.message || 'Department deleted successfully';
            })
            .addCase(deleteDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearMessages } = adminDepartmentSlice.actions;
export default adminDepartmentSlice.reducer;