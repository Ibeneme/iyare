import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Admin, Id, Teacher } from "../../models";
import { setCookie } from "../../../utils/cookies";

export const fetchAdmins = apiThunk<Admin[]>("superAdmin/admins", async (_, api) => (await api.get("/api/super-admin/admins")).data.data);
export const createAdmin = apiThunk<Admin, { email: string; password: string; firstName: string; lastName: string }>("superAdmin/create", async (b, api) => (await api.post("/api/super-admin/admins", b)).data.data);
export const suspendAdmin = apiThunk<{ _id: Id; isSuspended: boolean }, { id: Id; suspended: boolean }>("superAdmin/suspend", async ({ id, suspended }, api) => (await api.patch(`/api/super-admin/admins/${id}/suspend`, { suspended })).data.data);
export const removeAdmin = apiThunk<Id, Id>("superAdmin/remove", async (id, api) => {
  await api.delete(`/api/super-admin/admins/${id}`);
  return id;
});
export const fetchTransferCandidates = apiThunk<Pick<Teacher, "_id" | "firstName" | "lastName" | "email">[]>("superAdmin/candidates", async (_, api) => (await api.get("/api/super-admin/transfer/candidates")).data.data);
/** Hands Super Admin to a teacher. The server returns a fresh (demoted) token for the caller. */
export const transferSuperAdmin = apiThunk<{ token: string }, Id>("superAdmin/transfer", async (teacherId, api) => {
  const r = (await api.post("/api/super-admin/transfer", { teacherId })).data;
  if (r.token) setCookie("token", r.token, 1);
  return { token: r.token };
});

interface State extends AsyncSlice { admins: Admin[]; candidates: Pick<Teacher, "_id" | "firstName" | "lastName" | "email">[] }
const slice = createSlice({
  name: "superAdmin",
  initialState: { ...idle, admins: [], candidates: [] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAdmins.fulfilled, (s, a) => void (s.admins = a.payload));
    b.addCase(createAdmin.fulfilled, (s, a) => void s.admins.unshift(a.payload));
    b.addCase(suspendAdmin.fulfilled, (s, a) => void (s.admins = s.admins.map((x) => (x._id === a.payload._id ? { ...x, isSuspended: a.payload.isSuspended } : x))));
    b.addCase(removeAdmin.fulfilled, (s, a) => void (s.admins = s.admins.filter((x) => x._id !== a.payload)));
    b.addCase(fetchTransferCandidates.fulfilled, (s, a) => void (s.candidates = a.payload));
    trackStatus(b, [fetchAdmins, createAdmin, suspendAdmin, removeAdmin, fetchTransferCandidates, transferSuperAdmin]);
  },
});
export default slice.reducer;
