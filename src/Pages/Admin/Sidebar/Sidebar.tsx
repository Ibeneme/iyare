import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Book,
  GraduationCap,
  UserCog,
  UserCheck,
  BookOpen,
  FileText,
  ClipboardList,
  CreditCard,
  Settings,
  Calendar,
  ChevronRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { FaGuilded } from "react-icons/fa6";
import { MdGrading } from "react-icons/md";

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  path?: string;
  type: "link" | "collapsible";
  allowedRoles: string[];
  children?: SidebarItem[];
}

const Sidebar: React.FC = () => {
  const [activeCollapse, setActiveCollapse] = useState<string | null>(null);
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userType");
    setUserRole(role || null);
  }, []);

  const toggleCollapse = (title: string) => {
    setActiveCollapse((prev) => (prev === title ? null : title));
  };

  // PREMIUM STYLING CONSTANTS
  const styles = {
    bg: "bg-[#064e3b]", // Deep Emerald
    border: "border-emerald-800/50",
    activeBg: "bg-yellow-400", // Amber Gold
    activeText: "text-yellow-400",
    textMuted: "text-emerald-100/60",
    textHover: "hover:text-yellow-400 hover:bg-white/5",
  };

  const sidebarData: SidebarItem[] = [
    {
      title: "Subjects",
      icon: BookOpen,
      path: "/subject-manager",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
    {
      title: "Classes",
      icon: LayoutDashboard,
      path: "/classes-manager",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
    {
      title: "Timetable",
      icon: Calendar,
      path: "/timetable",
      type: "link",
      allowedRoles: ["student", "parent", "teacher", "admin"],
    },
    {
      title: "Grades",
      icon: MdGrading,
      path: "/grade-manager",
      type: "link",
      allowedRoles: ["parent", "student", "admin"],
    },
    {
      title: "Lesson Fees",
      icon: CreditCard,
      path: "/lesson-manager",
      type: "link",
      allowedRoles: ["parent", "student", "admin"],
    },
    {
      title: "Updates",
      icon: ClipboardList,
      path: "/assignments",
      type: "link",
      allowedRoles: ["student", "parent", "teacher", "admin"],
    },
    {
      title: "Enrolled",
      icon: UserCheck,
      path: "/profiles",
      type: "link",
      allowedRoles: ["parent", "student"],
    },
    {
      title: "Management",
      icon: ShieldCheck,
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "Admins",
          icon: UserCog,
          path: "/admin/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Students",
          icon: GraduationCap,
          path: "/student/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Teachers",
          icon: Book,
          path: "/teacher/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Reports",
      icon: FileText,
      path: "/reports",
      type: "link",
      allowedRoles: ["admin"],
    },
    {
      title: "Guide",
      icon: FaGuilded,
      path: "/guide-parents",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
  ];

  const filteredSidebarData = sidebarData.filter((item) =>
    item.allowedRoles.includes(userRole || "")
  );

  return (
    <div className="flex font-sans">
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`hidden md:flex fixed inset-y-0 left-0 w-72 bg-emerald-950 border-r ${styles.border} text-white flex-col gap-2 p-6 z-50`}
      >
        {/* Brand Logo */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-400/20">
              <GraduationCap className="text-[#064e3b]" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">
                YARE HEIGHT
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300/60">
                Learning Hub
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredSidebarData.map((item) => {
            const isOpen = activeCollapse === item.title;
            const isCollapsibleActive = item.children?.some(
              (child) => location.pathname === child.path
            );

            return (
              <div key={item.title}>
                {item.type === "link" ? (
                  <NavLink to={item.path!}>
                    {({ isActive }) => (
                      <motion.div
                        whileHover={{ x: 5 }}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${
                          isActive
                            ? "bg-yellow-400 text-[#064e3b] shadow-xl shadow-black/10"
                            : `${styles.textMuted} ${styles.textHover}`
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={isActive ? "text-[#064e3b]" : ""}
                        />
                        <span>{item.title}</span>
                      </motion.div>
                    )}
                  </NavLink>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleCollapse(item.title)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${
                        isCollapsibleActive
                          ? "text-yellow-400"
                          : styles.textMuted
                      } ${styles.textHover}`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon size={20} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-300 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && item.children && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-6 mt-1 space-y-1 border-l border-emerald-800/50"
                        >
                          {item.children.map((child) => (
                            <NavLink key={child.path} to={child.path!}>
                              {({ isActive }) => (
                                <div
                                  className={`flex items-center gap-3 px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
                                    isActive
                                      ? "text-yellow-400"
                                      : "text-emerald-200/40 hover:text-emerald-100"
                                  }`}
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isActive
                                        ? "bg-yellow-400"
                                        : "bg-emerald-800"
                                    }`}
                                  />
                                  {child.title}
                                </div>
                              )}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <BottomNav
        filteredSidebarData={filteredSidebarData}
        location={location}
        styles={styles}
      />
    </div>
  );
};

export const BottomNav: React.FC<{
  filteredSidebarData: SidebarItem[];
  location: ReturnType<typeof useLocation>;
  styles: any;
}> = ({ filteredSidebarData, location }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Fab */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(!isModalOpen)}
        className="md:hidden fixed bottom-8 left-[45%] w-16 h-16 bg-emerald-950  rounded-full flex items-center justify-center shadow-2xl z-[100] border-4 border-[#064e3b]"
      >
        {isModalOpen ? (
          <X size={28} className="text-yellow-400" />
        ) : (
          <LayoutDashboard size={28} className="text-yellow-400" />
        )}
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="md:hidden fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-40"
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="md:hidden fixed inset-x-6 bottom-28 bg-emerald-950  border border-white/10 rounded-[2.5rem] z-50 overflow-hidden shadow-2xl"
            >
              <div className="p-8 grid grid-cols-3 gap-y-8 gap-x-4">
                {filteredSidebarData.map((item) => {
                  const targetPath =
                    item.path || (item.children ? item.children[0].path : "/");
                  const isActive = location.pathname === targetPath;

                  return (
                    <NavLink
                      key={item.title}
                      to={targetPath!}
                      onClick={() => setIsModalOpen(false)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div
                        className={`p-4 rounded-2xl transition-all ${
                          isActive
                            ? "bg-yellow-400 text-[#064e3b]"
                            : "bg-white/5 text-emerald-100"
                        }`}
                      >
                        <item.icon size={24} />
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest text-center ${
                          isActive ? "text-yellow-400" : "text-emerald-300/60"
                        }`}
                      >
                        {item.title}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
