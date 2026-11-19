import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { NotificationPrefs } from "../../models";

export const fetchPrefs = apiThunk<NotificationPrefs>("notificationPrefs/fetch", async (_, api) => (await api.get("/api/notifications/preferences")).data.data);
export const savePrefs = apiThunk<NotificationPrefs, NotificationPrefs>("notificationPrefs/save", async (p, api) => {
  await api.put("/api/notifications/preferences", p);
  return p;
});

interface State extends AsyncSlice { prefs: NotificationPrefs | null }
const slice = createSlice({
  name: "notificationPrefs",
  initialState: { ...idle, prefs: null } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPrefs.fulfilled, (s, a) => void (s.prefs = a.payload));
    b.addCase(savePrefs.fulfilled, (s, a) => void (s.prefs = a.payload));
    trackStatus(b, [fetchPrefs, savePrefs]);
  },
});
export default slice.reducer;
