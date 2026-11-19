import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Currency, Id, Pricing, PriceKind, SubscriptionPlanMeta } from "../../models";

export interface PricingInput {
  kind?: PriceKind;
  planKey?: string;
  name?: string;
  description?: string;
  prices: Record<Currency, number>;
  durationDays?: number;
  isActive?: boolean;
  meta?: SubscriptionPlanMeta;
}

export const fetchPricing = apiThunk<Pricing[], { kind?: PriceKind } | void>(
  "pricing/fetch",
  async (q, api) =>
    (
      await api.get("/api/pricing", {
        params: { kind: "subscription", ...(q || {}) },
      })
    ).data.data
);

export const savePricing = apiThunk<Pricing, PricingInput>(
  "pricing/save",
  async (b, api) =>
    (
      await api.post("/api/pricing", {
        ...b,
        kind: b.kind ?? "subscription",
      })
    ).data.data
);

export const updatePricing = apiThunk<
  Pricing,
  { id: Id; changes: Partial<PricingInput> }
>("pricing/update", async ({ id, changes }, api) =>
  (await api.put(`/api/pricing/${id}`, changes)).data.data
);

export const deletePricing = apiThunk<Id, Id>("pricing/delete", async (id, api) => {
  await api.delete(`/api/pricing/${id}`);
  return id;
});

interface State extends AsyncSlice {
  items: Pricing[];
}

const slice = createSlice({
  name: "pricing",
  initialState: { ...idle, items: [] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPricing.fulfilled, (s, a) => {
      s.items = a.payload;
    });
    const upsert = (s: State, p: Pricing) => {
      const i = s.items.findIndex((x) => x._id === p._id);
      if (i >= 0) s.items[i] = p;
      else s.items.push(p);
    };
    b.addCase(savePricing.fulfilled, (s, a) => upsert(s, a.payload));
    b.addCase(updatePricing.fulfilled, (s, a) => upsert(s, a.payload));
    b.addCase(deletePricing.fulfilled, (s, a) => {
      s.items = s.items.filter((x) => x._id !== a.payload);
    });
    trackStatus(b, [fetchPricing, savePricing, updatePricing, deletePricing]);
  },
});

export default slice.reducer;