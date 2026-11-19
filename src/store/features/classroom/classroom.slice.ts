import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { ClassAccess, ClassAssignment, ClassroomNote, ClassSession, Id } from "../../models";

/** Everything the classroom needs from the server's access matrix + REST endpoints. */
export const fetchMyClasses = apiThunk<ClassSession[]>("classroom/my", async (_, api) => (await api.get("/api/classroom/my-classes")).data.data);
export const fetchClassAccess = apiThunk<{ access: ClassAccess; room: { screenSharerId: string | null; participants: unknown[] } }, Id>("classroom/access", async (id, api) => {
  const r = (await api.get(`/api/classroom/${id}/access`)).data;
  return { access: r.data, room: r.room };
});
export const fetchAssignments = apiThunk<{ classId: Id; items: ClassAssignment[] }, Id>("classroom/assignments", async (id, api) => ({
  classId: id,
  items: (await api.get(`/api/classroom/${id}/assignments`)).data.data,
}));
export const postAssignment = apiThunk<ClassAssignment, { classId: Id; title: string; instructions?: string; dueDate?: string }>("classroom/postAssignment", async ({ classId, ...b }, api) =>
  (await api.post(`/api/classroom/${classId}/assignments`, b)).data.data
);
export const fetchNotes = apiThunk<{ classId: Id; note: ClassroomNote }, Id>("classroom/notes", async (id, api) => ({
  classId: id,
  note: (await api.get(`/api/classroom/${id}/notes`)).data.data,
}));

interface State extends AsyncSlice {
  myClasses: ClassSession[];
  access: Record<Id, ClassAccess>;
  assignments: Record<Id, ClassAssignment[]>;
  notes: Record<Id, ClassroomNote>;
}
const slice = createSlice({
  name: "classroom",
  initialState: { ...idle, myClasses: [], access: {}, assignments: {}, notes: {} } as State,
  reducers: {
    /** socket "assignment:new" */
    assignmentReceived: (s, a: PayloadAction<ClassAssignment>) => {
      const list = (s.assignments[a.payload.classId] ||= []);
      if (!list.some((x) => x._id === a.payload._id)) list.unshift(a.payload);
    },
    /** socket "notes:updated" */
    notesReceived: (s, a: PayloadAction<{ classId: Id } & ClassroomNote>) => {
      const { classId, ...note } = a.payload;
      s.notes[classId] = note;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyClasses.fulfilled, (s, a) => void (s.myClasses = a.payload));
    b.addCase(fetchClassAccess.fulfilled, (s, a) => void (s.access[a.payload.access.class._id] = a.payload.access));
    b.addCase(fetchAssignments.fulfilled, (s, a) => void (s.assignments[a.payload.classId] = a.payload.items));
    b.addCase(postAssignment.fulfilled, (s, a) => {
      const list = (s.assignments[a.payload.classId] ||= []);
      list.unshift(a.payload);
    });
    b.addCase(fetchNotes.fulfilled, (s, a) => void (s.notes[a.payload.classId] = a.payload.note));
    trackStatus(b, [fetchMyClasses, fetchClassAccess, fetchAssignments, postAssignment, fetchNotes]);
  },
});
export const { assignmentReceived, notesReceived } = slice.actions;
export default slice.reducer;
