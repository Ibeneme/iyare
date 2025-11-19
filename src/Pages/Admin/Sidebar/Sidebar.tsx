import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Book,
  GraduationCap,
  Users,
  UserCog,
  UserCheck,
  UserX,
  Lock,
  BookOpen,
  Trophy,
  FileText,
  ClipboardList,
  CreditCard,
  Settings,
  Calendar,
  Ban,
  Clock,
  // ArrowUpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
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

  // Get role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("userType");
    setUserRole(role || null);
  }, []);

  const toggleCollapse = (title: string) => {
    setActiveCollapse((prev) => (prev === title ? null : title));
  };

  // Dynamic gradient & bg based on role
  const getRoleStyles = () => {
    switch (userRole) {
      case "student":
        return {
          //  bg: "bg-[#023009]",
          bg: "bg-gray-900",
          border: "border-[#FFD000]",
          textHover: "hover:text-[#FFD000]",
          activeText: "text-[#FFD000]",
          activeShadow: "shadow-[#FFD000]",
          iconActive: "text-[#FFD000]",
        };
      case "teacher":
        return {
          // bg: "bg-[#023009]",
          bg: "bg-gray-900",
          border: "border-[#FFD000]",
          textHover: "hover:text-[#FFD000]",
          activeText: "text-[#FFD000]",
          activeShadow: "shadow-[#FFD000]",
          iconActive: "text-[#FFD000]",
        };
      case "parent":
        return {
          bg: "bg-gray-900",
          border: "border-[#FFD000]",
          textHover: "hover:text-[#FFD000]",
          activeText: "text-[#FFD000]",
          activeShadow: "shadow-[#FFD000]",
          iconActive: "text-[#FFD000]",

          // bg: "bg-[#350854]",
          // border: "border-[#FFD000]",
          // textHover: "hover:text-[#FFD000]",
          // activeText: "text-[#FFD000]",
          // activeShadow: "shadow-[#FFD000]",
          // iconActive: "text-[#FFD000]",
        };
      case "admins":
        return {
          //  bg: "bg-[#121212]",
          border: "border-[#FFD000]",
          textHover: "hover:text-[#FFD000]",
          activeText: "text-[#FFD000]",
          activeShadow: "shadow-[#FFD000]",
          iconActive: "text-[#FFD000]",
        };
      default:
        return {
          bg: "bg-gray-900",
          border: "border-[#FFD000]",
          textHover: "hover:text-[#FFD000]",
          activeText: "text-[#FFD000]",
          activeShadow: "shadow-[#FFD000]",
          iconActive: "text-[#FFD000]",
        };
    }
  };

  const styles = getRoleStyles();

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

    // { grade-manager
    //   title: "Classes",
    //   icon: LayoutDashboard,
    //   path: "/classes",
    //   type: "collapsible",
    //   allowedRoles: ["admin", "teacher", "student", "parent"],
    //   children: [
    //     {
    //       title: "Your Classes",
    //       icon: ArrowUpCircle,
    //       path: "/classes/dashboard/all",
    //       type: "link",
    //       allowedRoles: ["teacher", "student", "parent"],
    //     },
    //     {
    //       title: "All Classes",
    //       icon: ClipboardList,
    //       path: "/classes/dashboard/all",
    //       type: "link",
    //       allowedRoles: ["admin"],
    //     },
    //   ],
    // },

    //timetable

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
      title: "Admins",
      icon: UserCog,
      path: "/admins",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Admins",
          icon: Users,
          path: "/admin/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Admins",
          icon: UserCheck,
          path: "/admin/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Disabled Admins",
          icon: UserX,
          path: "/admin/dashboard/disabled",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Students",
      icon: GraduationCap,
      path: "/students",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Students",
          icon: Users,
          path: "/student/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Students",
          icon: UserCheck,
          path: "/student/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Parents",
      icon: Users,
      path: "/parents",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Parents",
          icon: Users,
          path: "/parent/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Parents",
          icon: UserCheck,
          path: "/parent/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Disabled Parents",
          icon: UserX,
          path: "/parent/dashboard/disabled",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Teachers",
      icon: Book,
      path: "/teachers",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Teachers",
          icon: Users,
          path: "/teacher/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Teachers",
          icon: UserCheck,
          path: "/teacher/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Suspended Teachers",
          icon: Lock,
          path: "/teacher/dashboard/suspended",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    // {
    //   title: "Awards",
    //   icon: Trophy,
    //   path: "/awards",
    //   type: "link",
    //   allowedRoles: ["admin", "teacher", "student"],
    // },

    {
      title: "Reports",
      icon: FileText,
      path: "/reports",
      type: "link",
      allowedRoles: ["admin"],
    },

    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
    {
      title: "Guide",
      icon: FaGuilded,
      path: "/guide-parents",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"],
    },
  ];

  const getFilteredSidebarData = (): SidebarItem[] => {
    if (!userRole) return [];

    return sidebarData
      .filter((item) => item.allowedRoles.includes(userRole))
      .map((item) => {
        if (item.type === "collapsible" && item.children) {
          const filteredChildren = item.children.filter((child) =>
            child.allowedRoles.includes(userRole)
          );
          return filteredChildren.length > 0
            ? { ...item, children: filteredChildren }
            : { ...item, children: undefined, type: "link" as const };
        }
        return item;
      });
  };

  const filteredSidebarData = getFilteredSidebarData();

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`hidden md:flex fixed inset-y-0 left-0 w-72 ${styles.bg} backdrop-blur-xl border-r ${styles.border} text-white flex-col gap-2 p-5  z-50`}
      >
        <div className="mb-6  z-20">
          {/* <h1 className="text-[24px] font-bold text-[#FFD000] p-2">
            Hi,{" "}
            {userRole
              ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
              : ""}
          </h1> */}
          <div className="p-3 bg-[#FFD00021] rounded-[64px] flex items-center justify-center gap-2">
            <BookOpen className="text-[#FFD000] w-4 h-4" />
            <h1 className="text-[14px] font-bold text-[#FFD000]">
              Yare Height Learning Hub
            </h1>
          </div>
        </div>

        <div className="space-y-1 mt-0 overflow-y-auto scrollbar-hide">
          {filteredSidebarData.map((item) => {
            const isActiveParent =
              item.type === "collapsible" &&
              item.path &&
              location.pathname.startsWith(item.path);

            const isOpen = activeCollapse === item.title;

            return (
              <div key={item.title}>
                {item.type === "link" && item.path ? (
                  <NavLink to={item.path}>
                    {({ isActive }) => (
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isActive ? styles.activeText : "text-gray-300"
                        } ${styles.textHover}`}
                      >
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </motion.div>
                    )}
                  </NavLink>
                ) : (
                  <div>
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCollapse(item.title)}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-sm font-medium transition-all ${
                        isActiveParent ? styles.activeText : "text-gray-300"
                      } ${styles.textHover}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isOpen && item.children && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="ml-8 mt-2 space-y-1 overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <NavLink key={child.path} to={child.path!}>
                              {({ isActive }) => (
                                <motion.div
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`flex items-center gap-3 px-3 py-4 rounded-lg text-sm transition-all ${
                                    isActive
                                      ? `${styles.activeText} font-medium`
                                      : "text-gray-400 hover:text-gray-100"
                                  }`}
                                >
                                  <child.icon size={16} />
                                  <span>{child.title}</span>
                                </motion.div>
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

      {/* Mobile Bottom Nav */}
      <BottomNav
        filteredSidebarData={filteredSidebarData}
        location={location}
        styles={styles}
      />
    </div>
  );
};

// Mobile Bottom Nav with Role-Based Colors
export const BottomNav: React.FC<{
  filteredSidebarData: SidebarItem[];
  location: ReturnType<typeof useLocation>;
  styles: any;
}> = ({ filteredSidebarData, location, styles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const topLevelItems = filteredSidebarData
    .map((item): { title: string; icon: any; path: string } | null => {
      if (
        item.type === "collapsible" &&
        item.children &&
        item.children.length > 0
      ) {
        const firstChild = item.children[0];
        if (firstChild.path) {
          return {
            title: firstChild.title,
            icon: firstChild.icon,
            path: firstChild.path,
          };
        }
      }
      if (item.path) {
        return { title: item.title, icon: item.icon, path: item.path };
      }
      return null;
    })
    .filter(
      (item): item is { title: string; icon: any; path: string } =>
        item !== null
    );

  return (
    <>
      {/* Dashboard Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen((prev) => !prev)}
        className={`md:hidden fixed bottom-6 left-[42%] w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center shadow-lg z-[99999999] border ${styles.border}`}
      >
        {isModalOpen ? (
          <X size={32} className={styles.iconActive} />
        ) : (
          <LayoutDashboard size={32} className={styles.iconActive} />
        )}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`md:hidden fixed inset-x-4 bottom-24 max-h-[70vh] ${styles.bg} backdrop-blur-2xl rounded-3xl z-50 overflow-hidden  flex flex-col`}
            >
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  {topLevelItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsModalOpen(false)}
                        className="flex flex-col items-center p-3 rounded-2xl transition-all"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex flex-col items-center space-y-2 w-full ${
                            isActive
                              ? `${styles.activeText} ${styles.activeShadow}`
                              : "text-gray-300"
                          }`}
                        >
                          <item.icon size={28} />
                          <span className="text-xs font-medium text-center leading-tight">
                            {item.title}
                          </span>
                        </motion.div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
