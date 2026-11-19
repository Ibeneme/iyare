import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Id, StudentGroup } from "../../models";

export interface GroupInput { name: string; gradeId?: Id; studentIds?: Id[] }

export const fetchGroups = apiThunk<StudentGroup[], { gradeId?: Id } | void>("groups/fetch", async (q, api) => (await api.get("/api/groups", { params: q || {} })).data.data);
export const createGroup = apiThunk<StudentGroup, GroupInput>("groups/create", async (b, api) => (await api.post("/api/groups", b)).data.data);
export const updateGroup = apiThunk<StudentGroup, { id: Id; changes: Partial<GroupInput> }>("groups/update", async ({ id, changes }, api) => (await api.put(`/api/groups/${id}`, changes)).data.data);
export const deleteGroup = apiThunk<Id, Id>("groups/delete", async (id, api) => {
  await api.delete(`/api/groups/${id}`);
  return id;
});

interface State extends AsyncSlice { items: StudentGroup[] }
const slice = createSlice({
  name: "groups",
  initialState: { ...idle, items: [] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchGroups.fulfilled, (s, a) => void (s.items = a.payload));
    b.addCase(createGroup.fulfilled, (s, a) => void s.items.unshift(a.payload));
    b.addCase(updateGroup.fulfilled, (s, a) => void (s.items = s.items.map((g) => (g._id === a.payload._id ? a.payload : g))));
    b.addCase(deleteGroup.fulfilled, (s, a) => void (s.items = s.items.filter((g) => g._id !== a.payload)));
    trackStatus(b, [fetchGroups, createGroup, updateGroup, deleteGroup]);
  },
});
export default slice.reducer;
