import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaChevronRight,
  FaUserPlus,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import "./AdminDashboard.css";
import ModalDropdown from "../../../../Components/Modal/ModalDropdown";
import { useAdminActions } from "../../../../Hooks/useAdmins";
import suspendImage from "../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../assets/images/admin/removeImage.png";
import Loader from "../../../../Components/Loader/Loader";
import { addAdmin } from "../../../../Redux/Admin/Auth";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../Redux/store";
import { useToast } from "../../../../Context/ToastProvider";
import { createDepartment } from "../../../../Redux/Admin/adminDepartment";
import { useDepartmentActions } from "../../../../Hooks/useDepartments";
import { useCourseActions } from "../../../../Hooks/useCourses";
import {
  createUser,
  fetchAllUsersByType,
} from "../../../../Redux/Admin/adminUsers";
import { createGrade } from "../../../../Redux/Admin/AdminGrade";

interface AdminUser {
  _id: string;
  isSuspended: boolean;
}

export type UserType =
  | "admin"
  | "parent"
  | "student"
  | "teacher"
  | "course"
  | "department"
  | "grade"
  | "notFound";

export type FilterType =
  | "all"
  | "active"
  | "disabled"
  | "suspended"
  | "inClass"
  | "upcomingClass"
  | "reported"
  | "missed3Classes"
  | "upcomingReported"
  | "subscribed";

interface AdminDashboardProps {
  userType: UserType;
  initialFilter?: FilterType;
}

const filterOptions: Record<UserType, FilterType[]> = {
  admin: ["all", "active", "disabled"],
  parent: ["all", "active", "disabled", "reported"],
  student: [
    "all",
    "active",
    "disabled",
    "missed3Classes",
    "upcomingClass",
    "reported",
  ],
  teacher: ["all", "active", "disabled", "inClass", "upcomingReported"],
  course: ["all", "active", "subscribed"],
  department: ["all", "active", "suspended"],
  grade: ["all"],
  notFound: ["all"],
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userType }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const [isLoading, setLoading] = useState(true);
  const { suspendAdmin, removeAdmin } = useAdminActions();
  const { getDepartments } = useDepartmentActions();
  const { getCourses, addCourse } = useCourseActions();
  const [adminsFilter, setAdminsFilter] = useState<any[]>([]);
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminRole, setAddAdminRole] = useState("");
  const [addAdminFirstName, setAddAdminFirstName] = useState("");
  const [addAdminLastName, setAddAdminLastName] = useState("");
  const [addAdminPassword, setAddAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentNameErr, setDepartmentNameErr] = useState("");
  const [departmentsFetched, setDepartmentsFetched] = useState<any[]>([]);
  const [gradeFetched, setGradeFetched] = useState<any[]>([]);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [formErrorsUsers, setFormErrorsUsers] = useState<any>({});
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [parentId, setParentId] = useState("");
  const [coursesFetched, setCourseFetched] = useState<any[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [courseTitleErr, setCourseTitleErr] = useState("");
  const [courseDescriptionErr, setCourseDescriptionErr] = useState("");
  const [selectedDepartmentIdErr, setSelectedDepartmentIdErr] = useState("");
  const [formErrors, setFormErrors] = useState({
    email: "",
    role: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const { filter = "all" } = useParams();

  // Grade form fields
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeDescription, setGradeDescription] = useState("");

  // Grade field errors
  const [gradeTitleErr, setGradeTitleErr] = useState("");
  const [gradeDescriptionErr, setGradeDescriptionErr] = useState("");

  // Grade data fetched from backend (already present)
  const [gradesFetched, setGradesFetched] = useState<any[]>([]);

  // UPDATED STATE: To hold the selected grade ID for student creation
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");

  console.log(userType, "grade");

  const fetchUsers = async () => {
    const types = [
      "teacher",
      "parent",
      "student",
      "department",
      "course",
      "admin",
      "grade",
    ];
    // Use a Promise.all to wait for all dispatches to complete
    const fetchPromises = types.map((type) =>
      dispatch(fetchAllUsersByType(type as any))
    );

    try {
      const results = await Promise.all(fetchPromises);
      results.forEach((res: any) => {
        if (res.payload?.userType && res.payload?.users) {
          console.log(
            res.payload.users,
            `Fetched ${res.payload.userType} users`
          );

          switch (res.payload.userType) {
            case "teacher":
              setTeachers(res.payload.users);
              break;
            case "parent":
              setParents(res.payload.users);
              break;
            case "student":
              setStudents(res.payload.users);
              break;
            case "course":
              setCourseFetched(res.payload.users);
              break;
            case "department":
              setDepartmentsFetched(res.payload.users);
              break;
            case "admin":
              setAdminsFilter(res.payload.users);
              break;
            case "grade":
              // Ensure this is properly mapping to gradesFetched
              setGradesFetched(res.payload.users);
              break;
            default:
              break;
          }
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      addToast("error", "Failed to fetch some user types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [dispatch]); // Removed fetchNearestRider as it's not relevant here

  const location = useLocation();

  const filterData = (data: any[]) => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const filter = pathSegments[pathSegments.length - 1];

    if (filter === "all") {
      return data;
    }

    console.log(data, "data");
    const filtered = data.filter((item) => {
      switch (filter) {
        case "active":
          return item.isSuspended === false;
        case "suspended":
          return item.isSuspended === true;
        case "disabled":
          return item.isSuspended === true;
        case "subscribed":
        case "inClass":
        case "upcomingClass":
        case "reported":
        case "missed3Classes":
        case "upcomingReported":
          return item[filter] === true;
        default:
          return true;
      }
    });

    return filtered;
  };

  console.log(adminsFilter, "adminsFilter");

  const getSampleData = () => {
    switch (userType) {
      case "parent":
        return parents;
      case "student":
        return students;
      case "teacher":
        return teachers;
      case "course":
        return coursesFetched;
      case "department":
        return departmentsFetched;
      case "admin":
        return adminsFilter;
      case "grade":
        return gradesFetched; // Corrected to use gradesFetched
      default:
        return [];
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "remove" | "unsuspend";
    id: string | null;
    userType: UserType;
  } | null>(null);

  const handleToggleStatusClick = (user: AdminUser) => {
    const actionType = user.isSuspended ? "unsuspend" : "suspend";
    setConfirmModal({ type: actionType, id: user._id, userType });
  };

  const handleRemoveAdminClick = (user: AdminUser) => {
    setConfirmModal({ type: "remove", id: user._id, userType });
  };

  const handleConfirmAction = () => {
    if (!confirmModal?.id) return;

    const { id, type, userType } = confirmModal;
    setLoading(true);

    let action: Promise<any>;
    switch (type) {
      case "suspend":
      case "unsuspend":
        action = suspendAdmin(id, userType);
        break;
      case "remove":
        action = removeAdmin(id, userType);
        break;
      default:
        throw new Error(`Unsupported action type: ${type}`);
    }
    action
      .then((res: any) => {
        console.log("✅ Response:", res);

        if (res.success) {
          addToast("success", res.data.message || `${type} successful`);

          switch (userType) {
            case "admin":
            case "department":
            case "course":
            case "teacher":
            case "parent":
            case "student":
            case "grade":
              fetchUsers();
              break;
            default:
              console.warn(`No fetch method defined for userType: ${userType}`);
          }
        } else {
          addToast("error", `${type} failed`);
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

  const handleViewDetails = (id: string) => {
    // Changed type to string as _id is string
    navigate(`/user-details/${userType}/${id}`);
  };

  const dataToDisplay = filterData(getSampleData());

  const getTitle = () =>
    userType
      ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard`
      : "Dashboard";

  const formatFilterText = (text: string) => {
    let formatted = text.charAt(0).toUpperCase() + text.slice(1);

    formatted = formatted.replace(/([A-Z])/g, " $1");

    formatted = formatted.replace(/([0-9])/g, " $1 ");
    formatted = formatted.trim();

    return formatted;
  };

  const handleSubmitAll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(false); // Close modal temporarily to show loader
    setLoading(true);

    try {
      if (userType === "department") {
        if (!departmentName.trim()) {
          setDepartmentNameErr("Department name is required");
          setIsModalOpen(true); // Reopen modal if validation fails
          setLoading(false);
          return;
        }

        const resultAction = await dispatch(
          createDepartment({ name: departmentName })
        );
        if (createDepartment.rejected.match(resultAction)) {
          setDepartmentNameErr(
            (resultAction.payload as string) || "Failed to add department"
          );
          setIsModalOpen(true); // Reopen modal
          setLoading(false);
          return;
        }

        const department = await getDepartments();
        setDepartmentsFetched(department?.data);
        addToast("success", "Department created successfully!");
        setDepartmentName("");
        setDepartmentNameErr("");
      } else if (userType === "course") {
        let hasError = false;
        if (!courseTitle.trim()) {
          setCourseTitleErr("Course title is required");
          hasError = true;
        } else setCourseTitleErr("");

        if (!courseDescription.trim()) {
          setCourseDescriptionErr("Course description is required");
          hasError = true;
        } else setCourseDescriptionErr("");

        if (!selectedDepartmentId) {
          setSelectedDepartmentIdErr("Please select a department");
          hasError = true;
        } else setSelectedDepartmentIdErr("");

        if (hasError) {
          setIsModalOpen(true); // Reopen modal if validation fails
          setLoading(false);
          return;
        }

        const result = await addCourse({
          title: courseTitle,
          description: courseDescription,
          departmentId: selectedDepartmentId,
        });

        if (result.success) {
          const fetchedCourses = await getCourses();
          if (fetchedCourses?.success && Array.isArray(fetchedCourses.data)) {
            setCourseFetched(fetchedCourses.data);
          }
          setCourseTitle("");
          setCourseDescription("");
          setSelectedDepartmentId("");
          addToast("success", "Course added successfully!");
        }
      } else if (userType === "grade") {
        let hasError = false;
        if (!gradeTitle.trim()) {
          setGradeTitleErr("Grade title is required");
          hasError = true;
        } else setGradeTitleErr("");

        if (!gradeDescription.trim()) {
          setGradeDescriptionErr("Grade description is required");
          hasError = true;
        } else setGradeDescriptionErr("");

        if (hasError) {
          setIsModalOpen(true); // Reopen modal if validation fails
          setLoading(false);
          return;
        }

        const result = await dispatch(
          createGrade({
            title: gradeTitle,
            description: gradeDescription,
          })
        ).unwrap();

        if (result.success as any) {
          fetchUsers(); // Re-fetch all users to update grade list
          setGradeTitle("");
          setGradeDescription("");
          addToast("success", "Grade created successfully!");
        }
      } else if (userType === "admin") {
        const errors = {
          email: "",
          role: "",
          firstName: "",
          lastName: "",
          password: "",
        };
        let hasError = false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(addAdminEmail)) {
          errors.email = "Please enter a valid email address.";
          hasError = true;
        }
        if (!addAdminRole.trim()) {
          errors.role = "Role is required.";
          hasError = true;
        }
        if (!addAdminFirstName.trim()) {
          errors.firstName = "First name is required.";
          hasError = true;
        }
        if (!addAdminLastName.trim()) {
          errors.lastName = "Last name is required.";
          hasError = true;
        }
        if (!addAdminPassword || addAdminPassword.length < 6) {
          errors.password = "Password must be at least 6 characters.";
          hasError = true;
        }

        setFormErrors(errors);
        if (hasError) {
          setIsModalOpen(true); // Reopen modal if validation fails
          setLoading(false);
          return;
        }

        const res = await dispatch(
          addAdmin({
            email: addAdminEmail,
            role: addAdminRole,
            firstName: addAdminFirstName,
            lastName: addAdminLastName,
            password: addAdminPassword,
          })
        ).unwrap();

        if (res.success) {
          fetchUsers();
          addToast("success", "New Admin added successfully!");
          setAddAdminEmail("");
          setAddAdminRole("");
          setAddAdminFirstName("");
          setAddAdminLastName("");
          setAddAdminPassword("");
        }
      } else if (
        userType === "parent" ||
        userType === "student" ||
        userType === "teacher"
      ) {
        // Validation for user creation (parent, student, teacher)
        let hasError = false;
        const newFormErrorsUsers: any = {};

        if (!userFirstName.trim()) {
          newFormErrorsUsers.firstName = "First name is required.";
          hasError = true;
        }
        if (!userLastName.trim()) {
          newFormErrorsUsers.lastName = "Last name is required.";
          hasError = true;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
          newFormErrorsUsers.email = "Please enter a valid email address.";
          hasError = true;
        }
        if (!userPhoneNumber.trim()) {
          newFormErrorsUsers.phoneNumber = "Phone number is required.";
          hasError = true;
        }

        // Specific validation for student: grade selection
        // UPDATED: Check for selectedGradeId
        if (userType === "student" && !selectedGradeId.trim()) {
          newFormErrorsUsers.gradeId = "Please select a grade."; // Error message for grade ID
          hasError = true;
        }

        setFormErrorsUsers(newFormErrorsUsers);

        if (hasError) {
          setIsModalOpen(true); // Reopen modal if validation fails
          setLoading(false);
          return;
        }

        const body = {
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          phoneNumber: userPhoneNumber,
          userType,
          parentId,
          // UPDATED: Conditionally add gradeId if userType is student
          ...(userType === "student" && { gradeId: selectedGradeId }),
        };

        const res: any = await dispatch(createUser(body as any));
        if (res.payload?.success) {
          fetchUsers();
          addToast("success", `${userType} created successfully!`);
          setIsModalOpen(false); // Close modal on success
          // Clear form fields
          setUserFirstName("");
          setUserLastName("");
          setUserEmail("");
          setUserPhoneNumber("");
          setParentId("");
          setSelectedGradeId(""); // Clear selected grade ID
        } else {
          const errorMsg = res.payload?.error || res.error?.message;
          if (
            errorMsg?.includes("E11000 duplicate key error") &&
            errorMsg.includes("email")
          ) {
            setFormErrorsUsers({
              ...newFormErrorsUsers,
              email: "Email already in use.",
            });
          } else {
            addToast("error", "Something went wrong! " + errorMsg); // Show more specific error
          }
          setIsModalOpen(true); // Reopen modal on error
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      addToast("error", "Something went wrong!");
      setIsModalOpen(true); // Reopen modal on unhandled error
    } finally {
      setLoading(false);
    }
  };

  const adminRole = localStorage.getItem("yareadminrole");

  return (
    <div className="admin-dashboard">
      {isLoading && (
        <ModalDropdown onClose={() => setConfirmModal(null)} hideCloseButton>
          <Loader />
        </ModalDropdown>
      )}
      <h2>{getTitle()}</h2>

      <p>View all data for {userType}s.</p>

      <div className="tabs-container">
        {userType &&
          filterOptions[userType] &&
          filterOptions[userType].map((f) => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? "active" : ""}`}
              onClick={() => navigate(`/${userType}/dashboard/${f}`)}
            >
              {formatFilterText(f)}
            </button>
          ))}
      </div>

      {adminRole === "superadmin" && (
        <button className="add-admin-btn" onClick={() => setIsModalOpen(true)}>
          <FaUserPlus /> Add {userType}
        </button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            {userType !== "course" && userType !== "department" && (
              <th>Email</th>
            )}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dataToDisplay.length === 0 ? (
            <tr>
              <td
                colSpan={
                  userType !== "course" && userType !== "department" ? 4 : 3
                }
              >
                No items available
              </td>
            </tr>
          ) : (
            dataToDisplay.map(
              (
                user: any // Added any type to user
              ) => (
                <tr key={user._id}>
                  {" "}
                  {/* Changed user.id to user._id */}
                  <td>
                    {user?.name ||
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      user.title}
                  </td>{" "}
                  {/* Improved name display */}
                  {userType !== "course" && userType !== "department" && (
                    <td>{user.email}</td>
                  )}
                  <td>
                    {user.status || (user.isSuspended ? "Suspended" : "Active")}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        style={{
                          backgroundColor: user.isSuspended
                            ? "#66666634"
                            : "var(--yellow)",
                          color: user.isSuspended
                            ? "#666"
                            : "var(--dark-green)",
                        }}
                        onClick={() => handleToggleStatusClick(user)}
                        className={`action-btn-handleToggleStatusClick ${
                          user.isSuspended
                            ? "suspended-handleToggleStatusClick"
                            : ""
                        }`}
                      >
                        {user.isSuspended ? <FaToggleOff /> : <FaToggleOn />}
                      </button>

                      <button
                        onClick={() => handleRemoveAdminClick(user)}
                        className={`action-btn-handleToggleStatusClick ${
                          user.isSuspended
                            ? "suspended-handleToggleStatusClick"
                            : ""
                        }`}
                        style={{
                          backgroundColor: user.isSuspended
                            ? "#66666634"
                            : "var(--yellow)",
                          color: user.isSuspended
                            ? "#666"
                            : "var(--dark-green)",
                        }}
                      >
                        <FaTrashAlt />
                      </button>

                      {/* This block seems duplicated, remove one if not needed.
                        I'm keeping it as is based on the original request but
                        you might want to consolidate or clarify its purpose. */}
                      {userType === "admin" && (
                        <>
                          <button
                            onClick={() => handleRemoveAdminClick(user)}
                            className={`action-btn-handleToggleStatusClick ${
                              user.isSuspended
                                ? "suspended-handleToggleStatusClick"
                                : ""
                            }`}
                            style={{
                              backgroundColor: user.isSuspended
                                ? "#66666634"
                                : "var(--yellow)",
                              color: user.isSuspended
                                ? "#666"
                                : "var(--dark-green)",
                            }}
                          >
                            <FaTrashAlt />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className={`action-btn-handleToggleStatusClick ${
                          user.isSuspended
                            ? "suspended-handleToggleStatusClick"
                            : ""
                        }`}
                        style={{
                          backgroundColor: `var(--dark-green)`,
                          color: `var(--yellow)`,
                        }}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>
      {confirmModal && (
        <ModalDropdown onClose={() => setConfirmModal(null)}>
          <div className="admin-dashboard__confirm-modal">
            <h2 className="admin-dashboard__confirm-heading">
              {confirmModal.type === "suspend"
                ? "Confirm Suspension"
                : confirmModal.type === "unsuspend"
                ? "Confirm Unsuspension"
                : "Confirm Deletion"}
            </h2>

            <p className="admin-dashboard__confirm-text">
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
            />
            <button
              className="admin-dashboard__confirm-button"
              onClick={handleConfirmAction}
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
            >
              Cancel
            </button>
          </div>
        </ModalDropdown>
      )}

      {isModalOpen && (
        <ModalDropdown onClose={() => setIsModalOpen(false)}>
          {userType === "admin" && (
            <div className="admin0dashboard-add-admin-modal">
              <h2 className="admin0dashboard-modal-title">Add New Admin</h2>
              <form className="admin0dashboard-form" onSubmit={handleSubmitAll}>
                <div>
                  <label className="admin0dashboard-label">
                    Email
                    <input
                      type="email"
                      className="admin0dashboard-input"
                      placeholder="Enter email address"
                      value={addAdminEmail}
                      onChange={(e) => setAddAdminEmail(e.target.value)}
                    />
                  </label>
                  {formErrors.email && (
                    <p className="error-text">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="admin0dashboard-label">
                    Role
                    <select
                      className="admin0dashboard-input"
                      value={addAdminRole}
                      onChange={(e) => setAddAdminRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>

                  {formErrors.role && (
                    <p className="error-text">{formErrors.role}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    First Name
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter first name"
                      value={addAdminFirstName}
                      onChange={(e) => setAddAdminFirstName(e.target.value)}
                    />
                  </label>
                  {formErrors.firstName && (
                    <p className="error-text">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Last Name
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter last name"
                      value={addAdminLastName}
                      onChange={(e) => setAddAdminLastName(e.target.value)}
                    />
                  </label>
                  {formErrors.lastName && (
                    <p className="error-text">{formErrors.lastName}</p>
                  )}
                </div>

                <div className="form-group relative">
                  <label htmlFor="adminPassword">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="adminPassword"
                    className="form-control pr-10"
                    placeholder="Enter password"
                    value={addAdminPassword}
                    onChange={(e) => setAddAdminPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{
                      fontSize: 12,
                      padding: 8,
                      alignSelf: "flex-end",
                    }}
                    onClick={() => setShowPassword((prev: any) => !prev)}
                    className="absolute right-3 top-9 text-gray-600 focus:outline-none"
                  >
                    {showPassword ? "hide" : "show"}
                  </button>

                  {formErrors.password && (
                    <p className="error-text">{formErrors.password}</p>
                  )}
                </div>

                <div className="admin0dashboard-modal-buttons">
                  <button type="submit" className="admin0dashboard-submit-btn">
                    Add Admin
                  </button>
                  <button
                    type="button"
                    className="admin0dashboard-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {userType === "department" && (
            <div className="admin0dashboard-add-admin-modal">
              <h2 className="admin0dashboard-modal-title">
                Add New Department
              </h2>
              <form className="admin0dashboard-form" onSubmit={handleSubmitAll}>
                <div>
                  <label className="admin0dashboard-label">
                    Department Name
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter department name"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      required
                    />
                  </label>
                  {departmentNameErr && (
                    <p className="error-text">{departmentNameErr}</p>
                  )}
                </div>

                <div className="admin0dashboard-modal-buttons">
                  <button type="submit" className="admin0dashboard-submit-btn">
                    Add Department
                  </button>
                  <button
                    type="button"
                    className="admin0dashboard-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {userType === "course" && (
            <div className="admin0dashboard-add-admin-modal">
              <h2 className="admin0dashboard-modal-title">Add New Course</h2>
              <form className="admin0dashboard-form" onSubmit={handleSubmitAll}>
                <div>
                  <label className="admin0dashboard-label">
                    Course Title
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter course title"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      required
                    />
                  </label>
                  {courseTitleErr && (
                    <p className="error-text">{courseTitleErr}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Course Description
                    <textarea
                      className="admin0dashboard-input"
                      placeholder="Enter course description"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      required
                    />
                  </label>
                  {courseDescriptionErr && (
                    <p className="error-text">{courseDescriptionErr}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Select Department
                    <select
                      className="admin0dashboard-input"
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departmentsFetched?.map((dept: any) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedDepartmentIdErr && (
                    <p className="error-text">{selectedDepartmentIdErr}</p>
                  )}
                </div>

                <div className="admin0dashboard-modal-buttons">
                  <button type="submit" className="admin0dashboard-submit-btn">
                    Add Course
                  </button>
                  <button
                    type="button"
                    className="admin0dashboard-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {userType === "grade" && (
            <div className="admin0dashboard-add-admin-modal">
              <h2 className="admin0dashboard-modal-title">Add New Grade</h2>
              <form className="admin0dashboard-form" onSubmit={handleSubmitAll}>
                <div>
                  <label className="admin0dashboard-label">
                    Grade Title
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="e.g., Grade 1, Junior High"
                      value={gradeTitle}
                      onChange={(e) => setGradeTitle(e.target.value)}
                      required
                    />
                  </label>
                  {gradeTitleErr && (
                    <p className="error-text">{gradeTitleErr}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Grade Description
                    <textarea
                      className="admin0dashboard-input"
                      placeholder="e.g., First year of primary school"
                      value={gradeDescription}
                      onChange={(e) => setGradeDescription(e.target.value)}
                      required
                    />
                  </label>
                  {gradeDescriptionErr && (
                    <p className="error-text">{gradeDescriptionErr}</p>
                  )}
                </div>

                <div className="admin0dashboard-modal-buttons">
                  <button type="submit" className="admin0dashboard-submit-btn">
                    Add Grade
                  </button>
                  <button
                    type="button"
                    className="admin0dashboard-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* REFACTORED: Add Student Modal with Grade ID Dropdown */}
          {userType === "student" && (
            <div className="admin0dashboard-add-admin-modal">
              <h2 className="admin0dashboard-modal-title">Add New Student</h2>
              <form className="admin0dashboard-form" onSubmit={handleSubmitAll}>
                <div>
                  <label className="admin0dashboard-label">
                    First Name
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter first name"
                      value={userFirstName}
                      onChange={(e) => setUserFirstName(e.target.value)}
                      required
                    />
                  </label>
                  {formErrorsUsers.firstName && (
                    <p className="error-text">{formErrorsUsers.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Last Name
                    <input
                      type="text"
                      className="admin0dashboard-input"
                      placeholder="Enter last name"
                      value={userLastName}
                      onChange={(e) => setUserLastName(e.target.value)}
                      required
                    />
                  </label>
                  {formErrorsUsers.lastName && (
                    <p className="error-text">{formErrorsUsers.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Email
                    <input
                      type="email"
                      className="admin0dashboard-input"
                      placeholder="Enter email address"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </label>
                  {formErrorsUsers.email && (
                    <p className="error-text">{formErrorsUsers.email}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Phone Number
                    <input
                      type="text" // Or "tel" for mobile friendly keyboards
                      className="admin0dashboard-input"
                      placeholder="Enter phone number"
                      value={userPhoneNumber}
                      onChange={(e) => setUserPhoneNumber(e.target.value)}
                      required
                    />
                  </label>
                  {formErrorsUsers.phoneNumber && (
                    <p className="error-text">{formErrorsUsers.phoneNumber}</p>
                  )}
                </div>

                {/* UPDATED: Grade ID Dropdown */}
                <div>
                  <label className="admin0dashboard-label">
                    Select Grade
                    <select
                      className="admin0dashboard-input"
                      value={selectedGradeId}
                      onChange={(e) => setSelectedGradeId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Grade --</option>
                      {gradesFetched?.map((grade: any) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {formErrorsUsers.gradeId && (
                    <p className="error-text">{formErrorsUsers.gradeId}</p>
                  )}
                </div>

                <div>
                  <label className="admin0dashboard-label">
                    Assign Parent
                    <select
                      className="admin0dashboard-input"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                    >
                      <option value="">-- Select Parent --</option>
                      {parents.map((parent: any) => (
                        <option key={parent._id} value={parent._id}>
                          {parent.name} - {parent.email}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin0dashboard-modal-buttons">
                  <button type="submit" className="admin0dashboard-submit-btn">
                    Add Student
                  </button>
                  <button
                    type="button"
                    className="admin0dashboard-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {(userType === "parent" || userType === "teacher") &&
            userType !== "student" && (
              <div className="admin0dashboard-add-admin-modal">
                <h2 className="admin0dashboard-modal-title">
                  Add New {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </h2>
                <form
                  className="admin0dashboard-form"
                  onSubmit={handleSubmitAll}
                >
                  <div>
                    <label className="admin0dashboard-label">
                      First Name
                      <input
                        type="text"
                        className="admin0dashboard-input"
                        placeholder="Enter first name"
                        value={userFirstName}
                        onChange={(e) => setUserFirstName(e.target.value)}
                        required
                      />
                    </label>
                    {formErrorsUsers.firstName && (
                      <p className="error-text">{formErrorsUsers.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="admin0dashboard-label">
                      Last Name
                      <input
                        type="text"
                        className="admin0dashboard-input"
                        placeholder="Enter last name"
                        value={userLastName}
                        onChange={(e) => setUserLastName(e.target.value)}
                        required
                      />
                    </label>
                    {formErrorsUsers.lastName && (
                      <p className="error-text">{formErrorsUsers.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="admin0dashboard-label">
                      Email
                      <input
                        type="email"
                        className="admin0dashboard-input"
                        placeholder="Enter email address"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                      />
                    </label>
                    {formErrorsUsers.email && (
                      <p className="error-text">{formErrorsUsers.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="admin0dashboard-label">
                      Phone Number
                      <input
                        type="text"
                        className="admin0dashboard-input"
                        placeholder="Enter phone number"
                        value={userPhoneNumber}
                        onChange={(e) => setUserPhoneNumber(e.target.value)}
                        required
                      />
                    </label>
                    {formErrorsUsers.phoneNumber && (
                      <p className="error-text">
                        {formErrorsUsers.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="admin0dashboard-modal-buttons">
                    <button
                      type="submit"
                      className="admin0dashboard-submit-btn"
                    >
                      Add {userType.charAt(0).toUpperCase() + userType.slice(1)}
                    </button>
                    <button
                      type="button"
                      className="admin0dashboard-cancel-btn"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
        </ModalDropdown>
      )}
    </div>
  );
};

export default AdminDashboard;
