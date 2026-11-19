import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { getCookie } from "../../utils/cookies";
import ThemeToggle from "../../components/common/ThemeToggle";
import useAuth from "../../hooks/useAuth";
import { PATHS } from "../../routes/paths";
import { LogoMark } from "../Shared/index";

const LINKS = [
  { to: PATHS.subjectsOverview, label: "Subjects" },
  { to: PATHS.about, label: "About us" },
  { to: PATHS.pricing, label: "Pricing" },
  { to: PATHS.careers, label: "Careers" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-[var(--lp-green-soft)] text-[var(--lp-green-text)]" : "text-[var(--lp-ink)] hover:bg-[var(--lp-green-soft)]"
  }`;

/** Top bar: text links on the left, round logo in the middle, sign-in / sign-up pills on the right. */
const PublicNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { homePath } = useAuth();
  const signedIn = Boolean(getCookie("token"));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const go = (to: string) => { setOpen(false); navigate(to); };

  return (
    <header className="sticky top-0 z-50">
      <div className="relative" style={{ background: "color-mix(in srgb, var(--lp-bg) 88%, transparent)", backdropFilter: "blur(10px)" }}>
        <nav aria-label="Main navigation" className="lp-container h-20 flex items-center justify-between">
          {/* Left: links (desktop) / menu button (mobile) */}
          <div className="flex items-center">
            <ul className="hidden lg:flex items-center gap-1">
              {LINKS.map((l) => (
                <li key={l.to}><NavLink to={l.to} className={linkClass}>{l.label}</NavLink></li>
              ))}
            </ul>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="lg:hidden w-11 h-11 grid place-items-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-ink)]"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right: theme + sign in / sign up */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block"><ThemeToggle size="sm" /></span>
            {signedIn ? (
              <button onClick={() => go(homePath)} className="lp-btn lp-btn--dark">Open my dashboard</button>
            ) : (
              <>
                <button onClick={() => go(PATHS.signIn)} className="lp-btn lp-btn--outline">Sign in</button>
                <span className="hidden sm:inline-flex"><button onClick={() => go(PATHS.register)} className="lp-btn lp-btn--dark">Get started</button></span>
              </>
            )}
          </div>
        </nav>

        {/* Centre logo, hanging over the bar's bottom edge */}
        <Link
          to="/"
          aria-label="Yare Height home"
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 rounded-full p-1.5"
          style={{ background: "var(--lp-bg)" }}
        >
          <LogoMark size={52} />
        </Link>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] p-5 flex flex-col"
              style={{ background: "var(--lp-bg)", borderRadius: "0 1.75rem 1.75rem 0" }}
              aria-label="Menu"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-[var(--lp-ink)]"><LogoMark size={36} /> Yare Height</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="w-10 h-10 grid place-items-center rounded-full text-[var(--lp-ink)] hover:bg-[var(--lp-green-soft)]"><X size={20} /></button>
              </div>
              <ul className="mt-8 space-y-1">
                {[{ to: "/", label: "Home" }, ...LINKS].map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end onClick={() => setOpen(false)} className={({ isActive }) =>
                      `block px-4 py-3 rounded-2xl text-base font-medium ${isActive ? "bg-[var(--lp-green)] text-white" : "text-[var(--lp-ink)] hover:bg-[var(--lp-green-soft)]"}`}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between px-1 pb-2 text-sm text-[var(--lp-muted)]"><span>Theme</span><ThemeToggle size="sm" /></div>
                {signedIn ? (
                  <button onClick={() => go(homePath)} className="lp-btn lp-btn--dark w-full">Open my dashboard</button>
                ) : (
                  <>
                    <button onClick={() => go(PATHS.signIn)} className="lp-btn lp-btn--outline w-full">Sign in</button>
                    <button onClick={() => go(PATHS.register)} className="lp-btn lp-btn--dark w-full">Get started</button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
