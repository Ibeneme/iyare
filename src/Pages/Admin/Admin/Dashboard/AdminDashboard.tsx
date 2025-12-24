/* ─────────────────────────────────────────────────────────────────────────────
   AdminDashboard.tsx – FULLY UPGRADED (Grades + Subjects for Teachers)
   ───────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronRight, FaUserPlus, FaTrashAlt } from "react-icons/fa";
import { useAdminActions } from "../../../../Hooks/useAdmins";
import { addAdmin } from "../../../../Redux/Admin/Auth";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../Redux/store";
import { useToast } from "../../../../Context/ToastProvider";
import {
  createUser,
  fetchAllUsersByType,
} from "../../../../Redux/Admin/adminUsers";
import useUserRole from "../../../../Hooks/useUserRole";
import axios from "axios";
import { BASE_URL } from "../../../../Redux/baseurl";
import suspendImage from "../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../assets/images/admin/removeImage.png";
import { Loader2 } from "lucide-react";

const GRADES_API = `${BASE_URL}/api/grades/grades`;

interface AdminUser {
  _id: string;
  isSuspended: boolean;
}

export type UserType =
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "notFound"
  | "course"
  | "department"
  | "grade";

export type FilterType = "all" | "active" | "disabled" | "suspended";

interface AdminDashboardProps {
  userType: UserType;
  initialFilter?: FilterType; // <- add this line
}

interface Grade {
  _id: string;
  title: string;
}

interface Subject {
  _id: string;
  title: string;
  name: string;
}

const filterOptions: Record<UserType, FilterType[]> = {
  admin: ["all", "active", "disabled"],
  parent: ["all", "active", "disabled"],
  student: ["all", "active", "disabled"],
  teacher: ["all", "active", "disabled"],
  notFound: ["all"],
  course: ["all", "active", "disabled"], // added
  department: ["all", "active", "disabled"], // added
  grade: ["all", "active", "disabled"], // added
};

const formatFilterText = (text: string) =>
  text
    .replace(/([A-Z0-9])/g, " $1")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/\s+/g, " ");

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userType }) => {
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();
  const { filter: urlFilter } = useParams<{ filter?: string }>();
  const filter = (urlFilter as FilterType) || "all";

  const { suspendAdmin, removeAdmin } = useAdminActions();

  const [isLoading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // User lists
  const [adminsFilter, setAdminsFilter] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Form states
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminRole, setAddAdminRole] = useState("");
  const [addAdminFirstName, setAddAdminFirstName] = useState("");
  const [addAdminLastName, setAddAdminLastName] = useState("");
  const [addAdminPassword, setAddAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [parentId, setParentId] = useState("");

  // Teacher-specific
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsByGrade, setSubjectsByGrade] = useState<
    Record<string, Subject[]>
  >({});
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const token = localStorage.getItem("token");

  const [formErrors, setFormErrors] = useState({
    email: "",
    role: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  console.log(loadingSubjects, formErrors);
  const [formErrorsUsers, setFormErrorsUsers] = useState<any>({});

  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "remove" | "unsuspend";
    id: string | null;
    userType: UserType;
  } | null>(null);

  /* ------------------------------------------------------------------ */
  /* Fetch Users */
  /* ------------------------------------------------------------------ */
  const fetchUsers = async () => {
    setLoading(true);
    const types: UserType[] = ["admin", "teacher", "parent", "student"];
    const promises = types.map((type) =>
      dispatch(fetchAllUsersByType(type as any))
    );

    try {
      const results = await Promise.all(promises);
      results.forEach((res: any) => {
        if (res.payload?.userType && res.payload?.users) {
          switch (res.payload.userType) {
            case "admin":
              setAdminsFilter(res.payload.users);
              break;
            case "teacher":
              setTeachers(res.payload.users);
              break;
            case "parent":
              setParents(res.payload.users);
              break;
            case "student":
              setStudents(res.payload.users);
              break;
          }
        }
      });
    } catch {
      addToast("error", "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    fetchUsers();
  }, [userType, filter]);

  /* ------------------------------------------------------------------ */
  /* Fetch Grades */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!token || userType !== "teacher") return;

    const fetchGrades = async () => {
      try {
        setLoadingGrades(true);
        const res = await axios.get(GRADES_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGrades(res.data.data || res.data || []);
      } catch (err: any) {
        addToast(
          "error",
          err.response?.data?.message || "Failed to load grades"
        );
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [token, userType]);

  /* ------------------------------------------------------------------ */
  /* Fetch Subjects for Selected Grade */
  /* ------------------------------------------------------------------ */
  const fetchSubjectsForGrade = async (gradeId: string) => {
    if (subjectsByGrade[gradeId] || !token) return;

    try {
      setLoadingSubjects(true);
      const res = await axios.get(`${GRADES_API}/subjects/${gradeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjects = res.data.data || [];
      setSubjectsByGrade((prev) => ({ ...prev, [gradeId]: subjects }));
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    selectedGradeIds.forEach(fetchSubjectsForGrade);
  }, [selectedGradeIds]);

  /* ------------------------------------------------------------------ */
  /* Data Filtering */
  /* ------------------------------------------------------------------ */
  const getSampleData = () => {
    switch (userType) {
      case "admin":
        return adminsFilter;
      case "parent":
        return parents;
      case "student":
        return students;
      case "teacher":
        return teachers;
      default:
        return [];
    }
  };

  const filterData = useMemo(() => {
    const data = getSampleData();
    if (filter === "all") return data;
    return data.filter((item: any) => {
      switch (filter) {
        case "active":
          return !item.isSuspended;
        case "suspended":
        case "disabled":
          return item.isSuspended;
        default:
          return true;
      }
    });
  }, [filter, adminsFilter, parents, students, teachers, userType]);

  /* ------------------------------------------------------------------ */
  /* Actions */
  /* ------------------------------------------------------------------ */
  const handleRemoveAdminClick = (user: AdminUser) => {
    setConfirmModal({ type: "remove", id: user._id, userType });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal?.id) return;
    const { id, type, userType } = confirmModal;
    setLoading(true);
    setConfirmModal(null);

    const action =
      type === "remove"
        ? removeAdmin(id, userType as any)
        : suspendAdmin(id, userType as any);

    try {
      const res = await action;
      if (res.success) {
        addToast("success", "Action successful");
        fetchUsers();
      } else {
        addToast("error", "Action failed");
      }
    } catch {
      addToast("error", "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/user-details/${userType}/${id}`);
  };

  const getTitle = () =>
    userType
      ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard`
      : "Dashboard";

  /* ------------------------------------------------------------------ */
  /* Submit Form */
  /* ------------------------------------------------------------------ */
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    setLoading(true);

    try {
      if (userType === "admin") {
        // ... (same as before)
        const errors: any = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addAdminEmail))
          errors.email = "Invalid email";
        if (!addAdminRole) errors.role = "Required";
        if (!addAdminFirstName) errors.firstName = "Required";
        if (!addAdminLastName) errors.lastName = "Required";
        if (!addAdminPassword || addAdminPassword.length < 6)
          errors.password = "Min 6 chars";

        setFormErrors(errors);
        if (Object.keys(errors).length) {
          setIsModalOpen(true);
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
          addToast("success", "Admin added!");
          setAddAdminEmail("");
          setAddAdminRole("");
          setAddAdminFirstName("");
          setAddAdminLastName("");
          setAddAdminPassword("");
        }
      } else if (["parent", "student", "teacher"].includes(userType)) {
        const errors: any = {};
        if (!userFirstName) errors.firstName = "Required";
        if (!userLastName) errors.lastName = "Required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
          errors.email = "Invalid email";
        if (!userPhoneNumber) errors.phoneNumber = "Required";

        if (userType === "teacher" && selectedGradeIds.length === 0)
          errors.grades = "Select at least one grade";

        setFormErrorsUsers(errors);
        if (Object.keys(errors).length) {
          setIsModalOpen(true);
          setLoading(false);
          return;
        }

        const body: any = {
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          phoneNumber: userPhoneNumber,
          userType,
          ...(userType === "student" && { parentId }),
          ...(userType === "teacher" && {
            gradeIds: selectedGradeIds,
            subjectIds: selectedSubjectIds,
          }),
        };

        const res: any = await dispatch(createUser(body));
        if (res.payload?.success) {
          fetchUsers();
          addToast("success", `${userType} created!`);
          // Reset all
          setUserFirstName("");
          setUserLastName("");
          setUserEmail("");
          setUserPhoneNumber("");
          setParentId("");
          setSelectedGradeIds([]);
          setSelectedSubjectIds([]);
        } else {
          addToast("error", "Failed");
          setIsModalOpen(true);
        }
      }
    } catch (err: any) {
      addToast("error", err.message || "Something went wrong");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <div className="min-h-[100%] flex py-48 flex-col min-h-[100%] items-center justify-center bg-white/70 backdrop-blur-sm z-50">
          <Loader2 className="w-14 h-14 animate-spin text-green-700" />
          <p className="mt-4 text-green-700 text-[14px] font-semibold">
            Loading...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-yellow-300">
                <FaUserPlus className="w-5 h-5" />
              </div>
              {getTitle()}
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Browse through a comprehensive list of all registered {userType}s.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions[userType]?.map((f) => (
              <button
                key={f}
                onClick={() => navigate(`/${userType}/dashboard/${f}`)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-green-700 text-yellow-300 shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {formatFilterText(f)}
              </button>
            ))}
          </div>

          {userRole === "admin" &&
            (userType === "teacher" || userType === "admin") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mb-6 inline-flex items-center gap-2 bg-green-700 text-yellow-300 px-5 py-3 rounded-lg font-medium hover:bg-green-800 transition-all shadow-sm"
              >
                <FaUserPlus /> Add{" "}
                {userType.charAt(0).toUpperCase() + userType.slice(1)}
              </button>
            )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filterData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No {userType}s found
                      </td>
                    </tr>
                  ) : (
                    filterData.map((user: any) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                        onClick={() => handleViewDetails(user._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name ||
                            `${user.firstName || ""} ${
                              user.lastName || ""
                            }`.trim() ||
                            "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                              user.isSuspended
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {userType === "teacher" ||
                              (userType === "admin" && (
                                <button
                                  onClick={() => handleRemoveAdminClick(user)}
                                  className="p-2 rounded-lg bg-yellow-100 text-green-700 hover:bg-yellow-200"
                                  title="Remove"
                                >
                                  <FaTrashAlt className="w-4 h-4" />
                                </button>
                              ))}
                            <button
                              onClick={() => handleViewDetails(user._id)}
                              className="p-2 rounded-lg bg-green-700 text-yellow-300 hover:bg-green-800"
                              title="View Details"
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isModalOpen && userRole === "admin" && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setIsModalOpen(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-auto my-8 overflow-hidden animate-in fade-in zoom-in duration-300"
                >
                  <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 text-white relative">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <h2 className="text-3xl font-extrabold tracking-tight pr-12">
                      Add New{" "}
                      {userType.charAt(0).toUpperCase() + userType.slice(1)}
                    </h2>
                    <p className="text-white/90 mt-1 text-sm font-medium">
                      Fill in the details below to create a new account
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmitAll}
                    className="p-6 space-y-7 max-h-[75vh] overflow-y-auto"
                  >
                    {userType === "admin" && (
                      <>
                        <div className="space-y-5">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={addAdminEmail}
                              onChange={(e) => setAddAdminEmail(e.target.value)}
                              placeholder="admin@school.edu"
                              className="mt-2 w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Role
                            </label>
                            <div className="mt-3 flex gap-6">
                              {["superadmin", "admin"].map((role) => (
                                <label
                                  key={role}
                                  className="flex items-center gap-3 cursor-pointer group"
                                >
                                  <input
                                    type="radio"
                                    name="adminRole"
                                    value={role}
                                    checked={addAdminRole === role}
                                    onChange={(e) =>
                                      setAddAdminRole(e.target.value)
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all
                               ${
                                 addAdminRole === role
                                   ? "border-emerald-500 bg-emerald-500 shadow-lg"
                                   : "border-gray-300 group-hover:border-emerald-400"
                               }`}
                                  >
                                    {addAdminRole === role && (
                                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                    )}
                                  </div>
                                  <span
                                    className={`font-medium capitalize ${
                                      addAdminRole === role
                                        ? "text-emerald-600"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {role === "superadmin"
                                      ? "Super Admin"
                                      : "Admin"}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={addAdminFirstName}
                                onChange={(e) =>
                                  setAddAdminFirstName(e.target.value)
                                }
                                placeholder="John"
                                className="mt-2 w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={addAdminLastName}
                                onChange={(e) =>
                                  setAddAdminLastName(e.target.value)
                                }
                                placeholder="Doe"
                                className="mt-2 w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Password
                            </label>
                            <div className="relative mt-2">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={addAdminPassword}
                                onChange={(e) =>
                                  setAddAdminPassword(e.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full px-5 py-4 pr-16 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-sm hover:underline"
                              >
                                {showPassword ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {["parent", "student", "teacher"].includes(userType) && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={userFirstName}
                              onChange={(e) => setUserFirstName(e.target.value)}
                              placeholder="Emma"
                              className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                        text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 
                        focus:border-emerald-500 transition"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={userLastName}
                              onChange={(e) => setUserLastName(e.target.value)}
                              placeholder="Wilson"
                              className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                        text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 
                        focus:border-emerald-500 transition"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="emma.wilson@school.com"
                            className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                      text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 
                      focus:border-emerald-500 transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={userPhoneNumber}
                            onChange={(e) => setUserPhoneNumber(e.target.value)}
                            placeholder="+234 801 234 5678"
                            className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                      text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 
                      focus:border-emerald-500 transition"
                            required
                          />
                        </div>

                        {userType === "student" && (
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                              Select Parent
                            </label>
                            <select
                              value={parentId}
                              onChange={(e) => setParentId(e.target.value)}
                              className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                        text-gray-900 focus:ring-4 focus:ring-emerald-200 
                        focus:border-emerald-500 transition"
                            >
                              <option value="">Choose parent...</option>
                              {parents.map((p: any) => (
                                <option key={p._id} value={p._id}>
                                  {p.firstName} {p.lastName} • {p.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {userType === "teacher" && (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                  <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs">
                                    1
                                  </span>
                                  Assign Grades
                                  <span className="text-red-500">*</span>
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {selectedGradeIds.length} selected
                                </span>
                              </div>

                              {loadingGrades ? (
                                <div className="flex justify-center py-6">
                                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                  {grades.map((grade) => {
                                    const isSelected =
                                      selectedGradeIds.includes(grade._id);

                                    return (
                                      <label
                                        key={grade._id}
                                        className="cursor-pointer relative"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() =>
                                            setSelectedGradeIds((prev) =>
                                              prev.includes(grade._id)
                                                ? prev.filter(
                                                    (id) => id !== grade._id
                                                  )
                                                : [...prev, grade._id]
                                            )
                                          }
                                          className="sr-only"
                                        />

                                        <div
                                          className={`p-4 rounded-xl border text-center transition shadow-sm
                             ${
                               isSelected
                                 ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                                 : "bg-white border-gray-300 hover:border-emerald-400"
                             }
                           `}
                                        >
                                          <p className="font-bold text-lg">
                                            {grade.title.match(/\d+/)?.[0] ||
                                              "?"}
                                          </p>
                                          <p
                                            className={`text-xs mt-1 ${
                                              isSelected
                                                ? "text-white/90"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {grade.title
                                              .replace(/\d+/g, "")
                                              .trim() || "Grade"}
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                              {formErrorsUsers.grades && (
                                <p className="text-red-600 text-sm mt-2">
                                  {formErrorsUsers.grades}
                                </p>
                              )}
                            </div>

                            {selectedGradeIds.length > 0 && (
                              <div className="space-y-5">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">
                                      2
                                    </span>
                                    Assign Subjects
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    {selectedSubjectIds.length} selected
                                  </span>
                                </div>

                                {selectedGradeIds.map((gradeId) => {
                                  const grade = grades.find(
                                    (g) => g._id === gradeId
                                  );
                                  const subjects =
                                    subjectsByGrade[gradeId] || [];
                                  if (!subjects.length) return null;

                                  return (
                                    <div
                                      key={gradeId}
                                      className="bg-purple-50 p-5 rounded-xl border border-purple-200"
                                    >
                                      <h4 className="font-semibold text-purple-800 mb-3">
                                        {grade?.title}
                                      </h4>

                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {subjects.map((subject) => {
                                          const isSelected =
                                            selectedSubjectIds.includes(
                                              subject._id
                                            );
                                          return (
                                            <label
                                              key={subject._id}
                                              className="flex items-center gap-3 cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                  setSelectedSubjectIds(
                                                    (prev) =>
                                                      prev.includes(subject._id)
                                                        ? prev.filter(
                                                            (id) =>
                                                              id !== subject._id
                                                          )
                                                        : [...prev, subject._id]
                                                  )
                                                }
                                                className="sr-only"
                                              />
                                              <div
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition
                                   ${
                                     isSelected
                                       ? "bg-purple-600 border-purple-600"
                                       : "border-gray-300"
                                   }
                                 `}
                                              >
                                                {isSelected && (
                                                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                                )}
                                              </div>
                                              <span
                                                className={`text-sm ${
                                                  isSelected
                                                    ? "text-purple-700"
                                                    : "text-gray-700"
                                                }`}
                                              >
                                                {subject.name}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-xl"
                      >
                        Create{" "}
                        {userType.charAt(0).toUpperCase() + userType.slice(1)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {confirmModal && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-all duration-300"
                onClick={() => setConfirmModal(null)}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out"
                >
                  <div
                    className={`px-8 py-10 text-white text-center relative overflow-hidden
          ${
            confirmModal.type === "remove"
              ? "bg-gradient-to-br from-red-600 to-rose-700"
              : "bg-gradient-to-br from-amber-600 to-orange-700"
          }`}
                  >
                    <div className="absolute inset-0 bg-white/10"></div>
                    <div className="relative z-10">
                      <div className="w-28 h-28 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <img
                          src={
                            confirmModal.type === "remove"
                              ? removeImage
                              : suspendImage
                          }
                          alt=""
                          className="w-16 h-16"
                        />
                      </div>
                      <h3 className="text-3xl font-extrabold tracking-tight">
                        {confirmModal.type === "remove" ? "Delete" : "Suspend"}{" "}
                        {userType}?
                      </h3>
                      <br />
                      <br /> <br />
                    </div>

                    <svg
                      className="absolute bottom-0 left-0 w-full"
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <path
                        fill="white"
                        d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,176C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z"
                      />
                    </svg>
                  </div>

                  <div className="p-8 bg-white">
                    <div className="text-center mb-8">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        You are about to{" "}
                        <span
                          className={`font-bold ${
                            confirmModal.type === "remove"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {confirmModal.type === "remove"
                            ? "permanently delete"
                            : "suspend"}
                        </span>{" "}
                        this {userType}.
                      </p>
                      <p className="text-sm text-gray-500 mt-3">
                        All associated data will be affected.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all duration-200 shadow-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAction}
                        className={`flex-1 py-4 text-white rounded-2xl font-bold text-lg shadow-xl transition-all duration-200 transform hover:scale-105
                ${
                  confirmModal.type === "remove"
                    ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                    : "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800"
                }`}
                      >
                        Yes,{" "}
                        {confirmModal.type === "remove"
                          ? "Delete Forever"
                          : "Suspend User"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
