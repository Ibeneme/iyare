import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { AccessState, GraceDuration, Id, Student, StudentAccessView, WardAccess } from "../../models";

export type AdminStudentAccess = Pick<Student, "_id" | "firstName" | "lastName" | "email" | "trialEndsAt" | "trialDays" | "adminGraceUntil" | "adminGraceDuration"> & { access: AccessState };
export type AccessFilter = "grace" | "expiry_grace" | "lapsed" | "paid" | "trial" | "trial_ended";

/** Student: neutral view (never mentions fees). */
export const fetchMyAccess = apiThunk<StudentAccessView>("access/me", async (_, api) => (await api.get("/api/access/me")).data.data);
/** Parent: the real state of each ward. */
export const fetchWardAccess = apiThunk<WardAccess[]>("access/wards", async (_, api) => (await api.get("/api/access/wards")).data.data);
/** Admin: every student with their access state. */
export const fetchStudentAccess = apiThunk<{ rows: AdminStudentAccess[]; options: GraceDuration[] }, { state?: AccessFilter; q?: string } | void>("access/students", async (q, api) => {
  const r = (await api.get("/api/access/students", { params: q || {} })).data;
  return { rows: r.data, options: r.options };
});
export const grantGrace = apiThunk<AdminStudentAccess, { id: Id; duration: GraceDuration; note?: string }>("access/grant", async ({ id, ...b }, api) => (await api.post(`/api/access/students/${id}/grace`, b)).data.data);
export const revokeGrace = apiThunk<{ _id: Id; access: AccessState }, Id>("access/revoke", async (id, api) => (await api.delete(`/api/access/students/${id}/grace`)).data.data);

interface State extends AsyncSlice { mine: StudentAccessView | null; wards: WardAccess[]; students: AdminStudentAccess[]; graceOptions: GraceDuration[] }
const slice = createSlice({
  name: "access",
  initialState: { ...idle, mine: null, wards: [], students: [], graceOptions: ["3d", "1w", "4w", "3m"] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyAccess.fulfilled, (s, a) => void (s.mine = a.payload));
    b.addCase(fetchWardAccess.fulfilled, (s, a) => void (s.wards = a.payload));
    b.addCase(fetchStudentAccess.fulfilled, (s, a) => {
      s.students = a.payload.rows;
      s.graceOptions = a.payload.options;
    });
    b.addCase(grantGrace.fulfilled, (s, a) => void (s.students = s.students.map((x) => (x._id === a.payload._id ? { ...x, ...a.payload } : x))));
    b.addCase(revokeGrace.fulfilled, (s, a) =>
      void (s.students = s.students.map((x) => (x._id === a.payload._id ? { ...x, access: a.payload.access, adminGraceUntil: null, adminGraceDuration: null } : x)))
    );
    trackStatus(b, [fetchMyAccess, fetchWardAccess, fetchStudentAccess, grantGrace, revokeGrace]);
  },
});
export default slice.reducer;
