import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  ChevronsUpDown,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import Avatar from "../ui/Avatar";
import useAuth from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FOOTER_ITEMS,
  NAV_ITEMS,
  navForRole,
  type NavItem,
} from "../../config/navigation";
import { ROLE_LABEL } from "../../config/roles";
import { PATHS } from "../../routes/paths";

/** True when another menu entry lives below this path (e.g. /app/notifications and /app/notifications/preferences), so only an exact match lights up. */
const ALL_PATHS = [...NAV_ITEMS, ...FOOTER_ITEMS]
  .flatMap((i) => [i.path, ...(i.children?.map((c) => c.path) ?? [])])
  .filter(Boolean) as string[];
const hasSubPath = (p: string) =>
  ALL_PATHS.some((o) => o !== p && o.startsWith(p + "/"));

const focusRingClass =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-sidebar-bg)]";

const linkClass = (active: boolean) =>
  `group flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${focusRingClass} ${
    active
      ? "bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)] shadow-sm"
      : "text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white active:scale-[0.99]"
  }`;

const HIDDEN_STUDENT_KEYWORDS = ["grade", "grades", "fee", "fees"];
const HIDDEN_PARENT_TEACHER_KEYWORDS = ["grade", "grades"];

const matchesKeywords = (item: NavItem, keywords: string[]): boolean => {
  const title = (item.title || "").trim().toLowerCase();
  const path = (item.path || "").trim().toLowerCase();
  return keywords.some(
    (kw) =>
      title === kw ||
      title.startsWith(`${kw} `) ||
      title.endsWith(` ${kw}`) ||
      path === `/${kw}` ||
      path.startsWith(`/${kw}/`) ||
      path.includes(`/${kw}`),
  );
};

const isHiddenForRole = (
  item: NavItem,
  flags: { isStudent: boolean; isParentOrTeacher: boolean },
): boolean => {
  if (flags.isStudent && matchesKeywords(item, HIDDEN_STUDENT_KEYWORDS)) {
    return true;
  }
  if (
    flags.isParentOrTeacher &&
    matchesKeywords(item, HIDDEN_PARENT_TEACHER_KEYWORDS)
  ) {
    return true;
  }
  return false;
};

const getRoleFlags = (
  role: string | null | undefined,
  isSuperAdmin?: boolean,
) => {
  const normalized = (role || "").trim().toLowerCase();
  const isStudent = !isSuperAdmin && normalized === "student";
  const isParentOrTeacher =
    !isSuperAdmin && (normalized === "parent" || normalized === "teacher");
  return { isStudent, isParentOrTeacher };
};

const filterItemsForRole = (
  items: NavItem[],
  role: string | null | undefined,
  isSuperAdmin?: boolean,
): NavItem[] => {
  const roleFiltered = navForRole(role, items, isSuperAdmin);
  const flags = getRoleFlags(role, isSuperAdmin);
  if (!flags.isStudent && !flags.isParentOrTeacher) return roleFiltered;

  return roleFiltered
    .filter((item) => !isHiddenForRole(item, flags))
    .map((item) => {
      if (!item.children?.length) return item;
      const validChildren = item.children.filter(
        (child) => !isHiddenForRole(child, flags),
      );
      return { ...item, children: validChildren };
    })
    .filter((item) => !item.children || item.children.length > 0);
};

const getAccountRoleLabel = (
  role?: string | null,
  isSuperAdmin?: boolean,
): string => {
  if (isSuperAdmin || role === "superadmin") return "Super Admin";
  if (!role) return "Account";
  const normalized = role.toLowerCase();
  if (ROLE_LABEL[normalized as keyof typeof ROLE_LABEL]) {
    return ROLE_LABEL[normalized as keyof typeof ROLE_LABEL];
  }
  switch (normalized) {
    case "student":
      return "Student";
    case "parent":
      return "Parent";
    case "teacher":
      return "Teacher";
    case "admin":
      return "Admin";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const getRoleBadgeStyle = (role?: string | null, isSuperAdmin?: boolean) => {
  const normalized = isSuperAdmin ? "superadmin" : (role || "").toLowerCase();
  switch (normalized) {
    case "admin":
    case "superadmin":
      return "bg-amber-400/20 text-amber-200 border-amber-300/30";
    case "teacher":
      return "bg-sky-400/20 text-sky-200 border-sky-300/30";
    case "parent":
      return "bg-purple-400/20 text-purple-200 border-purple-300/30";
    case "student":
    default:
      return "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/35";
  }
};

const Brand: React.FC = () => (
  <Link
    to="/"
    className={`flex items-center gap-2.5 rounded-2xl px-1.5 py-1 transition-opacity hover:opacity-95 ${focusRingClass}`}
    aria-label="Yare Height home"
  >
    <span className="w-9 h-9 rounded-xl bg-[var(--color-accent)] grid place-items-center shrink-0 transition-transform duration-200 group-hover:scale-105">
      <GraduationCap size={18} className="text-[var(--color-accent-fg)]" />
    </span>
    <span className="font-semibold tracking-tight text-white truncate">
      Yare Height
    </span>
  </Link>
);

interface LogoutConfirmModalProps {
  isOpen: boolean;
  isSigningOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  isSigningOut,
  onCancel,
  onConfirm,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSigningOut) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSigningOut, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          aria-describedby="logout-modal-desc"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSigningOut && onCancel()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-[var(--color-sidebar-bg)] border border-white/15 p-5 text-white"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-danger)]/15 text-[var(--color-danger)] grid place-items-center shrink-0">
                <LogOut size={19} />
              </div>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={onCancel}
                aria-label="Close confirmation dialog"
                className={`w-8 h-8 grid place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 ${focusRingClass}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3.5 space-y-1.5">
              <h2
                id="logout-modal-title"
                className="text-base font-semibold tracking-tight text-white"
              >
                Sign out of your account?
              </h2>
              <p
                id="logout-modal-desc"
                className="text-sm text-white/70 leading-relaxed"
              >
                You will need to sign in again to access your courses, classes,
                and account settings.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                ref={cancelBtnRef}
                type="button"
                disabled={isSigningOut}
                onClick={onCancel}
                className={`px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50 ${focusRingClass}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={onConfirm}
                className={`px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 ${focusRingClass}`}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const NavList: React.FC<{ items: NavItem[]; onNavigate?: () => void }> = ({
  items,
  onNavigate,
}) => {
  const { pathname } = useLocation();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (
          item.children?.some((c) => c.path && pathname.startsWith(c.path)) &&
          next[item.title] === undefined
        ) {
          next[item.title] = true;
        }
      });
      return next;
    });
  }, [pathname, items]);

  const toggleGroup = (title: string, defaultExpanded: boolean) => {
    setOpenMap((prev) => {
      const current = prev[title] !== undefined ? prev[title] : defaultExpanded;
      return { ...prev, [title]: !current };
    });
  };

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        if (!item.children) {
          return (
            <li key={item.title}>
              <NavLink
                to={item.path!}
                end={hasSubPath(item.path!)}
                onClick={onNavigate}
                className={({ isActive }) => linkClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive ? "scale-105" : "group-hover:translate-x-0.5"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        }

        const childActive = item.children.some(
          (c) => c.path && pathname.startsWith(c.path),
        );
        const expanded =
          openMap[item.title] !== undefined ? openMap[item.title] : childActive;

        return (
          <li key={item.title} className="space-y-1">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggleGroup(item.title, childActive)}
              className={`w-full justify-between ${linkClass(childActive)}`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <item.icon
                  size={18}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                />
                <span className="truncate">{item.title}</span>
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden ml-5 pl-3 border-l border-white/15 space-y-0.5"
                >
                  {item.children.map((c) => (
                    <li key={c.title}>
                      <NavLink
                        to={c.path!}
                        end={hasSubPath(c.path!)}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 ${focusRingClass} ${
                            isActive
                              ? "bg-white/10 text-[var(--color-accent)] font-semibold"
                              : "text-[var(--color-sidebar-text)] hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                          }`
                        }
                      >
                        <span className="truncate">{c.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
};

/** Everything inside the panel; used by the desktop sidebar and the mobile drawer. */
const PanelContent: React.FC<{
  onNavigate?: () => void;
  onClose?: () => void;
  onRequestLogout: () => void;
}> = ({ onNavigate, onClose, onRequestLogout }) => {
  const { role, displayName, email, isSuperAdmin, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const accountRoleLabel = getAccountRoleLabel(role, isSuperAdmin);
  const roleBadgeStyle = getRoleBadgeStyle(role, isSuperAdmin);
  const roleFlags = getRoleFlags(role, isSuperAdmin);

  // Press "/" anywhere to jump to the menu search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        e.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const main = useMemo(
    () => filterItemsForRole(NAV_ITEMS, role, isSuperAdmin),
    [role, isSuperAdmin],
  );
  const footer = useMemo(
    () => filterItemsForRole(FOOTER_ITEMS, role, isSuperAdmin),
    [role, isSuperAdmin],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return main;
    const flat: NavItem[] = [];
    main.forEach((i) => {
      if (isHiddenForRole(i, roleFlags)) return;
      if (i.children) {
        i.children
          .filter((c) => !isHiddenForRole(c, roleFlags))
          .forEach((c) =>
            flat.push({
              ...c,
              title: `${i.title} · ${c.title}`,
            }),
          );
      } else {
        flat.push(i);
      }
    });
    return flat.filter((i) => i.title.toLowerCase().includes(q));
  }, [main, query, roleFlags]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Top header */}
      <div className="flex items-center justify-between px-1 pt-0.5 shrink-0">
        <Brand />
        <div className="flex items-center gap-1">
          <Link
            to={PATHS.notifications}
            onClick={onNavigate}
            aria-label="Notifications"
            className={`w-9 h-9 grid place-items-center rounded-full text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white transition-colors ${focusRingClass}`}
          >
            <Bell size={18} />
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className={`w-9 h-9 grid place-items-center rounded-full text-[var(--color-sidebar-text)] hover:bg-white/10 hover:text-white transition-colors ${focusRingClass}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative shrink-0">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
        />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu..."
          aria-label="Search menu"
          className="w-full h-10 pl-9 pr-9 rounded-full bg-white/10 text-sm text-white placeholder:text-white/50 outline-none border border-white/10 transition-all duration-200 hover:bg-white/[0.13] focus:bg-white/[0.14] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/40"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/70 bg-white/10 border border-white/10 rounded-md px-1.5 py-0.5">
          /
        </kbd>
      </div>

      {/* Scrollable navigation + flowing utility items (Settings, Dark mode, Sign out) */}
      <nav
        aria-label="Main"
        className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 py-0.5 space-y-2"
      >
        {filtered.length ? (
          <NavList items={filtered} onNavigate={onNavigate} />
        ) : (
          <p className="text-xs text-white/60 px-3.5 py-6 text-center">
            No matching menu items
          </p>
        )}

        <div className="pt-2 border-t border-white/10">
          <ul className="space-y-1">
            {footer.map((i) => (
              <li key={i.title}>
                <NavLink
                  to={i.path!}
                  end={hasSubPath(i.path!)}
                  onClick={onNavigate}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <i.icon
                        size={18}
                        className={`shrink-0 transition-transform duration-200 ${
                          isActive ? "scale-105" : "group-hover:translate-x-0.5"
                        }`}
                      />
                      <span className="truncate">{i.title}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full ${linkClass(false)}`}
              >
                {isDark ? (
                  <Sun
                    size={18}
                    className="shrink-0 transition-transform duration-200 group-hover:rotate-45"
                  />
                ) : (
                  <Moon
                    size={18}
                    className="shrink-0 transition-transform duration-200 group-hover:-rotate-12"
                  />
                )}
                <span className="truncate">
                  {isDark ? "Light mode" : "Dark mode"}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onRequestLogout}
                className={`w-full ${linkClass(false)} hover:!bg-[var(--color-danger)]/15 hover:!text-[var(--color-danger)]`}
              >
                <LogOut
                  size={18}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                />
                <span className="truncate">Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Pinned account footer card */}
      <div className="pt-2 border-t border-white/10 shrink-0">
        <div
          tabIndex={0}
          aria-label={`${displayName} — ${accountRoleLabel} account`}
          className={`flex items-center gap-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] p-2.5 transition-colors ${focusRingClass}`}
        >
          <Avatar
            name={displayName}
            email={email}
            src={user?.avatarUrl || user?.profilePicture}
            size={36}
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {displayName}
              </p>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0 ${roleBadgeStyle}`}
              >
                <ShieldCheck size={10} />
                {accountRoleLabel}
              </span>
              {email && (
                <span className="text-xs text-white/60 truncate">{email}</span>
              )}
            </div>
          </div>
          <ChevronsUpDown size={15} className="text-white/45 shrink-0" />
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const handleConfirmLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
    } finally {
      setIsSigningOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  return (
    <>
      {/* Desktop: floating panel */}
      <aside
        aria-label="Sidebar"
        className="hidden lg:block fixed left-4 top-4 bottom-4 w-[16rem] rounded-[1.75rem] p-4 z-40 bg-[var(--color-sidebar-bg)] border border-white/10"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <PanelContent onRequestLogout={() => setConfirmLogoutOpen(true)} />
      </aside>

      {/* Mobile / tablet: top bar + drawer */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 flex items-center justify-between px-4 bg-[var(--color-sidebar-bg)] border-b border-white/10">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className={`w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors ${focusRingClass}`}
        >
          <Menu size={18} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="lg:hidden fixed left-3 top-3 bottom-3 w-[min(20rem,calc(100vw-1.5rem))] rounded-[1.75rem] p-4 z-50 bg-[var(--color-sidebar-bg)] border border-white/10"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <PanelContent
                onNavigate={() => setOpen(false)}
                onClose={() => setOpen(false)}
                onRequestLogout={() => setConfirmLogoutOpen(true)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <LogoutConfirmModal
        isOpen={confirmLogoutOpen}
        isSigningOut={isSigningOut}
        onCancel={() => setConfirmLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Sidebar;
