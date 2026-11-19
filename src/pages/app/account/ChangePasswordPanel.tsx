import { useState } from "react";
import { CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../../store";
import { changePassword } from "../../../store/features/account/account.slice";
import { Panel } from "../../../components/ui";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object" && "message" in payload) {
    const msg = (payload as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

/** "Change password" block for the profile page (all roles). */
export default function ChangePasswordPanel() {
  const dispatch = useAppDispatch();
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const mismatch = f.again !== "" && f.next !== f.again;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (f.next.length < 8) {
      const msg = "Use at least 8 characters";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    if (mismatch) {
      const msg = "The new passwords do not match";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    setBusy(true);
    const payload = { currentPassword: f.current, newPassword: f.next };
    console.log("[ChangePasswordPanel] Submitting payload:", payload);

    const r = await dispatch(changePassword(payload));
    setBusy(false);

    console.log("[ChangePasswordPanel] Thunk result:", r);

    if (changePassword.fulfilled.match(r)) {
      const msg = extractMessage(r.payload, "Password changed");
      console.log("[ChangePasswordPanel] Success:", msg);
      setFeedback({ type: "success", message: msg });
      toast.success(msg);
      setF({ current: "", next: "", again: "" });
    } else {
      const msg = extractMessage(
        r.payload ?? r.error?.message,
        "Failed to change password"
      );
      console.error("[ChangePasswordPanel] Error:", msg);
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    }
  };

  const field = (
    k: "current" | "next" | "again",
    label: string,
    auto: string
  ) => (
    <label className="block">
      <span className="form-label">{label}</span>
      <input
        required
        type={show ? "text" : "password"}
        autoComplete={auto}
        className="form-input"
        value={f[k]}
        onChange={(e) => {
          if (feedback) setFeedback(null);
          setF({ ...f, [k]: e.target.value });
        }}
      />
    </label>
  );

  return (
    <Panel
      title="Change password"
      subtitle="Choose something you do not use anywhere else."
    >
      <form onSubmit={submit} className="space-y-4">
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 items-end">
          {field("current", "Current password", "current-password")}
          {field("next", "New password", "new-password")}
          {field("again", "Repeat new password", "new-password")}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            {show ? <EyeOff size={15} /> : <Eye size={15} />} Show passwords
          </label>

          <div className="flex items-center gap-3">
            {mismatch && (
              <span className="text-sm text-red-600">
                Passwords do not match
              </span>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <KeyRound size={16} /> {busy ? "Saving…" : "Update password"}
            </button>
          </div>
        </div>
      </form>
    </Panel>
  );
}