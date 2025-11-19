import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import WarningNotice from "./WarningNotice";
import JoinClassButton from "./JoinClassButton";
import useUserRole from "../../../Hooks/useUserRole";
import { motion } from "framer-motion";

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
        return "bg-emerald-100 text-emerald-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "finished":
        return "bg-gray-100 text-gray-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="px-4 md:px-0">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-24 px-6  mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">{title}</h1>
      </div>

      {/* Join Button */}
      <div className="flex justify-center mb-6">
        <JoinClassButton classId={_id}  classTitle={title || ""} />
      </div>

      {/* Admin Actions */}
      {userRole === "admin" && (
        <div className="flex justify-center gap-3 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenUpdateModal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <FaEdit className="w-4 h-4" />
            Update Class
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenDeleteModal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"
          >
            <FaTrash className="w-4 h-4" />
            Delete Class
          </motion.button>
        </div>
      )}

      {/* Details Grid */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <span
              className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                status
              )}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          <div>
            <span className="font-medium text-gray-600">Date & Time:</span>
            <p className="text-gray-900">{formatDateTime(date, time)}</p>
          </div>

          <div>
            <span className="font-medium text-gray-600">Duration:</span>
            <p className="text-gray-900">{duration} minutes</p>
          </div>

          <div>
            <span className="font-medium text-gray-600">Teacher:</span>
            <p className="text-gray-900">
              {teacherId?.firstName} {teacherId?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="max-w-3xl mx-auto mt-6">
        <WarningNotice />
      </div>
    </div>
  );
};

export default ClassDetailsComponent;
