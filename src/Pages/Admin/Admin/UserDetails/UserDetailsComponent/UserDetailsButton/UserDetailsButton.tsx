import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import { FaUserSlash, FaUserCheck } from "react-icons/fa6";
import useUserRole from "../../../../../../Hooks/useUserRole";

// Define proper user type
interface User {
  id: string | number;
  email?: string;
  isSuspended?: boolean;
  // Add other fields as needed
}

interface UserActionButtonsProps {
  userType: string;
  userData: User;
  showRemoveButton?: boolean;
  showSuspendButton?: boolean;
  showSendMailButton?: boolean;
  showEditGeneralButtonNew?: boolean;
  handleRemoveAdminClick?: (user: User) => void;
  handleToggleStatusClick?: (user: User) => void;
  handleOpenEditGeneralUserModal?: () => void;
}

const UserActionButtons: React.FC<UserActionButtonsProps> = ({
  userType,
  userData,
  showRemoveButton = false,
  showSuspendButton = false,
  showSendMailButton = false,
  showEditGeneralButtonNew = false,
  handleRemoveAdminClick,
  handleToggleStatusClick,
  handleOpenEditGeneralUserModal,
}) => {
  const { userRole, isSuperadmin } = useUserRole();

  if (!userData) return null;

  // Common Tailwind classes
  const buttonClass =
    "bg-gray-200 bg-opacity-50 text-gray-600 hover:bg-gray-300 hover:text-gray-800 p-4 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <div className="flex flex-wrap gap-3 mt-12 mb-4">
      {/* Admin & Superadmin Actions */}
      {userRole === "admin" && isSuperadmin && (
        <>
          {showRemoveButton && (
            <button
              onClick={() => handleRemoveAdminClick?.(userData)}
              className={buttonClass}
              title="Remove User"
              aria-label="Remove user"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          )}

          {showSuspendButton && (
            <button
              onClick={() => handleToggleStatusClick?.(userData)}
              className={buttonClass}
              title={userData.isSuspended ? "Unsuspend User" : "Suspend User"}
              aria-label={
                userData.isSuspended ? "Unsuspend user" : "Suspend user"
              }
            >
              {userData.isSuspended ? (
                <FaUserCheck className="w-5 h-5 text-green-600" />
              ) : (
                <FaUserSlash className="w-5 h-5 text-red-600" />
              )}
            </button>
          )}

          {showSendMailButton && userData.email && (
            <a
              href={`mailto:${userData.email}`}
              className={`${buttonClass} hover:text-blue-600`}
              title="Send Email"
              aria-label="Send email"
              onClick={(e) => e.stopPropagation()}
            >
              <MdMail className="w-5 h-5" />
            </a>
          )}
        </>
      )}

      {/* Edit Button (Conditional Logic) */}
      {showEditGeneralButtonNew &&
        (userType === "course"
          ? isSuperadmin
          : userRole === "parent" || isSuperadmin) && (
          <button
            onClick={handleOpenEditGeneralUserModal}
            className={buttonClass}
            title={`Edit ${userType}`}
            aria-label={`Edit ${userType}`}
          >
            <FaEdit className="w-5 h-5" />
          </button>
        )}
    </div>
  );
};

export default UserActionButtons;
