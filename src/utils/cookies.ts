/**
 * Cookie utility — replaces all localStorage auth helpers.
 * Uses secure, SameSite=Strict cookies for auth tokens and user data.
 */

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "Strict" as const,
  secure: location.protocol === "https:",
};

function serializeOptions(opts: Record<string, string | boolean>): string {
  return Object.entries(opts)
    .map(([k, v]) => (v === true ? k : v === false ? "" : `${k}=${v}`))
    .filter(Boolean)
    .join("; ");
}

export function setCookie(
  name: string,
  value: string,
  maxAgeDays = 7
): void {
  const opts: Record<string, string | boolean> = {
    path: COOKIE_OPTIONS.path,
    SameSite: COOKIE_OPTIONS.sameSite,
    "max-age": String(maxAgeDays * 24 * 60 * 60),
  };
  if (COOKIE_OPTIONS.secure) opts["Secure"] = true;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${serializeOptions(opts)}`;
}

export function getCookie(name: string): string | null {
  const key = encodeURIComponent(name) + "=";
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(key));
  return cookie ? decodeURIComponent(cookie.slice(key.length)) : null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0`;
}

export function clearAuthCookies(): void {
  [
    "token",
    "user",
    "userType",
    "userId",
    "userEmail",
    "loginTimeReadable",
    "yareadmintoken",
  ].forEach(deleteCookie);
}

export function setAuthCookies(payload: {
  token: string;
  user: any;
  userType: string;
}): void {
  setCookie("token", payload.token);
  setCookie("user", JSON.stringify(payload.user));
  setCookie("userType", payload.userType);
  setCookie("userId", (payload.user as any)?._id || "");
  setCookie("userEmail", (payload.user as any)?.email || "");
  setCookie("loginTimeReadable", new Date().toISOString());
}
