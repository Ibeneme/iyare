import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";
//import { MdDashboard, MdMenuBook } from "react-icons/md";

import {
  FaTachometerAlt, // For Dashboard
  FaUsers, // General Users/Groups
  FaUserCog, // Admins (User with a cog for settings/control)
  FaUserGraduate, // Students
  FaUserFriends, // Parents
  FaChalkboardTeacher, // Teachers
  FaBookOpen, // Courses / All Classes
  FaCogs, // Settings
  FaRegFileAlt,
  FaCalendarTimes, // Missed/Cancelled Classes
  FaClock, // In-Class / Ongoing
  FaBan, // Suspended / Cancelled
  FaCalendarAlt, // General Calendar
  FaRegListAlt, // All (for lists)
  FaUserCheck, // Active Users
  FaUserSlash, // Disabled Users
  FaUserLock, // Suspended Users
  FaHandPaper,
  FaArrowAltCircleUp,
  FaSyncAlt,
  FaCheck,
  FaPaypal,
} from "react-icons/fa";
import { BottomNav } from "./BottomNav";

const Sidebar: React.FC = () => {
  const [activeCollapse, setActiveCollapse] = useState<string | null>(null);
  //const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Set initial state correctly

  const location = useLocation();
  //const navigate = useNavigate();

  // Handle responsive detection
  useEffect(() => {
    const handleResize = () => {
      // const mobile = window.innerWidth <= 768;
      // setIsMobile((prev) => {
      //   if (prev !== mobile) return mobile;
      //   return prev;
      // });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check on initial load
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = (option: string) => {
    setActiveCollapse((prev) => (prev === option ? null : option));
  };

  // const hideBackArrowRoutes = [
  //   "/classes/dashboard/all",
  //   "/classes/dashboard/ongoing",
  //   "/classes/dashboard/cancelled",
  //   "/classes/dashboard/finished",
  //   "/admin/dashboard/all",
  //   "/admin/dashboard/active",
  //   "/admin/dashboard/disabled",
  //   "/reports",
  //   "/student/dashboard/all",
  //   "/student/dashboard/active",
  //   "/student/dashboard/missed3Classes",
  //   "/student/dashboard/upcomingClass",
  //   "/student/dashboard/disabled",
  //   "/student/dashboard/reported",

  //   "/parent/dashboard/all",
  //   "/parent/dashboard/active",
  //   "/parent/dashboard/disabled",
  //   "/parent/dashboard/reported",

  //   "/teacher/dashboard/all",
  //   "/teacher/dashboard/active",
  //   "/teacher/dashboard/suspended",
  //   "/teacher/dashboard/inClass",
  //   "/teacher/dashboard/upcomingClasses",
  //   "/teacher/dashboard/reported",
  //   "/teacher/dashboard/disabled",

  //   "/settings",

  //   // "/department/dashboard/all",
  //   // "/department/dashboard/active",
  //   // "/department/dashboard/suspended",

  //   "/course/dashboard/all",
  //   "/course/dashboard/active",
  //   // "/course/dashboard/suspended",
  // ];

  //const showBackArrow = !hideBackArrowRoutes.includes(location.pathname);
  //const showBottomNav = hideBackArrowRoutes.includes(location.pathname);

  const sidebarData = [
    {
      title: "Classes",
      icon: FaTachometerAlt,
      path: "/classes",
      type: "collapsible",
      allowedRoles: ["admin", "teacher", "student", "parent"],
      children: [
        {
          title: "Your Classes",
          icon: FaArrowAltCircleUp,
          path: "/classes/dashboard/all",
          type: "link",
          allowedRoles: [, "teacher", "student", "parent"],
        },

        {
          title: "All Classes",
          icon: FaSyncAlt,
          path: "/classes/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        // {
        //   title: "Ongoing Classes",
        //   icon: FaSyncAlt,
        //   path: "/classes/dashboard/ongoing",
        //   type: "link",
        //   allowedRoles: ["admin", "teacher", "student", "parent"],
        // },
        // {
        //   title: "Upcoming Classes",
        //   icon: FaArrowAltCircleUp,
        //   path: "/classes/dashboard/upcoming",
        //   type: "link",
        //   allowedRoles: ["admin", "teacher", "student", "parent"],
        // },
        // {
        //   title: "Finished Classes",
        //   icon: FaHourglassEnd,
        //   path: "/classes/dashboard/finished",
        //   type: "link",
        //   allowedRoles: ["admin", "teacher", "student", "parent"],
        // },
        // {
        //   title: "Cancelled Classes",
        //   icon: FaBan,
        //   path: "/classes/dashboard/cancelled",
        //   type: "link",
        //   allowedRoles: ["admin", "teacher", "student", "parent"],
        // },
      ],
    },
    {
      title: "Updates",
      icon: FaRegFileAlt,
      path: "/assignments",
      type: "link",
      allowedRoles: ["student", "parent", "teacher"],
    },

    {
      title: "Enrolled",
      icon: FaUserCheck,
      path: "/parents-kins",
      type: "link",
      allowedRoles: ["parent", "student"],
    },
    {
      title: "Subscriptions",
      icon: FaPaypal,
      path: "/subscriptions-history",
      type: "link",
      allowedRoles: ["parent", "student", "admin"],
    },

    //subscriptions-history
    //parents-kins
    {
      title: "Admins",
      icon: FaUserCog,
      path: "/admins",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Admins",
          icon: FaUsers,
          path: "/admin/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Admins",
          icon: FaUserCheck,
          path: "/admin/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Disabled Admins",
          icon: FaUserSlash,
          path: "/admin/dashboard/disabled",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Students",
      icon: FaUserGraduate,
      path: "/students",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Students",
          icon: FaUsers,
          path: "/student/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Students",
          icon: FaUserCheck,
          path: "/student/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Missed 3 Classes",
          icon: FaCalendarTimes,
          path: "/student/dashboard/missed-3-classes",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Upcoming Classes",
          icon: FaCalendarAlt,
          path: "/student/dashboard/upcoming-classes",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Parents",
      icon: FaUserFriends,
      path: "/parents",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Parents",
          icon: FaUsers,
          path: "/parent/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Parents",
          icon: FaUserCheck,
          path: "/parent/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Disabled Parents",
          icon: FaUserSlash,
          path: "/parent/dashboard/disabled",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      title: "Teachers",
      icon: FaChalkboardTeacher,
      path: "/teachers",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Teachers",
          icon: FaUsers,
          path: "/teacher/dashboard/all",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Active Teachers",
          icon: FaUserCheck,
          path: "/teacher/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Suspended Teachers",
          icon: FaUserLock,
          path: "/teacher/dashboard/suspended",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "In-Class Teachers",
          icon: FaClock,
          path: "/teacher/dashboard/in-class",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Upcoming Classes Teachers",
          icon: FaCalendarAlt,
          path: "/teacher/dashboard/upcoming-classes",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Reported Teachers",
          icon: FaHandPaper,
          path: "/teacher/dashboard/reported",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },

    {
      title: "Awards",
      icon: FaBookOpen,
      path: "/awards",
      //type: "collapsible",
      type: "link",
      allowedRoles: ["admin", "teacher", "student"],
      // children: [
      //   {
      //     title: "New Awards",
      //     icon: FaCheck,
      //     path: "/awards",
      //     type: "link",
      //     allowedRoles: ["admin", "teacher", "student"],
      //   },

      //   {
      //     title: "All Awards",
      //     icon: FaRegListAlt,
      //     path: "/awards/all",
      //     type: "link",
      //     allowedRoles: ["admin", "teacher", "student"],
      //   },
      //   {
      //     title: "Your Awards History",
      //     icon: FaBan,
      //     path: "/awards/suspended",
      //     type: "link",
      //     allowedRoles: ["admin", "teacher", "student"],
      //   },
      // ],
    },

    {
      title: "Courses",
      icon: FaBookOpen,
      path: "/courses",
      type: "collapsible",
      allowedRoles: ["admin"],
      children: [
        {
          title: "All Courses",
          icon: FaRegListAlt,
          path: "/course/dashboard/all",
          type: "link",
         // allowedRoles: ["admin"],
         allowedRoles: ["admin", "teacher", "parent", "student"],
        },
        {
          title: "Active Courses",
          icon: FaCheck,
          path: "/course/dashboard/active",
          type: "link",
          allowedRoles: ["admin"],
        },
        {
          title: "Suspended Courses",
          icon: FaBan,
          path: "/course/dashboard/suspended",
          type: "link",
          allowedRoles: ["admin"],
        },
      ],
    },

    {
      title: "Reports",
      icon: FaRegFileAlt,
      path: "/reports",
      type: "link",
      allowedRoles: ["admin"],
    },
    {
      title: "Enrolled Courses",
      icon: FaRegFileAlt,
      path: "/enrolled-courses",
      type: "link",
      allowedRoles: ["teacher", "student", "parent"],
    },


    {
      title: "Settings",
      icon: FaCogs,
      path: "/settings",
      type: "link",
      allowedRoles: ["admin", "teacher", "student", "parent"], // Visible to all
    },
  ];

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem("userType");
    if (userString) {
      try {
        setUserRole(userString || null);
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
        setUserRole(null);
      }
    }
  }, []);
  // Define a type for a single sidebar item to keep the code clean
  interface SidebarItem {
    title: string;
    icon: React.ComponentType;
    path?: string | any; // Optional for collapsible items
    type: "link" | "collapsible" | any;
    allowedRoles: string[];
    children?: SidebarItem[];
  }
  const getFilteredSidebarData = (): SidebarItem[] => {
    if (!userRole) {
      return [];
    }

    const filteredItems = sidebarData.filter((item) =>
      item.allowedRoles.includes(userRole)
    );

    return filteredItems.map((item) => {
      if (item.type === "collapsible" && item.children) {
        const filteredChildren = item.children.filter((child) =>
          child.allowedRoles.includes(userRole)
        );

        // If no children match, remove the `children` property entirely
        if (filteredChildren.length === 0) {
          const { children, ...rest } = item;
          return rest;
        }

        return { ...item, children: filteredChildren };
      }

      return item;
    });
  };

  const filteredSidebarData = getFilteredSidebarData();

  return (
    <div className="sidebar-wrapper">
      <BottomNav filteredSidebarData={filteredSidebarData} />
      {/* {showBackArrow && (
        <div className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <MdArrowBack size={24} />
          </button>
        </div>
      )} */}
      <div className="sidebar">
        {filteredSidebarData.map((item) => {
          if (item.type === "link") {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-option ${
                  location.pathname === item.path ? "active-link" : ""
                }`}
              >
                <item.icon />
                <span style={{ fontSize: 13 }}>{item.title}</span>
              </NavLink>
            );
          }

          if (item.type === "collapsible") {
            return (
              <div key={item.title} className="sidebar-collapsible">
                <div
                  className={`sidebar-option ${
                    location?.pathname?.startsWith(item?.path?.slice(0, -1)) ||
                    location?.pathname === "/classes/dashboard/active"
                      ? "active-link"
                      : ""
                  }`}
                  style={{ fontSize: 13 }}
                  onClick={() => toggleCollapse(item.title)}
                >
                  <item.icon />
                  <span style={{ fontSize: 13 }}>{item.title}</span>
                </div>

                {activeCollapse === item.title && item.children && (
                  <div className="sidebar-suboptions">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          isActive ? "active-link" : ""
                        }
                      >
                        {({ isActive }) => (
                          <div
                            style={{
                              fontSize: 13,
                              textDecorationLine: "none",
                              padding: 16,
                              borderRadius: 12,
                              backgroundColor: isActive
                                ? "#ffffff15"
                                : "transparent", // Replace with the desired color
                              color: isActive ? "white" : "white", // Replace with the desired color
                            }}
                          >
                            <span
                              style={{ color: isActive ? "white" : "white" }}
                            >
                              {child.title}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Sidebar;
