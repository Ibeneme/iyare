import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCookie } from "../../../utils/cookies";
import type { ServerRole, UserType } from "../../models";

/** Who is signed in. Mirrors the JWT: userType + (for Super Admins) role "superadmin". */
export interface SessionState {
  userType: UserType | null;
  role: ServerRole | null;
  user: Record<string, any> | null;
}

const read = (): SessionState => {
  const ut = getCookie("userType") as UserType | undefined;
  let user: Record<string, any> | null = null;
  try {
    const raw = getCookie("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  const userType = ut && ["admin", "teacher", "student", "parent"].includes(ut) ? ut : null;
  const role = (user?.role === "superadmin" ? "superadmin" : userType) as ServerRole | null;
  return { userType, role, user };
};

const slice = createSlice({
  name: "session",
  initialState: read(),
  reducers: {
    sessionRefreshed: () => read(),
    sessionStarted: (_s, a: PayloadAction<SessionState>) => a.payload,
    sessionCleared: () => ({ userType: null, role: null, user: null }),
  },
});

export const { sessionRefreshed, sessionStarted, sessionCleared } = slice.actions;
export const selectIsSuperAdmin = (s: { session: SessionState }) => s.session.role === "superadmin";
export default slice.reducer;
