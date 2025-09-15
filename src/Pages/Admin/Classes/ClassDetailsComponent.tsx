import React, { useEffect } from "react";
import "./ClassDetailsComponent.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import WarningNotice from "./WarningNotice";
import JoinClassButton from "./JoinClassButton";
import useUserRole from "../../../Hooks/useUserRole";

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
    _id?: any;
  };
  handleOpenUpdateModal?: () => void;
  handleOpenDeleteModal?: () => void;
}

const formatDateTime = (date: string, time: string) => {
  return `${new Date(date).toLocaleDateString()} ${time}`;
};

const ClassDetailsComponent: React.FC<ClassDetailsProps> = ({
  classData,
  handleOpenUpdateModal,
  handleOpenDeleteModal,
}) => {
  const {
    title,
    status,
    date,
    time,
    duration,

    teacherId,
  } = classData;

  const { userRole } = useUserRole();

  useEffect(() => {
    if (userRole) {
      console.log("User role is:", userRole);
    }
  }, [userRole]);

  return (
    <div className="class-details-container">
      <div className="banner">
        <h1 className="class-title">{title}</h1>
      </div>
      <br />
      <JoinClassButton
        classId={classData?._id}
        classTitle={classData.title || ""}
      />
      <br />
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {userRole && ["admin"].includes(userRole) && (
          <>
            <div
              className="class-details-buttons-centered"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: "12px",
              }}
            >
              <button onClick={handleOpenUpdateModal} className="gray-button">
                <FaEdit style={{ marginRight: "8px" }} />
                Update Class
              </button>
              <button onClick={handleOpenDeleteModal} className="gray-button">
                <FaTrash style={{ marginRight: "8px" }} />
                Delete Class
              </button>
            </div>{" "}
            <br />
            <br />
          </>
        )}

        <div className="class-details-grid">
          <div className="detail-row">
            <span className="detail-key">Status:</span>
            <span className="detail-value">{status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Date:</span>
            <span className="detail-value">{formatDateTime(date, time)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Duration:</span>
            <span className="detail-value">{duration} mins</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Teacher:</span>
            <span className="detail-value">
              {teacherId?.firstName} {teacherId?.lastName}
            </span>
          </div>
        </div>

        <div>
          <WarningNotice />
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsComponent;
