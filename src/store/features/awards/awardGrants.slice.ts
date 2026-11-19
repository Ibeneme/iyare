import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { AwardGrant, Id, PerkKind } from "../../models";

export interface AwardInput { title: string; description?: string; studentId: Id; perk: { kind: PerkKind; discountPercent?: number; note?: string; expiresAt?: string | null } }

export const fetchAllAwards = apiThunk<AwardGrant[]>("awardGrants/all", async (_, api) => (await api.get("/api/awards")).data.data);
export const fetchMyAwards = apiThunk<AwardGrant[]>("awardGrants/mine", async (_, api) => (await api.get("/api/awards/mine")).data.data);
export const issueAward = apiThunk<AwardGrant, AwardInput>("awardGrants/issue", async (b, api) => (await api.post("/api/awards", b)).data.data);
export const updateAward = apiThunk<AwardGrant, { id: Id; changes: Partial<AwardInput> }>("awardGrants/update", async ({ id, changes }, api) => (await api.put(`/api/awards/${id}`, changes)).data.data);
export const deleteAward = apiThunk<Id, Id>("awardGrants/delete", async (id, api) => {
  await api.delete(`/api/awards/${id}`);
  return id;
});
export const redeemFreeMonth = apiThunk<{ award: AwardGrant }, Id>("awardGrants/redeem", async (id, api) => (await api.post(`/api/awards/${id}/redeem`)).data.data);

interface State extends AsyncSlice { items: AwardGrant[] }
const slice = createSlice({
  name: "awardGrants",
  initialState: { ...idle, items: [] } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAllAwards.fulfilled, (s, a) => void (s.items = a.payload));
    b.addCase(fetchMyAwards.fulfilled, (s, a) => void (s.items = a.payload));
    b.addCase(issueAward.fulfilled, (s, a) => void s.items.unshift(a.payload));
    b.addCase(updateAward.fulfilled, (s, a) => void (s.items = s.items.map((x) => (x._id === a.payload._id ? { ...x, ...a.payload, studentId: x.studentId } : x))));
    b.addCase(deleteAward.fulfilled, (s, a) => void (s.items = s.items.filter((x) => x._id !== a.payload)));
    b.addCase(redeemFreeMonth.fulfilled, (s, a) => void (s.items = s.items.map((x) => (x._id === a.payload.award._id ? { ...x, perk: a.payload.award.perk } : x))));
    trackStatus(b, [fetchAllAwards, fetchMyAwards, issueAward, updateAward, deleteAward, redeemFreeMonth]);
  },
});
export default slice.reducer;
