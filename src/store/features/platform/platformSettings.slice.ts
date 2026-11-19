import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { PlatformSettings } from "../../models";

interface Payload { data: PlatformSettings; trialPresets: number[] }

export const fetchPlatformSettings = apiThunk<Payload>("platform/fetch", async (_, api) => {
  const r = (await api.get("/api/platform-settings")).data;
  return { data: r.data, trialPresets: r.trialPresets };
});
/** PUT /api/platform-settings/trial: only affects students who sign up afterwards. */
export const updateTrial = apiThunk<Payload, { enabled?: boolean; days?: number }>("platform/trial", async (b, api) => {
  const r = (await api.put("/api/platform-settings/trial", b)).data;
  return { data: r.data, trialPresets: r.trialPresets };
});

interface State extends AsyncSlice { settings: PlatformSettings | null; trialPresets: number[] }
const slice = createSlice({
  name: "platform",
  initialState: { ...idle, settings: null, trialPresets: [7, 14, 28, 42] } as State,
  reducers: {},
  extraReducers: (b) => {
    const take = (s: State, p: Payload) => {
      s.settings = p.data;
      s.trialPresets = p.trialPresets;
    };
    b.addCase(fetchPlatformSettings.fulfilled, (s, a) => take(s, a.payload));
    b.addCase(updateTrial.fulfilled, (s, a) => take(s, a.payload));
    trackStatus(b, [fetchPlatformSettings, updateTrial]);
  },
});
export default slice.reducer;
