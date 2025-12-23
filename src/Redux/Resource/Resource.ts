import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// --- Change 1: Import the centralized axios instance ---
import axiosInstance from '../axiosInstance';

// --- Removed imports: axios, BASE_URL ---

const API_BASE = `/api/admin/resource`;

// 📦 Define core types to match your API response
export type ResourceType = 'assignment' | 'note' | 'announcement';

export type ResourceData = {
    _id: string;
    classId: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    data?: any[];
    success?: boolean
};

interface ResourcesByClass {
    assignments: ResourceData[];
    notes: ResourceData[];
    announcements: ResourceData[];
}

interface ClassWithResources {
    _id: string;
    title: string;
    courseId: string;
    studentIds: string[];
    teacherId: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    resources: ResourcesByClass;
    createdAt: string;
    updatedAt: string;
}

interface ParentData {
    childId: string;
    classes: ClassWithResources[];
}

interface StudentResponse {
    student: boolean;
    data: ClassWithResources[];
}

interface ParentResponse {
    parent: boolean;
    data: ParentData[];
}

type ApiResponse = StudentResponse | ParentResponse;

// --- Removed: getAuthHeaders utility function ---

// 🔄 Add Resource (Refactored)
interface AddResourceParams {
    type: ResourceType;
    title: string;
    description: string;
    classId: string;
    data: any[]
}
export const addResource = createAsyncThunk<
    ResourceData,
    AddResourceParams,
    { rejectValue: string }
>(
    'resources/add',
    async ({ type, classId, title, description }, { rejectWithValue }) => {
        // Token check/headers removed, handled by axiosInstance
        try {
            // Use axiosInstance
            const response = await axiosInstance.post(`${API_BASE}/add`, { type, classId, title, description });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 📥 Get Resources (Refactored)
interface GetResourcesParams {
    type: ResourceType;
    classId: string;
}
export const getResources = createAsyncThunk<
    { type: ResourceType; data: ResourceData[] },
    GetResourcesParams,
    { rejectValue: string }
>(
    'resources/get',
    async ({ type, classId }, { rejectWithValue }) => {
        // Token check/headers removed, handled by axiosInstance
        try {
            // Use axiosInstance
            const response = await axiosInstance.post(`${API_BASE}/get`, { type, classId });
            return { type, data: response.data.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 🆕 Corrected getAllResources Thunk (Refactored)
export const getAllResources = createAsyncThunk<
    ApiResponse,
    void,
    { rejectValue: string }
>(
    'resources/getAll',
    async (_, { rejectWithValue }) => {
        // Token check/headers removed, handled by axiosInstance
        try {
            // Use axiosInstance
            // Note: The original path had /getall-resources/getall-resources, which looks odd. Keeping it as is but using API_BASE.
            const response = await axiosInstance.get(`${API_BASE}/getall-resources/getall-resources`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 📝 Update Resource (Refactored)
export interface UpdateResourcePayload {
    type: ResourceType;
    _id: string;
    title: string;
    description: string;
}
export const updateResource = createAsyncThunk<
    ResourceData,
    UpdateResourcePayload,
    { rejectValue: string }
>(
    'resources/update',
    async ({ type, _id, title, description }, { rejectWithValue }) => {
        // Token check/headers removed, handled by axiosInstance
        try {
            // Use axiosInstance
            const response = await axiosInstance.put(`${API_BASE}/update`, { type, _id, title, description });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Unknown error');
        }
    }
);

// 🗑 Delete Resource (Refactored)
interface DeletePayload {
    type: ResourceType;
    _id: string;
}
export const deleteResource = createAsyncThunk<
    { type: ResourceType; _id: string },
    DeletePayload,
    { rejectValue: string }
>(
    "resources/delete",
    async ({ type, _id }, { rejectWithValue }) => {
        // Token check/headers removed, handled by axiosInstance
        try {
            // Use axiosInstance (DELETE requests with body use the 'data' property in the config object)
            await axiosInstance.delete(`${API_BASE}/delete`, { data: { type, _id } });
            return { type, _id };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 📦 Initial State
interface ResourceState {
    allResources: ApiResponse | null;
    loading: boolean;
    error: string | null;
}

const initialState: ResourceState = {
    allResources: null,
    loading: false,
    error: null,
};

// 🧩 Slice
const resourceSlice = createSlice({
    name: 'resources',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Add
            .addCase(addResource.pending, (state) => { state.loading = true; state.error = null; })
            // You might want to update state.allResources or a specific class/resource list here on fulfill
            // .addCase(addResource.fulfilled, (state) => { state.loading = false; }) 
            .addCase(addResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to add resource.'; })

            // Get All Resources
            .addCase(getAllResources.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(getAllResources.fulfilled, (state, action) => { state.loading = false; state.allResources = action.payload; })
            .addCase(getAllResources.rejected, (state, action) => { state.loading = false; state.error = action.payload as string || 'Failed to fetch all resources.'; })

            // Get
            .addCase(getResources.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(getResources.fulfilled, (state) => { state.loading = false; }) // Action payload is not stored in state here
            .addCase(getResources.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to fetch resources.'; })

            // Update
            .addCase(updateResource.pending, (state) => { state.loading = true; state.error = null; })
            // You might want to update state.allResources or a specific class/resource list here on fulfill
            // .addCase(updateResource.fulfilled, (state) => { state.loading = false; }) 
            .addCase(updateResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to update resource.'; })

            // Delete
            .addCase(deleteResource.pending, (state) => { state.loading = true; state.error = null; })
            // You might want to update state.allResources to remove the deleted resource on fulfill
            //.addCase(deleteResource.fulfilled, (state) => { state.loading = false; })
            .addCase(deleteResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to delete resource.'; });
    }
});

export default resourceSlice.reducer;