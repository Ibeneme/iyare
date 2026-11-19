import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { AnnouncementKind, Id, PlatformAnnouncement } from "../../models";

export type AnnouncementInput = Partial<Omit<PlatformAnnouncement, "_id" | "createdAt" | "status">> & { kind: AnnouncementKind; title: string };

interface Grouped { banners: PlatformAnnouncement[]; maintenance: PlatformAnnouncement[]; announcements: PlatformAnnouncement[] }

/** What the signed-in user should see right now. */
export const fetchMine = apiThunk<Grouped>("announcements/mine", async (_, api) => (await api.get("/api/announcements/mine")).data.data);
/** Admin tab: everything, with a computed status. */
export const fetchAdminList = apiThunk<PlatformAnnouncement[], { kind?: AnnouncementKind } | void>("announcements/admin", async (q, api) => (await api.get("/api/announcements", { params: q || {} })).data.data);
export const createAnnouncement = apiThunk<PlatformAnnouncement, AnnouncementInput>("announcements/create", async (b, api) => (await api.post("/api/announcements", b)).data.data);
export const updateAnnouncement = apiThunk<PlatformAnnouncement, { id: Id; changes: Partial<AnnouncementInput> }>("announcements/update", async ({ id, changes }, api) => (await api.put(`/api/announcements/${id}`, changes)).data.data);
export const toggleAnnouncement = apiThunk<PlatformAnnouncement, { id: Id; isActive?: boolean }>("announcements/toggle", async ({ id, isActive }, api) => (await api.patch(`/api/announcements/${id}/toggle`, { isActive })).data.data);
export const deleteAnnouncement = apiThunk<Id, Id>("announcements/delete", async (id, api) => {
  await api.delete(`/api/announcements/${id}`);
  return id;
});

interface State extends AsyncSlice { mine: Grouped; admin: PlatformAnnouncement[]; dismissed: Id[] }
const slice = createSlice({
  name: "announcements",
  initialState: { ...idle, mine: { banners: [], maintenance: [], announcements: [] }, admin: [], dismissed: [] } as State,
  reducers: { dismissBanner: (s, a: PayloadAction<Id>) => void s.dismissed.push(a.payload) },
  extraReducers: (b) => {
    b.addCase(fetchMine.fulfilled, (s, a) => void (s.mine = a.payload));
    b.addCase(fetchAdminList.fulfilled, (s, a) => void (s.admin = a.payload));
    b.addCase(createAnnouncement.fulfilled, (s, a) => void s.admin.unshift(a.payload));
    const replace = (s: State, p: PlatformAnnouncement) => void (s.admin = s.admin.map((x) => (x._id === p._id ? { ...x, ...p } : x)));
    b.addCase(updateAnnouncement.fulfilled, (s, a) => replace(s, a.payload));
    b.addCase(toggleAnnouncement.fulfilled, (s, a) => replace(s, a.payload));
    b.addCase(deleteAnnouncement.fulfilled, (s, a) => void (s.admin = s.admin.filter((x) => x._id !== a.payload)));
    trackStatus(b, [fetchMine, fetchAdminList, createAnnouncement, updateAnnouncement, toggleAnnouncement, deleteAnnouncement]);
  },
});
export const { dismissBanner } = slice.actions;
export default slice.reducer;
