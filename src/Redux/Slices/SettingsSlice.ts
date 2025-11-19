import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../baseurl';

const baseUrl = `${BASE_URL}/api/admin/yare/settings`;

// Thunks

// Helper to get admin ID from localStorage
const getAdminId = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
        const user = JSON.parse(storedUser);
        return user?._id || null;
    } catch {
        return null;
    }
};


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

            const res = await axios.post(`${baseUrl}/set-local-price`, {
                localPrice,
                id,
            });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
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

            const res = await axios.post(`${baseUrl}/set-international-price`, {
                internationalPrice,
                id,
            });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// New Thunks to Fetch Prices

// 5. Fetch Local Price
export const fetchLocalPrice = createAsyncThunk(
    'settings/fetchLocalPrice',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${baseUrl}/get-local-price`);
            console.log(res, 'res')
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 6. Fetch International Price
export const fetchInternationalPrice = createAsyncThunk(
    'settings/fetchInternationalPrice',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${baseUrl}/get-international-price`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const AllPrices = createAsyncThunk(
    'settings/AllPrices',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${baseUrl}/all-prices`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// 3. Submit a Report
export const submitReport = createAsyncThunk(
    'settings/submitReport',
    async ({ email, title, description }: { email: string; title: string; description: string }, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${baseUrl}/report`, {
                email,
                title,
                description,
            });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 4. Fetch All Reports
export const fetchReports = createAsyncThunk(
    'settings/fetchReports',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${baseUrl}/reports`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 7. Add Discount
export const addDiscount = createAsyncThunk(
    'settings/addDiscount',
    async ({ title, percentage }: { title: string; percentage: number }, { rejectWithValue }) => {
        try {
            console.log(title, percentage, 'title, percentag')
            const res = await axios.post(`${baseUrl}/discount-feature/discounts`, { title, percentage });
            console.log(res, 'res')
            return res.data.data; // all discounts
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
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
            const res = await axios.put(`${baseUrl}/discount-feature/discounts/${index}`, { title, percentage });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 9. Delete Discount
export const deleteDiscount = createAsyncThunk(
    'settings/deleteDiscount',
    async (index: number, { rejectWithValue }) => {
        try {
            const res = await axios.delete(`${baseUrl}/discount-feature/discounts/${index}`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 10. Fetch All Discounts
export const fetchDiscounts = createAsyncThunk(
    'settings/fetchDiscounts',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${baseUrl}/discount-feature/discounts`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);



// Slice
const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        localPrice: null,
        internationalPrice: null,
        reports: [],
        discounts: [], // ✅ NEW
        loading: false,
        error: null,
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
                state.error = action.payload.message || action.payload;
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
                state.error = action.payload.message || action.payload;
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
                state.error = action.payload.message || action.payload;
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
                state.error = action.payload.message || action.payload;
            });
        // submitReport
        builder
            .addCase(submitReport.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitReport.fulfilled, (state) => {
                state.loading = false;
                // Optionally, add the new report to the list
                //state.reports.unshift(action.payload);
            })
            .addCase(submitReport.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload.message || action.payload;
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
                state.error = action.payload.message || action.payload;
            })// addDiscount
        builder
            .addCase(addDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addDiscount.fulfilled, (state) => {
                state.loading = false;
                //state.discounts = action.payload;
            })
            .addCase(addDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload.message || action.payload;
            });

        // updateDiscount
        builder
            .addCase(updateDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDiscount.fulfilled, (state) => {
                state.loading = false;
                //state.discounts = action.payload;
            })
            .addCase(updateDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload.message || action.payload;
            });

        // deleteDiscount
        builder
            .addCase(deleteDiscount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDiscount.fulfilled, (state) => {
                state.loading = false;
                //state.discounts = action.payload;
            })
            .addCase(deleteDiscount.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload.message || action.payload;
            });
        builder
            .addCase(AllPrices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(AllPrices.fulfilled, (state) => {
                state.loading = false;
                //state.discounts = action.payload;
            })
            .addCase(AllPrices.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload.message || action.payload;
            });
        //AllPrices
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
            .addCase(fetchDiscounts.rejected, (state) => {
                state.loading = false;
                // state.error = action.payload.message || action.payload;
            });
    },
});

export default settingsSlice.reducer;