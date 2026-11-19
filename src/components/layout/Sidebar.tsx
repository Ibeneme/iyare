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
}> = ({ onNavigate, onClose }) => {
  const { role, displayName, email, logout, isSuperAdmin, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
    () => navForRole(role, NAV_ITEMS, isSuperAdmin),
    [role, isSuperAdmin],
  );
  const footer = useMemo(
    () => navForRole(role, FOOTER_ITEMS, isSuperAdmin),
    [role, isSuperAdmin],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return main;
    const flat: NavItem[] = [];
    main.forEach((i) =>
      i.children
        ? flat.push(
            ...i.children.map((c) => ({
              ...c,
              title: `${i.title} · ${c.title}`,
            })),
          )
        : flat.push(i),
    );
    return flat.filter((i) => i.title.toLowerCase().includes(q));
  }, [main, query]);

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
                onClick={logout}
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
          className={`flex items-center gap-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] p-2.5 transition-colors ${focusRingClass}`}
        >
          <Avatar
            name={displayName}
            email={email}
            src={user?.avatarUrl || user?.profilePicture}
            size={36}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-white/65 truncate">
              {email || (role ? ROLE_LABEL[role] : "")}
            </p>
          </div>
          <ChevronsUpDown size={15} className="text-white/45 shrink-0" />
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Desktop: floating panel */}
      <aside
        aria-label="Sidebar"
        className="hidden lg:block fixed left-4 top-4 bottom-4 w-[16rem] rounded-[1.75rem] p-4 z-40 bg-[var(--color-sidebar-bg)] border border-white/10"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <PanelContent />
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
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
