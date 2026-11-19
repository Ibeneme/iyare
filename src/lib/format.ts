import type { Currency } from "../store/models";

/** Server stores money in major units (₦ / $). */
export const money = (n: number | undefined, c: Currency = "NGN") =>
  new Intl.NumberFormat(c === "NGN" ? "en-NG" : "en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n ?? 0);

export const day = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-";

export const personName = (p: unknown): string => {
  if (!p || typeof p === "string") return "";
  const o = p as { firstName?: string; lastName?: string; email?: string };
  return [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || "";
};

export const GRACE_LABEL: Record<string, string> = { "3d": "3 days", "1w": "1 week", "4w": "4 weeks", "3m": "3 months" };
export const trialLabel = (d: number) => (d % 7 === 0 ? `${d / 7} week${d === 7 ? "" : "s"}` : `${d} days`);
