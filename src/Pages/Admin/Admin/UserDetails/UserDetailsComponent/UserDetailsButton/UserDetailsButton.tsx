import React, { useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import { FaUserSlash, FaUserCheck, FaTrash } from "react-icons/fa";
import useUserRole from "../../../../../../Hooks/useUserRole";

interface UserActionButtonsProps {
  userType: string;
  userData: any;
  showRemoveButton?: boolean;
  showSuspendButton?: boolean;
  showSendMailButton?: boolean;
  showEditGeneralButton?: boolean;
  showEditStudentGradesButton?: boolean;
  showEditGeneralButtonNew?: boolean;
  handleRemoveAdminClick?: (user: any) => void;
  handleToggleStatusClick?: (user: any) => void;
  handleOpenEditGradeModal?: () => void;
  handleOpenEditStudentGradeModal?: () => void;
  handleOpenEditGeneralUserModal?: () => void;
}

const iconButtonStyle: React.CSSProperties = {
  backgroundColor: "#66666621",
  color: "#666",
  border: "none",
  borderRadius: "32px",
  padding: "16px",
  width: "fit-content",
  height: "fit-content",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const UserActionButtons: React.FC<UserActionButtonsProps> = ({
  userType,
  userData,
  showRemoveButton = false,
  showSuspendButton = false,
  showSendMailButton = false,
  showEditGeneralButtonNew = false,
  //   showEditStudentGradesButton = false,
  handleRemoveAdminClick,
  handleToggleStatusClick,
  //   handleOpenEditGradeModal,
  //   handleOpenEditStudentGradeModal,
  handleOpenEditGeneralUserModal,
  //   showEditGeneralButton,
}) => {
  if (!userData) return null;

  const { userRole, isSuperadmin } = useUserRole();

  useEffect(() => {
    if (userRole) {
      console.log("User role is:", userRole);
    }
  }, [userRole]);

  return (
    <div
      className="action-button-wrapper"
      style={{
        marginBottom: "15px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: 48,
      }}
    >
      {userRole === "admin" && isSuperadmin && (
        <>
          {showRemoveButton && (
            <button
              onClick={() => handleRemoveAdminClick?.(userData)}
              style={iconButtonStyle}
              title="Remove User"
            >
              <FaTrash />
            </button>
          )}

          {showSuspendButton && (
            <button
              onClick={() => handleToggleStatusClick?.(userData)}
              style={iconButtonStyle}
              title={userData.isSuspended ? "Unsuspend" : "Suspend"}
            >
              {userData.isSuspended ? <FaUserCheck /> : <FaUserSlash />}
            </button>
          )}

          {showSendMailButton && userData?.email && (
            <a
              href={`mailto:${userData.email}`}
              style={{
                ...iconButtonStyle,
                textDecoration: "none",
              }}
              title="Send Mail"
              onClick={(e) => e.stopPropagation()}
            >
              <MdMail />
            </a>
          )}
        </>
      )}

      {showEditGeneralButtonNew &&
        (userType === "course"
          ? isSuperadmin
          : userRole === "parent" || isSuperadmin) && (
          <button
            onClick={handleOpenEditGeneralUserModal}
            style={iconButtonStyle}
            title={`Edit ${userType}`}
          >
            <FaEdit />
          </button>
        )}
      {/* 
      {showEditGeneralButton && (
        <button
          onClick={handleOpenEditGradeModal}
          style={iconButtonStyle}
          title={`Edit ${userType} Details`}
        >
          <FaEdit />
        </button>
      )}

      {showEditStudentGradesButton && (
        <button
          onClick={handleOpenEditStudentGradeModal}
          style={iconButtonStyle}
          title="Edit Student Grades"
        >
          <FaEdit />
        </button>
      )} */}
    </div>
  );
};

export default UserActionButtons;
