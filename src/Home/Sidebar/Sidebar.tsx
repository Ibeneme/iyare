import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdMenuBook,
  MdGroups,
  MdSettings,
  MdArrowBack,
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const [activeCollapse, setActiveCollapse] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleCollapse = (option: string) => {
    setActiveCollapse((prev) => (prev === option ? null : option));
  };

  const bottomNavRoutes = [
    "/dashboard",
    "/courses/list",
    "/students/list",
    "/settings",
  ];

  const showBottomNav = bottomNavRoutes.includes(location.pathname);

  const sidebarData = [
    {
      title: "Dashboard",
      icon: MdDashboard,
      path: "/dashboard",
      type: "collapsible",
      //   children: [
      //     { title: "Users", path: "/dashboard/users", type: "collapsible", children: [
      //       { title: "All Users", path: "/dashboard/users/list" },
      //       { title: "Add User", path: "/dashboard/users/add" },
      //     ] },
      //     { title: "Parents", path: "/dashboard/parents", type: "collapsible", children: [
      //       { title: "All Parents", path: "/dashboard/parents/list" },
      //       { title: "Add Parent", path: "/dashboard/parents/add" },
      //     ] },
      //     { title: "Admins", path: "/dashboard/admins", type: "collapsible", children: [
      //       { title: "All Admins", path: "/dashboard/admins/list" },
      //       { title: "Add Admin", path: "/dashboard/admins/add" },
      //     ] },
      //     { title: "Teachers", path: "/dashboard/teachers", type: "collapsible", children: [
      //       { title: "All Teachers", path: "/dashboard/teachers/list" },
      //       { title: "Add Teacher", path: "/dashboard/teachers/add" },
      //     ] },
      //   ],
    },

    {
      title: "Admins",
      icon: MdSettings,
      path: "/admins",
      type: "collapsible",
      children: [
        { title: "All Admins", path: "/admin/dashboard/all" },
        { title: "Active Admins", path: "/admin/dashboard/active" },
        { title: "Disabled Admins", path: "/admin/dashboard/disabled" },
        // { title: "Add Admin", path: "/admin/add" },
      ],
    },

    {
      title: "Students",
      icon: MdGroups,
      path: "/students",
      type: "collapsible",
      children: [
        { title: "All Students", path: "/student/dashboard/all" },
        { title: "Active Students", path: "/student/dashboard/active" },
        {
          title: "Missed 3 Classes",
          path: "/student/dashboard/missed-3-classes",
        },
        {
          title: "Upcoming Classes",
          path: "/student/dashboard/upcoming-classes",
        },
        // { title: "Add Student", path: "/student/add" },
      ],
    },

    {
      title: "Parents",
      icon: MdGroups,
      path: "/parents",
      type: "collapsible",
      children: [
        { title: "All Parents", path: "/parent/dashboard/all" },
        { title: "Active Parents", path: "/parent/dashboard/active" },
        { title: "Disabled Parents", path: "/parent/dashboard/disabled" },
        //{ title: "Add Parent", path: "/parent/add" },
      ],
    },
    {
      title: "Teachers",
      icon: MdGroups,
      path: "/teachers",
      type: "collapsible",
      children: [
        { title: "All Teachers", path: "/teacher/dashboard/all" },
        { title: "Active Teachers", path: "/teacher/dashboard/active" },
        { title: "Suspended Teachers", path: "/teacher/dashboard/suspended" },
        { title: "In-Class Teachers", path: "/teacher/dashboard/in-class" },
        {
          title: "Upcoming Classes Teachers",
          path: "/teacher/dashboard/upcoming-classes",
        },
        { title: "Reported Teachers", path: "/teacher/dashboard/reported" },
        // { title: "Add Teacher", path: "/teacher/add" },
      ],
    },

    {
      title: "Department",
      icon: MdMenuBook,
      path: "/departments",
      type: "collapsible",
      children: [
        { title: "All Departments", path: "/department/dashboard/all" },
        { title: "Active Departments", path: "/department/dashboard/active" },
        {
          title: "Suspended Departments",
          path: "/department/dashboard/suspended",
        },
      ],
    },

    {
      title: "Courses",
      icon: MdMenuBook,
      path: "/courses",
      type: "collapsible",
      children: [
        { title: "All Courses", path: "/course/dashboard/all" },
        { title: "Active Courses", path: "/course/dashboard/active" },
        { title: "Suspended Courses", path: "/course/dashboard/suspended" },
      ],
    },
    {
      title: "Settings",
      icon: MdSettings,
      path: "/settings",
      type: "link",
    },
  ];

  return (
    <div className="sidebar-wrapper">
      {/* Web Sidebar */}
      <div className="sidebar">
        {sidebarData.map((item) => {
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
                <span>{item.title}</span>
              </NavLink>
            );
          }

          if (item.type === "collapsible") {
            return (
              <div key={item.title} className="sidebar-collapsible">
                <div
                  className={`sidebar-option ${
                    location?.pathname?.startsWith(item?.path?.slice(0, -1))
                      ? "active-link"
                      : ""
                  }`}
                  onClick={() => toggleCollapse(item.title)}
                >
                  <item.icon />
                  <span>{item.title}</span>
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

      {!showBottomNav && (
        <div className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <MdArrowBack size={24} />
          </button>
        </div>
      )}

      {showBottomNav && (
        <div className="bottom-nav">
          <NavLink to="/dashboard" className="bottom-option">
            <MdDashboard />
          </NavLink>
          <NavLink to="/courses/list" className="bottom-option">
            <MdMenuBook />
          </NavLink>
          <NavLink to="/students/list" className="bottom-option">
            <MdGroups />
          </NavLink>
          <NavLink to="/settings" className="bottom-option">
            <MdSettings />
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
