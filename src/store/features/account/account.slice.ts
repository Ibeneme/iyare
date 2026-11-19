import { apiThunk } from "../../api";

/** POST /api/accounts/change-password: any signed-in role. No state to keep; callers read the thunk result. */
export const changePassword = apiThunk<string, { currentPassword: string; newPassword: string }>("account/changePassword", async (b, api) =>
  (await api.post("/api/accounts/change-password", b)).data.message
);
