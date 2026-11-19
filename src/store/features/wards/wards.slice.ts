import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Grade, Id, Student, Subject } from "../../models";

export interface WardInput {
  firstName: string;
  lastName: string;
  email: string;
  gradeId?: Id | null;
  subjectIds?: Id[];
}
export type WardUpdate = Partial<Omit<WardInput, "email">>;

/** GET /api/wards/catalogue: what a parent can pick from. */
export interface Catalogue { grades: Pick<Grade, "_id" | "title" | "description">[]; subjects: Pick<Subject, "_id" | "name" | "code" | "gradeLevel">[] }

export const fetchWards = apiThunk<Student[]>("wards/fetch", async (_, api) => (await api.get("/api/wards")).data.data);
export const fetchCatalogue = apiThunk<Catalogue>("wards/catalogue", async (_, api) => (await api.get("/api/wards/catalogue")).data.data);
export const addWard = apiThunk<Student, WardInput>("wards/add", async (b, api) => (await api.post("/api/wards", b)).data.data);
export const updateWard = apiThunk<Student, { id: Id; changes: WardUpdate }>("wards/update", async ({ id, changes }, api) => (await api.put(`/api/wards/${id}`, changes)).data.data);
export const removeWard = apiThunk<Id, Id>("wards/remove", async (id, api) => {
  await api.delete(`/api/wards/${id}`);
  return id;
});

interface State extends AsyncSlice { items: Student[]; catalogue: Catalogue | null }
const initialState: State = { ...idle, items: [], catalogue: null };

const slice = createSlice({
  name: "wards",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchWards.fulfilled, (s, a) => void (s.items = a.payload));
    b.addCase(fetchCatalogue.fulfilled, (s, a) => void (s.catalogue = a.payload));
    b.addCase(addWard.fulfilled, (s, a) => void s.items.unshift(a.payload));
    b.addCase(updateWard.fulfilled, (s, a) => void (s.items = s.items.map((w) => (w._id === a.payload._id ? a.payload : w))));
    b.addCase(removeWard.fulfilled, (s, a) => void (s.items = s.items.filter((w) => w._id !== a.payload)));
    trackStatus(b, [fetchWards, addWard, updateWard, removeWard, fetchCatalogue]);
  },
});
export default slice.reducer;
