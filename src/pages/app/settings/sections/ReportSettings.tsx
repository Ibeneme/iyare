import { getCookie,  } from "../../../../utils/cookies";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { submitReport } from "../../../../store/features/settings/settings.slice";
import { useToast } from "../../../../contexts/ToastContext";
import { AppDispatch } from "../../../../store/index";
import {
  FiAlertCircle,
  FiMessageSquare,
  FiMail,
  FiSend,
  FiShield,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";

const SettingReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("yare@admin.com");

  useEffect(() => {
    const storedEmail = getCookie("yareemail");
    if (storedEmail && storedEmail.includes("@")) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resultAction = await dispatch(
        submitReport({
          email,
          title: reportTitle,
          description: reportDescription,
        })
      );

      if (submitReport.fulfilled.match(resultAction)) {
        addToast(
          "success",
          "Submission successful. Our team will review this incident."
        );
        setReportTitle("");
        setReportDescription("");
      } else {
        throw new Error("Synchronization Error: Could not transmit report.");
      }
    } catch (err: any) {
      addToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl text-left">
      {/* Header Context */}
      <header className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg text-[10px] font-semibold  tracking-tight border border-[var(--color-card-border)]">
          <FiAlertCircle size={12} className="text-[var(--color-warning)]" /> Support Desk
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight leading-none">
          Send a Report
        </h1>
        <p className="text-[var(--color-muted)] font-semibold max-w-xl text-sm leading-relaxed">
          Encountered a technical anomaly? Provide the details below. Our
          security and support units monitor these transmissions 24/7.
        </p>
      </header>

      <div className="gap-10">
        {/* Form Section */}
        {/* Sidebar Info */}
        <aside className="space-y-6">
          <div className="p-8 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-3xl relative overflow-hidden">
            <FiShield className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--color-primary)]  tracking-tight">
                  Direct Contact
                </h4>
                <p className="text-[11px] text-[var(--color-muted)] font-semibold leading-relaxed">
                  For urgent security breaches, use our direct administrative
                  line:
                </p>
              </div>

              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 p-4 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl group transition-all hover:border-[var(--color-primary)]"
              >
                <div className="p-2 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-fg)] transition-colors">
                  <FiMail size={16} />
                </div>
                <span className="text-xs font-semibold text-[var(--color-primary)] tracking-tight truncate">
                  {email}
                </span>
              </a>

              <div className="pt-4 border-t border-[var(--color-card-border)]">
                <p className="text-[9px] font-semibold text-[var(--color-muted)]  tracking-[0.2em] leading-loose">
                  Response Window: <br />
                  <span className="text-[var(--color-success)]">
                    Within 24 Business Hours
                  </span>
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[var(--color-muted)]  tracking-tight ml-1">
                Subject Title
              </label>
              <div className="relative">
                <FiMessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="e.g., Dashboard synchronization delay"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-[var(--color-muted)]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[var(--color-muted)]  tracking-tight ml-1">
                Detailed Description
              </label>
              <textarea
                placeholder="Please describe the issue or suggestion in detail..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={6}
                className="w-full p-5 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-[var(--color-muted)] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 w-full md:w-auto px-12 py-5 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-full font-semibold text-[11px]  tracking-[0.2em] shadow-[var(--shadow-elevated)] hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <FiSend className="group-hover:translate-x-1 transition-transform" />
              )}
              {loading ? "Transmitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-16 text-center text-[9px] font-semibold text-[var(--color-muted)]  tracking-[0.4em]">
        Yare Hub Support Protocol • Feedback Node v2.1
      </p>
    </div>
  );
};

export default SettingReport;
