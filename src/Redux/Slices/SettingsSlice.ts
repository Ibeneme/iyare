import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// --- Change 1: Import the centralized axios instance ---
import axiosInstance from '../axiosInstance';

// --- Removed imports: axios, BASE_URL ---

// Base API Path (Relative)
const API_BASE = `/api/admin/yare/settings`;

// Helper to get admin ID from localStorage
const getAdminId = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
        const user = JSON.parse(storedUser);
        // Assuming the user object has a unique identifier field like '_id'
        return user?._id || null;
    } catch {
        return null;
    }
};

// --- ASYNC THUNKS (Refactored) ---

// 1. Set Local Price
export const setLocalPrice = createAsyncThunk(
    "settings/setLocalPrice",
    async (
        { localPrice }: { localPrice: number },
        { rejectWithValue }
    ) => {
        try {
            const id = getAdminId();
            if (!id) {
                return rejectWithValue("Admin ID not found in local storage.");
            }

            // Use axiosInstance
            const res = await axiosInstance.post(`${API_BASE}/set-local-price`, {
                localPrice,
                id,
            });
            return res.data.data;
        } catch (err: any) {
            // Using err.response?.data?.message or common error structure
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to set local price");
        }
    }
);

// 2. Set International Price
export const setInternationalPrice = createAsyncThunk(
    "settings/setInternationalPrice",
    async (
        { internationalPrice }: { internationalPrice: number },
        { rejectWithValue }
    ) => {
        try {
            const id = getAdminId();
            if (!id) {
                return rejectWithValue("Admin ID not found in local storage.");
            }

            // Use axiosInstance
            const res = await axiosInstance.post(`${API_BASE}/set-international-price`, {
                internationalPrice,
                id,
            });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to set international price");
        }
    }
);

// 5. Fetch Local Price
export const fetchLocalPrice = createAsyncThunk(
    'settings/fetchLocalPrice',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_BASE}/get-local-price`);
            // console.log(res, 'res') // Removed console.log
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch local price");
        }
    }
);

// 6. Fetch International Price
export const fetchInternationalPrice = createAsyncThunk(
    'settings/fetchInternationalPrice',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_BASE}/get-international-price`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch international price");
        }
    }
);

// Fetch All Prices
export const AllPrices = createAsyncThunk(
    'settings/AllPrices',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_BASE}/all-prices`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch all prices");
        }
    }
);


// 3. Submit a Report
export const submitReport = createAsyncThunk(
    'settings/submitReport',
    async ({ email, title, description }: { email: string; title: string; description: string }, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.post(`${API_BASE}/report`, {
                email,
                title,
                description,
            });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to submit report");
        }
    }
);

// 4. Fetch All Reports
export const fetchReports = createAsyncThunk(
    'settings/fetchReports',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_BASE}/reports`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch reports");
        }
    }
);

// 7. Add Discount
export const addDiscount = createAsyncThunk(
    'settings/addDiscount',
    async ({ title, percentage }: { title: string; percentage: number }, { rejectWithValue }) => {
        try {
            // console.log(title, percentage, 'title, percentag') // Removed console.log
            // Use axiosInstance
            const res = await axiosInstance.post(`${API_BASE}/discount-feature/discounts`, { title, percentage });
            // console.log(res, 'res') // Removed console.log
            return res.data.data; // all discounts
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to add discount");
        }
    }
);

// 8. Update Discount
export const updateDiscount = createAsyncThunk(
    'settings/updateDiscount',
    async (
        { index, title, percentage }: { index: number; title?: string; percentage?: number },
        { rejectWithValue }
    ) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.put(`${API_BASE}/discount-feature/discounts/${index}`, { title, percentage });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to update discount");
        }
    }
);

// 9. Delete Discount
export const deleteDiscount = createAsyncThunk(
    'settings/deleteDiscount',
    async (index: number, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.delete(`${API_BASE}/discount-feature/discounts/${index}`);
            return res.data.data; // Assuming it returns the updated list of discounts
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete discount");
        }
    }
);

// 10. Fetch All Discounts
export const fetchDiscounts = createAsyncThunk(
    'settings/fetchDiscounts',
    async (_, { rejectWithValue }) => {
        try {
            // Use axiosInstance
            const res = await axiosInstance.get(`${API_BASE}/discount-feature/discounts`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch discounts");
        }
    }
);



// Slice
const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        localPrice: null as number | null,
        internationalPrice: null as number | null,
        reports: [] as any[],
        discounts: [] as any[],
        loading: false,
        error: null as string | null,
    },
    reducers: {
        // Add synchronous reducers if needed.
    },
    extraReducers: (builder) => {
        // setLocalPrice
        builder
            .addCase(setLocalPrice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(setLocalPrice.fulfilled, (state, action) => {
                state.loading = false;
                state.localPrice = action.payload.localPrice;
            })
            .addCase(setLocalPrice.rejected, (state, action: any) => {
                state.loading = false;
                // Standardize error payload access
                state.error = action.payload as string;
            });
        // setInternationalPrice
        builder
            .addCase(setInternationalPrice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(setInternationalPrice.fulfilled, (state, action) => {
                state.loading = false;
                state.internationalPrice = action.payload.internationalPrice;
            })
            .addCase(setInternationalPrice.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });
        // fetchLocalPrice
        builder
            .addCase(fetchLocalPrice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLocalPrice.fulfilled, (state, action) => {
                state.loading = false;
                state.localPrice = action.payload.localPrice;
            })
            .addCase(fetchLocalPrice.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });
        // fetchInternationalPrice
        builder
            .addCase(fetchInternationalPrice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInternationalPrice.fulfilled, (state, action) => {
                state.loading = false;
                state.internationalPrice = action.payload.internationalPrice;
            })
            .addCase(fetchInternationalPrice.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });
        // submitReport
        builder
            .addCase(submitReport.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitReport.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(submitReport.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });
        // fetchReports
        builder
            .addCase(fetchReports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.loading = false;
                state.reports = action.payload;
            })
            .addCase(fetchReports.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // AllPrices
        builder
            .addCase(AllPrices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(AllPrices.fulfilled, (state, action) => {
                state.loading = false;
                // Assuming AllPrices returns { localPrice: number, internationalPrice: number }
                state.localPrice = action.payload.localPrice;
                state.internationalPrice = action.payload.internationalPrice;
            })
            .addCase(AllPrices.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // addDiscount
        builder
            .addCase(addDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addDiscount.fulfilled, (state, action) => {
                state.loading = false;
                state.discounts = action.payload; // Assuming it returns the updated list
            })
            .addCase(addDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // updateDiscount
        builder
            .addCase(updateDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDiscount.fulfilled, (state, action) => {
                state.loading = false;
                state.discounts = action.payload; // Assuming it returns the updated list
            })
            .addCase(updateDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // deleteDiscount
        builder
            .addCase(deleteDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDiscount.fulfilled, (state, action) => {
                state.loading = false;
                state.discounts = action.payload; // Assuming it returns the updated list
            })
            .addCase(deleteDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // fetchDiscounts
        builder
            .addCase(fetchDiscounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDiscounts.fulfilled, (state, action) => {
                state.loading = false;
                state.discounts = action.payload;
            })
            .addCase(fetchDiscounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to fetch discounts';
            });
    },
});

export default settingsSlice.reducer;