import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

const baseUrl = `${BASE_URL}/api/admin/resource`;

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

// ⚙️ Helper function to get the authorization headers from localStorage
const getAuthHeaders = () => {
    // ⬅️ CORRECTED KEY: The token is stored under "token", not "yareadmintoken"
    const token = localStorage.getItem("token");
    if (!token) {
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
    };
};

// 🔄 Add Resource
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
        const headers = getAuthHeaders();
        if (!headers) return rejectWithValue('Unauthorized: No token found.');

        try {
            const response = await axios.post(`${baseUrl}/add`, { type, classId, title, description }, { headers });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 📥 Get Resources
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
        const headers = getAuthHeaders();
        if (!headers) return rejectWithValue('Unauthorized: No token found.');

        try {
            const response = await axios.post(`${baseUrl}/get`, { type, classId }, { headers });
            return { type, data: response.data.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 🆕 Corrected getAllResources Thunk
export const getAllResources = createAsyncThunk<
    ApiResponse,
    void,
    { rejectValue: string }
>(
    'resources/getAll',
    async (_, { rejectWithValue }) => {
        const headers = getAuthHeaders();
        if (!headers) return rejectWithValue('Unauthorized: No token found.');

        try {
            const response = await axios.get(`${baseUrl}/getall-resources/getall-resources`, { headers });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// 📝 Update Resource
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
        const headers = getAuthHeaders();
        if (!headers) return rejectWithValue('Unauthorized: No token found.');

        try {
            const response = await axios.put(`${baseUrl}/update`, { type, _id, title, description }, { headers });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Unknown error');
        }
    }
);

// 🗑 Delete Resource
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
        const headers = getAuthHeaders();
        if (!headers) return rejectWithValue('Unauthorized: No token found.');

        try {
            await axios.delete(`${baseUrl}/delete`, { headers, data: { type, _id } });
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
            // .addCase(addResource.fulfilled, (state) => { state.loading = false; })
            .addCase(addResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to add resource.'; })

            // Get All Resources
            .addCase(getAllResources.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(getAllResources.fulfilled, (state, action) => { state.loading = false; state.allResources = action.payload; })
            .addCase(getAllResources.rejected, (state, action) => { state.loading = false; state.error = action.payload as string || 'Failed to fetch all resources.'; })

            // Get
            .addCase(getResources.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(getResources.fulfilled, (state) => { state.loading = false; })
            .addCase(getResources.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to fetch resources.'; })

            // Update
            .addCase(updateResource.pending, (state) => { state.loading = true; state.error = null; })
            // .addCase(updateResource.fulfilled, (state) => { state.loading = false; })
            .addCase(updateResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to update resource.'; })

            // Delete
            .addCase(deleteResource.pending, (state) => { state.loading = true; state.error = null; })
            //.addCase(deleteResource.fulfilled, (state) => { state.loading = false; })
            .addCase(deleteResource.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to delete resource.'; });
    }
});

export default resourceSlice.reducer;