import React from "react";
import { useParams } from "react-router-dom";
import AdminDashboard from "../Admin/Dashboard/AdminDashboard";

export type FilterType = "all" | "active" | "disabled" | "suspended";

const Dashboard: React.FC = () => {
  const { userType } = useParams<{
    userType?: string;
    filter?: FilterType;
  }>();

  type UserType =
    | "admin"
    | "teacher"
    | "student"
    | "parent"
    | "notFound"
    | "course"
    | "department"
    | "grade";

  const validUserTypes: UserType[] = [
    "admin",
    "parent",
    "student",
    "teacher",
    "notFound",
    "course",
    "department",
    "grade",
  ];

  const resolvedUserType = validUserTypes.includes(userType as UserType)
    ? (userType as UserType)
    : "notFound";

  return (
    <div className="dashboard">
      <AdminDashboard userType={resolvedUserType} />
    </div>
  );
};

export default Dashboard;
