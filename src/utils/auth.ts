import { getCookie, clearAuthCookies } from "./cookies";
import { signInPathFor } from "../config/roles";

export const isAuthenticated = (): boolean => {
  try {
    const userString = getCookie("user");
    const tokenString = getCookie("token");
    if (userString && tokenString) {
      const user = JSON.parse(userString);
      return !!user;
    }
  } catch {
    return false;
  }
  return false;
};


/**
 * Sign the user out and send them to the sign-in screen for their account type
 * (admins -> /admin-sign-in, everyone else -> /sign-in?type=<role>).
 * A full page load is used on purpose so no signed-in data stays in memory.
 */
export const logout = (): void => {
  const role = getCookie("userType");
  clearAuthCookies();
  window.location.replace(signInPathFor(role));
};
