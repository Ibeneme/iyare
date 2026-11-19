import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { ClassAudience, ClassSession, Id, Schedule } from "../../models";

/** Body of POST /api/class/class (admin). Matches the server's Class model. */
export interface ClassSessionInput {
  title: string;
  subjectId: Id;
  teacherId?: Id;
  gradeId?: Id;
  audience: ClassAudience;
  groupIds?: Id[];
  studentIds?: Id[];
  schedules: Schedule[];
}

export const blankSchedule = (): Schedule => ({ frequency: "weekly", timeSlots: [], daysOfWeek: [], daysOfMonth: [], specificDates: [] });

export const fetchSessions = apiThunk<ClassSession[]>("sessions/fetch", async (_, api) => {
  const r = (await api.get("/api/class/class/by-user")).data;
  return r.data ?? r.classes ?? r;
});
export const createSession = apiThunk<ClassSession, ClassSessionInput>("sessions/create", async (b, api) => (await api.post("/api/class/class", b)).data.data);
export const updateSession = apiThunk<ClassSession, { id: Id; changes: Partial<ClassSessionInput> }>("sessions/update", async ({ id, changes }, api) => (await api.put(`/api/class/class/${id}`, changes)).data.data);
export const deleteSession = apiThunk<Id, Id>("sessions/delete", async (id, api) => {
  await api.delete(`/api/class/class/${id}`);
  return id;
});

interface State extends AsyncSlice { items: ClassSession[] }
const slice = createSlice({
  name: "sessions",
  initialState: { ...idle, items: [] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSessions.fulfilled, (s, a) => void (s.items = Array.isArray(a.payload) ? a.payload : []));
    b.addCase(createSession.fulfilled, (s, a) => void s.items.unshift(a.payload));
    b.addCase(updateSession.fulfilled, (s, a) => void (s.items = s.items.map((c) => (c._id === a.payload._id ? a.payload : c))));
    b.addCase(deleteSession.fulfilled, (s, a) => void (s.items = s.items.filter((c) => c._id !== a.payload)));
    trackStatus(b, [fetchSessions, createSession, updateSession, deleteSession]);
  },
});
export default slice.reducer;
