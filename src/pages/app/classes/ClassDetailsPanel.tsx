import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import WarningNotice from "./WarningNotice";
import JoinClassButton from "./JoinClassButton";
import useUserRole from "../../../hooks/useUserRole";

interface ClassDetailsProps {
  classData: {
    title?: string;
    status: string;
    date: string;
    time: string;
    duration: number;
    courseId?: { title?: string; name?: string };
    gradeId?: { title?: string; name?: string };
    departmentId?: { title?: string; name?: string };
    teacherId?: { firstName?: string; lastName?: string };
    _id?: string;
  };
  handleOpenUpdateModal?: () => void;
  handleOpenDeleteModal?: () => void;
}

const formatDateTime = (date: string, time: string) => {
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} at ${time}`;
};

const ClassDetailsComponent: React.FC<ClassDetailsProps> = ({
  classData,
  handleOpenUpdateModal,
  handleOpenDeleteModal,
}) => {
  const { title, status, date, time, duration, teacherId, _id } = classData;
  const { userRole } = useUserRole();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return "badge-green";
      case "upcoming":
        return "badge-blue";
      case "finished":
        return "badge-gray";
      case "canceled":
        return "badge-red";
      default:
        return "badge-gray";
    }
  };

  return (
    <div className="page max-w-4xl">
      {/* Header card */}
      <div className="card p-6 sm:p-8 text-center space-y-4">
        <span className={`badge ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <h1 className="page-title">{title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{formatDateTime(date, time)}</p>
        <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
          <JoinClassButton classId={_id} classTitle={title || ""} />
          {userRole === "admin" && (
            <>
              <button onClick={handleOpenUpdateModal} className="btn-secondary btn-sm">
                <FaEdit className="w-3.5 h-3.5" />
                Update class
              </button>
              <button onClick={handleOpenDeleteModal} className="btn-danger btn-sm">
                <FaTrash className="w-3.5 h-3.5" />
                Delete class
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="stat-label">Date &amp; time</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">{formatDateTime(date, time)}</p>
        </div>
        <div>
          <p className="stat-label">Duration</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">{duration} minutes</p>
        </div>
        <div>
          <p className="stat-label">Teacher</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
            {teacherId?.firstName} {teacherId?.lastName}
          </p>
        </div>
      </div>

      <WarningNotice />
    </div>
  );
};

export default ClassDetailsComponent;
