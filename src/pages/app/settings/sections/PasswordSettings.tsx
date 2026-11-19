import React, { useState } from "react";
import {
  KeyRound,
  ShieldAlert,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";


const SettingChangePassword: React.FC = () => {
  const [isSent, setIsSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSendRequest = () => {
    setIsPending(true);
    // Simulate API delay
    setTimeout(() => {
      console.log("Password change request sent!");
      setIsPending(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <header className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg text-[10px] font-semibold  tracking-tight border border-[var(--color-card-border)]">
          <KeyRound size={12} /> Security Protocol
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight">
          Credential Reset
        </h1>
      </header>

      {/* Security Notice Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
          {/* Visual Indicator */}
          <div className="flex-shrink-0">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-500 ${
                isSent
                  ? "bg-[#1b2030] text-white"
                  : "bg-yellow-400 text-[var(--color-primary)]"
              }`}
            >
              {isSent ? <CheckCircle2 size={40} /> : <ShieldAlert size={40} />}
            </div>
          </div>

          {/* Narrative Content */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight ">
                {isSent
                  ? "Verification Initialized"
                  : "Manual Authentication Required"}
              </h3>
              <p className="text-[var(--color-muted)] font-semibold leading-relaxed text-sm max-w-lg">
                For the protection of your administrative data, password
                modifications must be verified by our security team. Click below
                to initiate a secure encrypted token request to your registered
                device.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={isPending || isSent}
                onClick={handleSendRequest}
                className={`flex items-center justify-center gap-3 px-10 py-5 rounded-full font-semibold  tracking-tight text-[11px] transition-all transform active:scale-95 shadow-[var(--shadow-elevated)] ${
                  isSent
                    ? "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-card-border)] cursor-default"
                    : "bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:brightness-110"
                }`}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isSent ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Send size={18} />
                )}
                {isPending
                  ? "Processing..."
                  : isSent
                  ? "Request Dispatched"
                  : "Send Change Request"}
              </button>

              {isSent && (
                <button
                  onClick={() => setIsSent(false)}
                  className="px-6 py-5 text-[10px] font-semibold  tracking-tight text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Resend Request?
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Background Symbol */}
        <KeyRound className="absolute -bottom-10 -right-10 w-64 h-64 text-[var(--color-subtle)] opacity-20 rotate-12 pointer-events-none" />
      </div>

      {/* Security Best Practices */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "Encryption", val: "AES-256 Bit Standard" },
          { label: "Verification", val: "Manual Support Audit" },
        ].map((stat, i) => (
          <div
            key={i}
            className="px-6 py-4 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl flex justify-between items-center"
          >
            <span className="text-[9px] font-semibold text-[var(--color-muted)]  tracking-tight">
              {stat.label}
            </span>
            <span className="text-xs font-semibold text-[var(--color-primary)]  tracking-tight">
              {stat.val}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-[9px] font-semibold text-[var(--color-muted)]  tracking-[0.4em]">
        Identity Shield v4.2 • Yare Learning Hub
      </p>
    </div>
  );
};

export default SettingChangePassword;
