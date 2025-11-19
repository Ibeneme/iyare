import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// -------------------- Types --------------------
export type ResourceType = "assignment" | "note" | "announcement";

export interface Resource {
    _id: string;
    subjectId: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
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

// Fetch resources by type and subject
export const fetchResources = createAsyncThunk<
    Resource[],
    { type: ResourceType; subjectId: string }
>("resources/fetchResources", async ({ type, subjectId }, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post("/api/admin/resource/get", { type, subjectId });
        return res.data.data as Resource[];
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// Fetch all resources for the logged-in user
export const fetchAllResources = createAsyncThunk<any, void>(
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

// Add a new resource
export const addResource = createAsyncThunk<
    Resource,
    { type: ResourceType; subjectId: string; title: string; description?: string }
>("resources/addResource", async (payload, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post("/api/admin/resource/add", payload);
        return res.data.data as Resource;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// Update a resource
export const updateResource = createAsyncThunk<
    Resource,
    { type: ResourceType; _id: string; title: string; description?: string }
>("resources/updateResource", async (payload, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.put("/api/admin/resource/update", payload);
        return res.data.data as Resource;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// Delete a resource
export const deleteResource = createAsyncThunk<
    string,
    { type: ResourceType; _id: string }
>("resources/deleteResource", async ({ type, _id }, { rejectWithValue }) => {
    try {
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


            .addCase(fetchAllResources.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllResources.fulfilled, (state, action: PayloadAction<Resource[]>) => {
                state.loading = false;
                state.resources = action.payload;
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
                state.resources.unshift(action.payload);
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