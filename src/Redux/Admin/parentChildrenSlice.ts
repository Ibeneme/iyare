import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// --- Change 1: Import the centralized axios instance ---
import axiosInstance from '../axiosInstance';

// --- Removed imports: axios, BASE_URL ---

export interface StudentChild {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    class?: string;
    classes?: any[];
    courses: string[];
    userType?: string;
    isSuspended?: boolean;
    inClass?: boolean;
    reported?: boolean;
    isPay?: boolean;
    courseDetails: any[];
    data:
    {
        _id?: string;
        firstName?: string;
        lastName?: string;
        class?: string;
        courses?: string[];
        email?: string;
        password?: string;
        parentId?: string;
        gradeId?: string;
        userType?: string;
        languages?: string[];
        skills?: string[];
        isSuspended?: boolean;
        inClass?: boolean;
        reported?: boolean;
        isPay?: boolean;
        lessonFeeId?: string | null;
        createdAt?: Date | string;
        updatedAt?: Date | string;
    }
}


interface ParentChildrenState {
    loading: boolean;
    error: string | null;
    parentId: string | null;
    parentName: string | null;
    children: StudentChild[];
}

const initialState: ParentChildrenState = {
    loading: false,
    error: null,
    parentId: null,
    parentName: null,
    children: [],
};

// --- Removed: getToken helper function ---

// API Path
const API_CHILDREN_PATH = `/api/admin-classes/children/children`;


// --- Thunk to fetch children (Refactored) ---
export const fetchParentChildren = createAsyncThunk<
    { parentId: string; parentName: string; children: StudentChild[] },
    void,
    { rejectValue: string }
>('parentChildren/fetchParentChildren', async (_, { rejectWithValue }) => {
    try {
        // Use axiosInstance: token and base URL are handled by interceptors
        const response = await axiosInstance.get(API_CHILDREN_PATH);

        // Assuming response.data structure matches the fulfilled type
        return response.data;
    } catch (err: any) {
        console.error("❌ API error:", err);
        return rejectWithValue(err.response?.data?.error || "Failed to fetch parent children");
    }
});

const parentChildrenSlice = createSlice({
    name: 'parentChildren',
    initialState,
    reducers: {
        clearParentChildren: (state) => {
            state.parentId = null;
            state.parentName = null;
            state.children = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchParentChildren.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParentChildren.fulfilled, (state, action: PayloadAction<{ parentId: string; parentName: string; children: StudentChild[] }>) => {
                state.loading = false;
                state.parentId = action.payload.parentId;
                state.parentName = action.payload.parentName;
                state.children = action.payload.children;
            })
            .addCase(fetchParentChildren.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || "Unknown error fetching children";
            });
    },
});

export const { clearParentChildren } = parentChildrenSlice.actions;
export default parentChildrenSlice.reducer;