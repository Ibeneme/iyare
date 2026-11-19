import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Currency, Transaction, TransactionStatus } from "../../models";

export interface TransactionQuery { status?: TransactionStatus; currency?: Currency; from?: string; to?: string; page?: number; limit?: number }
interface Page { data: Transaction[]; total: number; page: number; revenue?: Partial<Record<Currency, { total: number; count: number }>> }

/** Parent: GET /api/transactions/mine */
export const fetchMyTransactions = apiThunk<Page, TransactionQuery | void>("transactions/mine", async (q, api) =>
  (await api.get("/api/transactions/mine", { params: q || {} })).data
);
/** Admin: GET /api/transactions (all, with revenue per currency) */
export const fetchAllTransactions = apiThunk<Page, TransactionQuery | void>("transactions/all", async (q, api) =>
  (await api.get("/api/transactions", { params: q || {} })).data
);

interface State extends AsyncSlice { items: Transaction[]; total: number; page: number; revenue: NonNullable<Page["revenue"]> }
const slice = createSlice({
  name: "transactions",
  initialState: { ...idle, items: [], total: 0, page: 1, revenue: {} } as State,
  reducers: {},
  extraReducers: (b) => {
    const take = (s: State, p: Page) => {
      s.items = p.data;
      s.total = p.total;
      s.page = p.page;
      s.revenue = p.revenue ?? {};
    };
    b.addCase(fetchMyTransactions.fulfilled, (s, a) => take(s, a.payload));
    b.addCase(fetchAllTransactions.fulfilled, (s, a) => take(s, a.payload));
    trackStatus(b, [fetchMyTransactions, fetchAllTransactions]);
  },
});
export default slice.reducer;
