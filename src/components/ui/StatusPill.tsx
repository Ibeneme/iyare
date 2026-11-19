import React from "react";

type Tone = "green" | "yellow" | "red" | "blue" | "gray";

/** Maps the server's status words (transaction, task, class, access) to a badge colour. */
const TONE: Record<string, Tone> = {
  success: "green", paid: "green", live: "green", done: "green", full: "green", active: "green", trial: "green",
  pending: "yellow", scheduled: "yellow", in_progress: "yellow", expiry_grace: "yellow", admin_grace: "blue", grace: "blue",
  failed: "red", lapsed: "red", trial_ended: "red", read_only: "red", critical: "red", abandoned: "gray",
  todo: "gray", off: "gray", ended: "gray",
  info: "blue", warning: "yellow",
};

const LABEL: Record<string, string> = {
  in_progress: "In progress", todo: "To do", expiry_grace: "Grace period", admin_grace: "Admin grace",
  trial_ended: "Trial ended", read_only: "View only", lapsed: "View only",
};

const StatusPill: React.FC<{ status: string; label?: string }> = ({ status, label }) => (
  <span className={`badge-${TONE[status] ?? "gray"}`}>{label ?? LABEL[status] ?? status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}</span>
);

export default StatusPill;
