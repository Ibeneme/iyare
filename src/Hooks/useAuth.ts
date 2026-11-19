import { useCallback, useMemo } from "react";
import { getCookie } from "../utils/cookies";
import { isRole, can as canDo, HOME_BY_ROLE, type Permission, type Role } from "../config/roles";
import { logout } from "../utils/auth";

export interface AuthUser {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
  [key: string]: any;
}

/**
 * Who is signed in and what they may see.
 * Role comes from the `userType` cookie set at sign-in.
 */
const useAuth = () => {
  const roleCookie = getCookie("userType");
  const role: Role | null = isRole(roleCookie) ? roleCookie : null;

  const user: AuthUser | null = useMemo(() => {
    try {
      const raw = getCookie("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Account";

  const can = useCallback((p: Permission) => canDo(role, p), [role]);

  return {
    role,
    user,
    displayName,
    email: user?.email as string | undefined,
    isAdmin: role === "admin",
    /** The Super Admin signs in as an admin; the server marks them with role "superadmin". */
    isSuperAdmin: role === "admin" && user?.role === "superadmin",
    isTeacher: role === "teacher",
    isStudent: role === "student",
    isParent: role === "parent",
    homePath: role ? HOME_BY_ROLE[role] : "/",
    can,
    logout,
  };
};

export default useAuth;
