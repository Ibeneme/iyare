import { getCookie, clearAuthCookies } from "./cookies";
import { signInPathFor } from "../config/roles";

/**
 * Reads a JWT's `exp` claim locally — no network call — and reports whether
 * it's already passed. Lets a route guard trust the token it already has
 * instead of hitting the server and blocking the page on every navigation.
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(decodeURIComponent(escape(atob(base64))));
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const userString = getCookie("user");
    const tokenString = getCookie("token");
    if (!userString || !tokenString) {
      return false;
    }
    if (isTokenExpired(tokenString)) {
      return false;
    }
    const user = JSON.parse(userString);
    return !!user;
  } catch {
    return false;
  }
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