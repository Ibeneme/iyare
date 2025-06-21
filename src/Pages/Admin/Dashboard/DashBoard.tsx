import React from "react";
import { useParams } from "react-router-dom";
import AdminDashboard from "../Admin/Dashboard/AdminDashboard";
import { FilterType, UserType } from "../Admin/Dashboard/AdminDashboard"; // import UserType and FilterType

const Dashboard: React.FC = () => {
  const { userType, filter } = useParams<{
    userType?: string;
    filter?: FilterType;
  }>();

  const validUserTypes: UserType[] = [
    "admin",
    "parent",
    "student",
    "teacher",
    "notFound",
    "course",
    "department",
    "grade"
  ];
  const resolvedUserType = validUserTypes.includes(userType as UserType)
    ? (userType as UserType)
    : "notFound";

  return (
    <div className="dashboard">
      <AdminDashboard userType={resolvedUserType} initialFilter={filter} />
    </div>
  );
};

export default Dashboard;
