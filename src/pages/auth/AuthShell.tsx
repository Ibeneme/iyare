import AnnouncementBar from "../../components/common/AnnouncementBar";
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import ThemeToggle from "../../components/common/ThemeToggle";
import { PATHS } from "../../routes/paths";
import "../../Landing/Landing.css";
import "./auth.css";
import { LogoMark, PersonAvatar, Plus, Ring, Sparkle } from "../../Landing/Shared/index";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Small pill shown above the title, e.g. "Signing in as Parent" */
  badge?: React.ReactNode;
  /** Card width: sm = sign in, lg = multi-step forms */
  width?: "sm" | "lg" | "xl";
  showHomeLink?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const WIDTHS = { sm: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

/** Green showcase panel shown beside the sign-in forms on large screens. */
const ShowcasePanel: React.FC = () => (
  <aside aria-hidden="true" className="hidden lg:flex relative overflow-hidden rounded-[2rem] flex-col justify-between p-10 m-4 mr-0" style={{ background: "var(--lp-green-deep)", color: "#fff" }}>
    <Sparkle className="absolute right-10 top-10 lp-bob" size={34} />
    <Ring className="absolute right-16 bottom-24 opacity-70" color="var(--lp-yellow)" />
    <Plus className="absolute left-1/2 top-1/2" color="var(--lp-green-mid)" />

    <Link to={PATHS.home} className="relative flex items-center gap-3" tabIndex={-1}>
      <LogoMark size={44} />
      <span className="text-xl font-semibold tracking-tight">Yare Height</span>
    </Link>

    <div className="relative">
      <h2 className="lp-h2" style={{ fontSize: "clamp(2rem,3.4vw,3rem)" }}>
        Learning that fits{" "}
        <span className="lp-highlight lp-highlight--yellow">right at home.</span>
      </h2>
      <p className="mt-4 text-white/70 max-w-sm leading-relaxed">
        Live classes, homework and progress updates, all waiting for you after sign-in.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm">
        <div className="rounded-3xl p-4 -rotate-2" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>
          <p className="font-semibold text-sm">Homework</p>
          <ul className="mt-3 space-y-2">
            {[true, true, false].map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full grid place-items-center border-2 ${d ? "bg-[var(--lp-green-deep)] border-[var(--lp-green-deep)] text-white" : "border-[var(--lp-green-deep)]/40"}`}>{d && <Check size={9} strokeWidth={4} />}</span>
                <span className="lp-skeleton" style={{ width: i === 1 ? "55%" : "75%", background: "rgba(45,55,25,.2)" }} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl p-4 rotate-2" style={{ background: "var(--lp-green)" }}>
          <p className="font-semibold text-sm">Today</p>
          <div className="mt-3 flex items-center gap-2">
            <PersonAvatar variant={2} size={34} />
            <PersonAvatar variant={1} size={34} />
            <PersonAvatar variant={4} size={34} />
          </div>
          <span className="lp-skeleton block mt-3" style={{ width: "80%" }} />
        </div>
      </div>
    </div>

    <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Yare Height Learning Hub</p>
  </aside>
);

/** Shared frame for every auth screen: cream canvas, green showcase panel (sign-in) or centred card (long forms). */
const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, badge, width = "sm", showHomeLink = true, footer, children }) => {
  const split = width === "sm";

  const card = (
    <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`w-full ${WIDTHS[width]} mx-auto`}>
      {!split || true ? (
        <Link to={PATHS.home} className={`flex items-center justify-center gap-2.5 mb-6 ${split ? "lg:hidden" : ""}`} aria-label="Yare Height home">
          <LogoMark size={40} />
          <span className="font-semibold tracking-tight text-primary text-lg">Yare Height</span>
        </Link>
      ) : null}

      <section className="card-elevated p-6 sm:p-8" style={{ borderRadius: "2rem" }}>
        <header className="text-center mb-7">
          {badge && <div className="mb-3 flex justify-center">{badge}</div>}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
        </header>
        {children}
      </section>

      {footer}
      {showHomeLink && (
        <div className="text-center mt-5">
          <Link to={PATHS.home} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      )}
    </motion.main>
  );

  return (
    <div className="landing auth-scope min-h-screen relative">
      <AnnouncementBar signedIn={false} />
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle size="sm" />
      </div>
      {split ? (
        <div className="min-h-screen grid lg:grid-cols-[1fr_1.05fr]">
          <ShowcasePanel />
          <div className="flex items-center justify-center px-4 py-14">{card}</div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center px-4 py-14">{card}</div>
      )}
    </div>
  );
};

/** Pill progress bar for multi-step forms. */
export const Stepper: React.FC<{ step: number; total: number; labels?: string[] }> = ({ step, total, labels }) => (
  <div className="mb-7" role="group" aria-label={`Step ${step} of ${total}`}>
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-current={i + 1 === step ? "step" : undefined}
          className="h-1.5 flex-1 rounded-full transition-colors"
          style={{ background: i + 1 <= step ? "var(--lp-green)" : "var(--lp-green-soft)" }}
        />
      ))}
    </div>
    <p className="text-xs text-muted mt-2 text-center">
      Step {step} of {total}
      {labels?.[step - 1] ? ` · ${labels[step - 1]}` : ""}
    </p>
  </div>
);

/** Inline error / success message. */
export const AuthNotice: React.FC<{ tone: "error" | "success"; children: React.ReactNode }> = ({ tone, children }) => (
  <p
    role={tone === "error" ? "alert" : "status"}
    className={`text-sm text-center rounded-xl px-4 py-3 ${tone === "error" ? "badge-red !rounded-xl" : "badge-green !rounded-xl"} w-full justify-center`}
  >
    {children}
  </p>
);

export default AuthShell;
