import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowLeft, FaUserGraduate, FaEdit } from "react-icons/fa";
import { MdMail } from "react-icons/md";
// Assuming these image paths are correct relative to your project root
import suspendImage from "../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../assets/images/admin/removeImage.png";

// Assuming these imports from your Redux setup and Hooks are correct
import { fetchUserById } from "../../../../Redux/Admin/adminUsers";
import { getGrades } from "../../../../Redux/Admin/AdminGrade"; // Corrected path/import based on your prompt
import { useAdminActions } from "../../../../Hooks/useAdmins";
import { useUserActions } from "../../../../Hooks/useUsers";

// Assuming these components exist in your project
import Loader from "../../../../Components/Loader/Loader";
import ModalDropdown from "../../../../Components/Modal/ModalDropdown";
import { useToast } from "../../../../Context/ToastProvider";

import "./UserDetails.css"; // Your component's specific CSS

// Define Grade interface based on your getGrades thunk's expected data structure
interface Grade {
  _id: string;
  studentId: string;
  courseId: string; // Assuming a grade is linked to a course
  score: number;
  subject: string; // Assuming each grade has a subject
  comments?: string;
  dateAwarded?: string; // Date the grade was awarded
}

// Define StudentDetails interface for clarity when displaying grade students
interface StudentDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isSuspended: boolean;
  phoneNumber?: string;
  grades?: Grade[]; // Add grades array to StudentDetails
}

// Extend UserDetails to include various user types and their associated data
interface UserDetails {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isDeleted?: boolean;
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  parentId?: string;
  courses?: Array<{
    _id: string;
    title: string;
    description?: string;
    isSuspended?: boolean;
  }>;
  reports?: string[];
  password?: string;
  children?: StudentDetails[]; // For parent user type
  parentDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isSuspended?: boolean;
  }; // For student user type
  students?: StudentDetails[]; // For grade user type (students associated with a grade entity)
  title?: string; // For Grade, Course, Department type
  description?: string; // For Grade, Course, Department type
  studentIds?: string[]; // Raw student IDs in grade schema (if not populated)
  classIds?: string[]; // Raw class IDs in grade schema (if not populated)
  grades?: Grade[]; // For student user type (populated grades)
}

// Keys to hide from the general details display
const hiddenKeys = new Set([
  "_id",
  "__v",
  "updatedAt",
  "password",
  "parentId",
  "courseIds",
  "teacherIds",
  "departmentId",
  "courses", // Populated courses for department - handled separately
  "children", // Populated children for parent - handled separately
  "parentDetails", // Populated parent for student - handled separately
  "students", // Populated students for grade - handled separately
  "studentIds", // Raw student IDs in grade schema
  "classIds", // Raw class IDs in grade schema
  "grades", // Raw grades for student - handled separately
]);

// Overrides for display names of keys
const displayKeyOverrides: Record<string, string> = {
  isSuspended: "Status",
  createdAt: "Created At",
  parentId: "Parent ID",
  reports: "Reports",
  courses: "Courses",
  role: "Role",
  title: "Title",
  description: "Description",
};

// Helper function to format a key for display (e.g., 'firstName' becomes 'First Name')
const formatKey = (key: string): string => {
  const withSpaces = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

// Helper function to format values for display (e.g., boolean to 'Active'/'Suspended', date to readable format)
const formatDisplayValue = (key: string, value: any) => {
  if (key === "isSuspended") return value ? "Suspended" : "Active";
  if (key === "createdAt" && typeof value === "string") {
    const date = new Date(value);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const ordinal = getOrdinal(day);
    return `${dayOfWeek} ${day}${ordinal} ${month}, ${year}`;
  }
  if (key === "role" && value === "superadmin") return "Super Admin";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "None";
  return value;
};

type AdminUser = UserDetails; // Type alias for convenience

const UserDetails: React.FC = () => {
  const { id, userType } = useParams<{ id: string; userType: string }>();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { suspendAdmin, removeAdmin } = useAdminActions();
  const { editUser } = useUserActions();

  // State for confirmation modal (suspend/remove)
  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "remove" | "unsuspend";
    id: string | null;
    userType: string;
  } | null>(null);

  // State for editing general entities (Grade, Department, Course)
  const [isEditGradeModalOpen, setIsEditGradeModalOpen] = useState(false);
  const [editGradeData, setEditGradeData] = useState({
    title: "",
    description: "",
  });

  // State for editing student grades
  const [isEditStudentGradeModalOpen, setIsEditStudentGradeModalOpen] =
    useState(false);

  const [editStudentGradeFormData, setEditStudentGradeFormData] = useState<
    Partial<Grade>
  >({
    score: 0,
    subject: "",
    comments: "",
  });

  // State to store all grades fetched (used for student grade filtering)
  const [allGrades, setAllGrades] = useState<Grade[]>([]);

  // Main user data, loading, and error states
  const [userData, setUserData] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackHovered, setIsBackHovered] = useState(false);

  // --- Action Handlers for Suspend/Remove/Unsuspend ---
  const handleToggleStatusClick = (user: AdminUser) => {
    const actionType = user.isSuspended ? "unsuspend" : "suspend";
    setConfirmModal({
      type: actionType,
      id: user._id,
      userType: userType as string,
    });
  };

  const handleRemoveAdminClick = (user: AdminUser) => {
    setConfirmModal({
      type: "remove",
      id: user._id,
      userType: userType as string,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmModal?.id) return;

    const { id, type, userType: modalUserType } = confirmModal;
    setLoading(true);

    let action: Promise<any>;

    switch (type) {
      case "suspend":
      case "unsuspend":
        action = suspendAdmin(id, modalUserType);
        break;
      case "remove":
        action = removeAdmin(id, modalUserType);
        break;
      default:
        throw new Error(`Unsupported action type: ${type}`);
    }

    action
      .then((res: any) => {
        if (res.success) {
          addToast("success", res.data?.message || `${type} successful`);
          if (type === "remove") {
            navigate(-1); // Navigate back after removal
          } else {
            getUserById(); // Re-fetch user data to update status
          }
        } else {
          addToast("error", res.error || `${type} failed`);
        }
      })
      .catch((err) => {
        console.error(err);
        addToast("error", "Something went wrong!");
      })
      .finally(() => {
        setLoading(false);
        setConfirmModal(null);
      });
  };

  // --- Data Fetching Functions ---
  const getUserById = async () => {
    setLoading(true);
    setError(null);
    try {
      const action = await dispatch(fetchUserById({ id, userType }));
      if (action.payload) {
        console.log(action.payload, "action.payload");
        setUserData(action.payload);
        // Initialize edit form data if it's a grade, department or course
        if (
          ["grade", "department", "course"].includes(userType.toLowerCase())
        ) {
          setEditGradeData({
            title: action.payload.title || "",
            description: action.payload.description || "",
          });
        }
      } else {
        setError("User not found or failed to load data.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGrades = async () => {
    setLoading(true);
    try {
      const action = await dispatch(getGrades());
      if (action.payload) {
        console.log(action.payload, "GRRR");
        setAllGrades(action.payload as Grade[]);
      } else {
        addToast("error", "Failed to fetch all grades.");
      }
    } catch (error) {
      console.error("Error fetching all grades:", error);
      addToast("error", "An error occurred while fetching all grades.");
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect for Initial Data Fetching ---
  useEffect(() => {
    if (!id || !userType) return;

    const fetchData = async () => {
      await getUserById(); // Always fetch user data
      if (userType.toLowerCase() === "student") {
        await fetchAllGrades(); // Fetch all grades if current userType is 'student'
      }
    };

    fetchData();
  }, [id, userType, dispatch]); // Re-run when id or userType changes

  // Display loader if data is still loading or an error occurred
  if (error) return <p className="loading-error-text error-text">{error}</p>;

  // Prepare entries for general user details display
  const displayEntries = userData
    ? Object.entries(userData)
        .filter(([key]) => !hiddenKeys.has(key))
        .map(([key, value]) => {
          const displayKey = displayKeyOverrides[key] || formatKey(key);
          return [displayKey, formatDisplayValue(key, value)];
        })
    : [];

  // Navigation helpers
  const navigateToCourseDetails = (courseId: string) => {
    navigate(`/user-details/course/${courseId}`);
  };

  const navigateToStudentDetails = (studentId: string) => {
    navigate(`/user-details/student/${studentId}`);
  };

  // Utility for random background color (for class items)
  const getRandomBgColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  // --- Conditional Button Visibility Logic ---
  const showSuspendButton =
    userType === "admin" ||
    userType === "teacher" ||
    userType === "student" ||
    userType === "parent";
  const showRemoveButton =
    userType === "admin" ||
    userType === "teacher" ||
    userType === "student" ||
    userType === "parent" ||
    userType === "grade" ||
    userType === "department" ||
    userType === "course";
  const showSendMailButton =
    userType === "admin" ||
    userType === "teacher" ||
    userType === "student" ||
    userType === "parent";
  const showEditGeneralButton =
    userType === "grade" || userType === "department" || userType === "course";
  const showEditStudentGradesButton = userType === "student";

  // --- Handlers for Editing Grade/Department/Course Details ---
  const handleOpenEditGradeModal = () => {
    if (
      userData &&
      ["grade", "department", "course"].includes(userType.toLowerCase())
    ) {
      setEditGradeData({
        title: userData.title || "",
        description: userData.description || "",
      });
      setIsEditGradeModalOpen(true);
    }
  };

  const handleEditGradeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditGradeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveGradeChanges = async () => {
    setLoading(true);
    try {
      if (!id || !userType) {
        addToast("error", "Missing ID or User Type for update.");
        setLoading(false);
        return;
      }
      const response = await editUser(userType, id, editGradeData); // Assumes editUser can handle these types
      if (response.success) {
        addToast("success", `${userType} updated successfully!`);
        setIsEditGradeModalOpen(false);
        getUserById(); // Re-fetch user data to reflect changes
      } else {
        addToast("error", response.error || `Failed to update ${userType}`);
      }
    } catch (error) {
      console.error("Error saving general entity changes:", error);
      addToast("error", "An unexpected error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditGradeModal = () => {
    setIsEditGradeModalOpen(false);
  };

  // --- Handlers for Editing Student Grades ---
  const handleOpenEditStudentGradeModal = (gradeToEdit?: Grade) => {
    if (userType.toLowerCase() === "student" && userData?._id) {
      setIsEditStudentGradeModalOpen(true);
    }
  };

  const handleSaveStudentGradeChanges = async () => {
    setLoading(true);

    try {
      if (!selectedStudentGrade || !userData?._id) {
        addToast(
          "error",
          "Missing selected grade or student ID for update. Please select a grade."
        );
        setLoading(false);
        return;
      }
      console.log(selectedStudentGrade?._id, "selectedStudentGrade");

      console.log(selectedStudentGrade, "selectedStudentGrade");
      const updatedData = {
        gradeId: selectedStudentGrade?._id,
      };
      // API call to update the student's gradeId
      const response = await editUser("student", userData._id, updatedData);
      if (response.success) {
        addToast("success", "Student's class grade updated successfully!");
        setIsEditStudentGradeModalOpen(false);
        await getUserById();
      } else {
        addToast(
          "error",
          response.error || "Failed to update student's class grade."
        );
      }
    } catch (error: any) {
      console.error("Error saving student's class grade changes:", error);
      addToast(
        "error",
        error.message ||
          "An unexpected error occurred during student's class grade save."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditStudentGradeModal = () => {
    setIsEditStudentGradeModalOpen(false);
    setSelectedStudentGrade(null); // Clear selected grade
    setEditStudentGradeFormData({}); // Reset form data
  };

  const [selectedStudentGrade, setSelectedStudentGrade] = useState(
    userData?.gradeId || ""
  );

  return (
    <div className="page-wrapper">
      <div className="user-details-container">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="back-button-wrapper">
              <button
                onClick={() => navigate(-1)}
                className={`back-button ${
                  isBackHovered ? "back-button-hover" : ""
                }`}
                aria-label="Go back"
                onMouseEnter={() => setIsBackHovered(true)}
                onMouseLeave={() => setIsBackHovered(false)}
                style={{
                  backgroundColor: "#66666621",
                  border: "none",
                  color: "#666",
                  width: "fit-content",
                }}
              >
                <FaArrowLeft />
              </button>
            </div>
            <h1 className="title">
              {userType
                ? userType.charAt(0).toUpperCase() + userType.slice(1)
                : ""}{" "}
              Details
            </h1>
            {displayEntries.map(([key, value], index) => (
              <div
                key={String(key)}
                className="entry-container"
                style={{
                  backgroundColor: index % 2 === 0 ? "#f4f4f4" : "#ffffff",
                  padding: "10px 15px",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              >
                <p
                  style={{ fontSize: 13, color: "#666", marginBottom: 4 }}
                  className="entry-key"
                >
                  {key}:
                </p>
                <span
                  className="entry-value"
                  style={{
                    fontWeight: 700,
                    color:
                      key === "Role" && value === "Super Admin"
                        ? "#666"
                        : "#666",
                  }}
                >
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                </span>
              </div>
            ))}

            {/* --- Display Courses for Department --- */}
            {userType?.toLowerCase() === "department" &&
              Array.isArray(userData?.courses) && (
                <div style={{ marginTop: 32 }}>
                  <h2
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      textAlign: "left",
                    }}
                  >
                    Courses in this Department ({userData.courses.length})
                  </h2>
                  {userData.courses.length === 0 ? (
                    <p style={{ color: "#666" }}>
                      No courses available for this department.
                    </p>
                  ) : (
                    <div className="courses-grid">
                      {userData.courses.map((course: any) => (
                        <div
                          key={course._id}
                          className="class-item"
                          style={{
                            border: `0.5px #66666645 solid`,
                            borderRadius: 12,
                            textAlign: "left",
                          }}
                        >
                          <div
                            className="class-image-placeholder"
                            style={{
                              backgroundColor: getRandomBgColor(),
                              padding: "1rem",
                              borderTopLeftRadius: 12,
                              borderTopRightRadius: 12,
                            }}
                          >
                            <h3>{course.title}</h3>
                          </div>
                          <div
                            className="class-info"
                            style={{ padding: "0.75rem" }}
                          >
                            <h3>{course.title}</h3>
                            <p>{course.isSuspended ? "Suspended" : "Active"}</p>
                            <p
                              className="class-date"
                              style={{ fontSize: "0.9rem", color: "#444" }}
                            >
                              {course.description || "No description available"}
                            </p>
                            <button
                              onClick={() =>
                                navigateToCourseDetails(course._id)
                              }
                              style={{
                                marginTop: "10px",
                                cursor: "pointer",
                                backgroundColor: "#66666621",
                                color: "#666",
                                border: "none",
                                padding: "16px 16px",
                                borderRadius: "24px",
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* --- Display Parent Details for Student --- */}
            {userType?.toLowerCase() === "student" &&
              userData?.parentDetails && (
                <div
                  style={{ marginTop: 40 }}
                  onClick={() =>
                    navigate(
                      `/user-details/parent/${userData?.parentDetails?._id}`
                    )
                  }
                >
                  <h2
                    style={{
                      fontSize: 18,
                      marginBottom: 16,
                      textAlign: "left",
                    }}
                  >
                    Parent Details
                  </h2>
                  <div
                    className="parent-card"
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: "#f9f9f9",
                      marginBottom: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <MdMail />
                    <h3 style={{ margin: 0 }}>
                      {userData.parentDetails.firstName}{" "}
                      {userData.parentDetails.lastName}
                    </h3>
                    <p style={{ margin: 0 }}>
                      <strong>Email:</strong> {userData.parentDetails.email}
                    </p>
                    {userData.parentDetails.phoneNumber && (
                      <p style={{ margin: 0 }}>
                        <strong>Phone:</strong>{" "}
                        {userData.parentDetails.phoneNumber}
                      </p>
                    )}
                    <p style={{ margin: 0 }}>
                      <strong>Status:</strong>{" "}
                      {userData.parentDetails.isSuspended
                        ? "Suspended"
                        : "Active"}
                    </p>
                  </div>
                </div>
              )}

            {/* --- Display Children for Parent --- */}
            {userType?.toLowerCase() === "parent" &&
              Array.isArray(userData?.children) &&
              userData.children.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <h2
                    style={{
                      fontSize: 18,
                      marginBottom: 16,
                      textAlign: "left",
                    }}
                  >
                    Children ({userData.children.length})
                  </h2>
                  <div className="children-grid">
                    {userData.children.map((child) => (
                      <div
                        key={child._id}
                        className="child-card"
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: 8,
                          padding: 16,
                          backgroundColor: "#ff",
                          marginBottom: 16,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          textAlign: "left",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                        onClick={() => navigateToStudentDetails(child?._id)}
                      >
                        <FaUserGraduate />
                        <h3 style={{ margin: 0 }}>
                          {child.firstName} {child.lastName}
                        </h3>
                        <p style={{ margin: 0, wordBreak: "break-word" }}>
                          {child.email}
                        </p>
                        {child.phoneNumber && (
                          <p style={{ margin: 0, wordBreak: "break-word" }}>
                            <strong>Phone:</strong> {child.phoneNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* --- Display Students for Grade --- */}
            {userType?.toLowerCase() === "grade" &&
              Array.isArray(userData?.students) &&
              userData.students.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <h2
                    style={{
                      fontSize: 18,
                      marginBottom: 16,
                      textAlign: "left",
                    }}
                  >
                    Students in this Grade ({userData.students.length})
                  </h2>
                  <div className="students-grid">
                    {userData.students.map((student) => (
                      <div
                        key={student._id}
                        className="student-card"
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: 8,
                          padding: 16,
                          backgroundColor: "#f9f9f9",
                          marginBottom: 16,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          textAlign: "left",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                        onClick={() => navigateToStudentDetails(student._id)}
                      >
                        <FaUserGraduate />
                        <h3 style={{ margin: 0 }}>
                          {student.firstName} {student.lastName}
                        </h3>
                        <p style={{ margin: 0, wordBreak: "break-word" }}>
                          {student.email}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Status:</strong>{" "}
                          {student.isSuspended ? "Suspended" : "Active"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* --- NEW: Display Grades for Student --- */}
            {userType?.toLowerCase() === "student" &&
              Array.isArray(userData?.grades) &&
              userData.grades.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <h2
                    style={{
                      fontSize: 18,
                      marginBottom: 16,
                      textAlign: "left",
                    }}
                  >
                    Grades for this Student ({userData.grades.length})
                  </h2>
                  <div className="grades-list">
                    {userData.grades.map((grade) => (
                      <div
                        key={grade._id}
                        className="grade-item"
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 10,
                          backgroundColor: "#fdfdfd",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                            {grade.subject}
                          </h3>
                          <p style={{ margin: "5px 0 0 0", color: "#555" }}>
                            Score: <strong>{grade.score}</strong>
                          </p>
                          {grade.comments && (
                            <p
                              style={{
                                margin: "5px 0 0 0",
                                color: "#777",
                                fontSize: "0.9rem",
                              }}
                            >
                              Comments: {grade.comments}
                            </p>
                          )}
                          {grade.dateAwarded && (
                            <p
                              style={{
                                margin: "5px 0 0 0",
                                color: "#777",
                                fontSize: "0.9rem",
                              }}
                            >
                              Date Awarded:{" "}
                              {new Date(grade.dateAwarded).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {/* Individual Edit button for each grade */}
                        {showEditStudentGradesButton && (
                          <button
                            onClick={() =>
                              handleOpenEditStudentGradeModal(grade)
                            }
                            style={{
                              backgroundColor: "#007bff",
                              color: "white",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            <FaEdit /> Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* --- Action Buttons --- */}
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
              {showRemoveButton && userData && (
                <button
                  onClick={() => handleRemoveAdminClick(userData)}
                  className="action-button-user"
                >
                  Remove
                </button>
              )}

              {showSuspendButton && userData && (
                <button
                  onClick={() => handleToggleStatusClick(userData)}
                  className="action-button-user"
                  style={{
                    backgroundColor: userData.isSuspended
                      ? "#4CAF50"
                      : "#FFA500",
                    color: "#fff",
                  }}
                >
                  {userData.isSuspended ? "Unsuspend" : "Suspend"} {userType}
                </button>
              )}

              {showSendMailButton && userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="action-button-user"
                  style={{
                    textDecoration: "none",
                    backgroundColor: "#337ab7",
                    color: "#fff",
                  }}
                >
                  <MdMail /> Send a mail
                </a>
              )}

              {showEditGeneralButton && userData && (
                <button
                  onClick={handleOpenEditGradeModal}
                  className="action-button-user"
                  style={{ backgroundColor: "#007bff", color: "#fff" }}
                >
                  <FaEdit /> Edit {userType} Details
                </button>
              )}

              {/* NEW: Master "Edit Student Grades" Button */}
              {showEditStudentGradesButton && userData && (
                <button
                  onClick={() => handleOpenEditStudentGradeModal()} // Call without specific grade to open a selection or first grade
                  className="action-button-user"
                  style={{ backgroundColor: "#28a745", color: "#fff" }}
                >
                  <FaEdit /> Edit Student Grades
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {confirmModal && (
        <ModalDropdown onClose={() => setConfirmModal(null)}>
          <div
            className="admin-dashboard__confirm-modal"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <h2
              className="admin-dashboard__confirm-heading"
              style={{ fontSize: "1.5rem", marginBottom: "15px" }}
            >
              {confirmModal.type === "suspend"
                ? "Confirm Suspension"
                : confirmModal.type === "unsuspend"
                ? "Confirm Unsuspension"
                : "Confirm Deletion"}
            </h2>

            <p
              className="admin-dashboard__confirm-text"
              style={{ marginBottom: "20px" }}
            >
              Are you sure you want to{" "}
              <strong>
                {confirmModal.type === "suspend"
                  ? "suspend"
                  : confirmModal.type === "unsuspend"
                  ? "unsuspend"
                  : "delete"}
              </strong>{" "}
              this {userType}?
            </p>

            <img
              src={confirmModal.type === "remove" ? removeImage : suspendImage}
              alt="Confirm Action"
              className="admin-dashboard__confirm-image"
              style={{ width: "80px", height: "80px", marginBottom: "20px" }}
            />
            <div
              style={{ display: "flex", justifyContent: "center", gap: "10px" }}
            >
              <button
                className="admin-dashboard__confirm-button"
                onClick={handleConfirmAction}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Yes,{" "}
                {confirmModal.type === "suspend"
                  ? "suspend"
                  : confirmModal.type === "unsuspend"
                  ? "unsuspend"
                  : confirmModal.type === "remove"
                  ? "delete"
                  : null}
              </button>

              <button
                className="admin-dashboard__cancel-button"
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}

      {/* --- EDIT GRADE/DEPARTMENT/COURSE MODAL --- */}
      {isEditGradeModalOpen && (
        <ModalDropdown onClose={handleCloseEditGradeModal}>
          <div
            className="admin-dashboard__edit-grade-modal"
            style={{ padding: "20px" }}
          >
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
              Edit {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </h2>
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="title"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Title:
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={editGradeData.title}
                onChange={handleEditGradeFormChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="description"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Description:
              </label>
              <textarea
                id="description"
                name="description"
                value={editGradeData.description}
                onChange={handleEditGradeFormChange}
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              ></textarea>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={handleCloseEditGradeModal}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGradeChanges}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "none",
                  background: "#007bff",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}

      {/* --- NEW: EDIT STUDENT GRADE MODAL --- */}
      {isEditStudentGradeModalOpen && (
        <ModalDropdown onClose={handleCloseEditStudentGradeModal}>
          <div
            className="admin-dashboard__edit-student-grade-modal"
            style={{ padding: "20px" }}
          >
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
              Edit Grade for {userData?.firstName} {userData?.lastName}
            </h2>

            <div style={{ marginBottom: "15px" }}>
              <label className="admin0dashboard-label">
                Select a Grade - Current Grade is {userData?.gradeTitle}
                <select
                  value={selectedStudentGrade?._id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = allGrades.find(
                      (g) => g._id === selectedId
                    );
                    console.log(selected, "selected grade object");
                    setSelectedStudentGrade(selected || null);
                  }}
                  required
                >
                  <option value="">-- Select Grade --</option>
                  {allGrades?.map((grade) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px", // Added margin-top for spacing
              }}
            >
              <button
                onClick={handleCloseEditStudentGradeModal}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudentGradeChanges}
                disabled={!selectedStudentGrade} // Disable save button if no grade is selected
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "none",
                  background: selectedStudentGrade ? "#28a745" : "#a2d9a9", // Green save button, lighter when disabled
                  color: "#fff",
                  cursor: selectedStudentGrade ? "pointer" : "not-allowed",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default UserDetails;
