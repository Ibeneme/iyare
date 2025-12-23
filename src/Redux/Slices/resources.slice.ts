import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance"; // Centralized API client

// -------------------- Types --------------------
export type ResourceType = "assignment" | "note" | "announcement";

export interface Resource {
    _id: string;
    subjectId: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    // Note: The API response for fetchAllResources might return a different structure (e.g., nested by class/user),
    // but the slice currently handles it as Resource[]. Adjustments might be needed if fetchAllResources 
    // truly returns a complex type (like the ApiResponse in a previous slice).
}

interface ResourcesState {
    resources: Resource[];
    loading: boolean;
    error: string | null;
}

const initialState: ResourcesState = {
    resources: [],
    loading: false,
    error: null,
};

// -------------------- Async Thunks --------------------

/**
 * Fetch resources by type (assignment, note, announcement) and subject ID.
 * Uses a POST request for fetching, which is typical for filtering/searching.
 */
export const fetchResources = createAsyncThunk<
    Resource[],
    { type: ResourceType; subjectId: string },
    { rejectValue: string }
>("resources/fetchResources", async ({ type, subjectId }, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post("/api/admin/resource/get", { type, subjectId });
        return res.data.data as Resource[];
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

/**
 * Fetch all resources relevant to the logged-in user (teacher/student/admin).
 * Note: The fulfilled type is generic (`any`) due to the complex/dynamic structure 
 * expected from the API path `/getall-resources/getall-resources`. Assuming it resolves 
 * to an array of Resource or a structured object that is handled in the fulfilled case.
 */
export const fetchAllResources = createAsyncThunk<
    any, // Assuming this is handled on the reducer side (as Resource[] currently)
    void,
    { rejectValue: string }
>(
    "resources/fetchAllResources",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get("/api/admin/resource/getall-resources/getall-resources");
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

/**
 * Add a new resource of a specific type to a subject.
 */
export const addResource = createAsyncThunk<
    Resource,
    { type: ResourceType; subjectId: string; title: string; description?: string },
    { rejectValue: string }
>("resources/addResource", async (payload, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post("/api/admin/resource/add", payload);
        return res.data.data as Resource;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

/**
 * Update an existing resource.
 */
export const updateResource = createAsyncThunk<
    Resource,
    { type: ResourceType; _id: string; title: string; description?: string },
    { rejectValue: string }
>("resources/updateResource", async (payload, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.put("/api/admin/resource/update", payload);
        return res.data.data as Resource;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

/**
 * Delete a resource by its ID and type.
 */
export const deleteResource = createAsyncThunk<
    string, // Returns the ID of the deleted resource
    { type: ResourceType; _id: string },
    { rejectValue: string }
>("resources/deleteResource", async ({ type, _id }, { rejectWithValue }) => {
    try {
        // DELETE request with body data
        await axiosInstance.delete("/api/admin/resource/delete", { data: { type, _id } });
        return _id;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// -------------------- Slice --------------------
const resourcesSlice = createSlice({
    name: "resources",
    initialState,
    reducers: {
        clearResources(state) {
            state.resources = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchResources
            .addCase(fetchResources.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchResources.fulfilled, (state, action: PayloadAction<Resource[]>) => {
                state.loading = false;
                state.resources = action.payload;
            })
            .addCase(fetchResources.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })


            // fetchAllResources
            .addCase(fetchAllResources.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllResources.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                // Assuming the complex 'any' payload can be assigned directly or is structured as Resource[]
                state.resources = Array.isArray(action.payload) ? action.payload : (action.payload.data || []);
            })
            .addCase(fetchAllResources.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // addResource
            .addCase(addResource.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addResource.fulfilled, (state, action: PayloadAction<Resource>) => {
                state.loading = false;
                state.resources.unshift(action.payload); // Add new resource to the beginning
            })
            .addCase(addResource.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // updateResource
            .addCase(updateResource.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateResource.fulfilled, (state, action: PayloadAction<Resource>) => {
                state.loading = false;
                // Replace the old resource with the updated one
                state.resources = state.resources.map((r) =>
                    r._id === action.payload._id ? action.payload : r
                );
            })
            .addCase(updateResource.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // deleteResource
            .addCase(deleteResource.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteResource.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                // Filter out the deleted resource by ID
                state.resources = state.resources.filter((r) => r._id !== action.payload);
            })
            .addCase(deleteResource.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearResources } = resourcesSlice.actions;
export default resourcesSlice.reducer;