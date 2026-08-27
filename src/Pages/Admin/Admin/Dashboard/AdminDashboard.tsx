/* ─────────────────────────────────────────────────────────────────────────────
   AdminDashboard.tsx – COMPLETE & FULLY FIXED VERSION
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
import axios from "axios";
import { BASE_URL } from "../../../../Redux/baseurl";
import suspendImage from "../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../assets/images/admin/removeImage.png";
import { Loader2, User, X } from "lucide-react";

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
  course: ["all", "active", "disabled"],
  department: ["all", "active", "disabled"],
  grade: ["all", "active", "disabled"],
};

const formatFilterText = (text: string) =>
  text
    .replace(/([A-Z0-9])/g, " $1")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/\s+/g, " ");

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userType }) => {
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

  // Admin Form
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminRole, setAddAdminRole] = useState("");
  const [addAdminFirstName, setAddAdminFirstName] = useState("");
  const [addAdminLastName, setAddAdminLastName] = useState("");
  const [addAdminPassword, setAddAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Common User Form
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

  console.log(loadingSubjects);
  const token = localStorage.getItem("token");

  // Errors
  const [formErrors, setFormErrors] = useState({
    email: "",
    role: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  const [formErrorsUsers, setFormErrorsUsers] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    grades?: string;
  }>({});

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
  /* Reset Forms */
  /* ------------------------------------------------------------------ */
  const resetAdminForm = () => {
    setAddAdminEmail("");
    setAddAdminRole("");
    setAddAdminFirstName("");
    setAddAdminLastName("");
    setAddAdminPassword("");
    setFormErrors({
      email: "",
      role: "",
      firstName: "",
      lastName: "",
      password: "",
    });
  };

  const resetUserForm = () => {
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setUserPhoneNumber("");
    setParentId("");
    setSelectedGradeIds([]);
    setSelectedSubjectIds([]);
    setFormErrorsUsers({});
  };

  /* ------------------------------------------------------------------ */
  /* Submit Form */
  /* ------------------------------------------------------------------ */
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (userType === "admin") {
        const errors: any = {};
        if (!addAdminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addAdminEmail))
          errors.email = "Valid email is required";
        if (!addAdminRole) errors.role = "Role is required";
        if (!addAdminFirstName) errors.firstName = "First name is required";
        if (!addAdminLastName) errors.lastName = "Last name is required";
        if (!addAdminPassword || addAdminPassword.length < 6)
          errors.password = "Password must be at least 6 characters";

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
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
          addToast("success", "Admin added successfully!");
          resetAdminForm();
          fetchUsers();
          setIsModalOpen(false);
        } else {
          addToast("error", res.message || "Failed to add admin");
        }
      } else if (["parent", "student", "teacher"].includes(userType)) {
        const errors: any = {};
        if (!userFirstName) errors.firstName = "First name is required";
        if (!userLastName) errors.lastName = "Last name is required";
        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
          errors.email = "Valid email is required";
        if (!userPhoneNumber) errors.phoneNumber = "Phone number is required";
        if (userType === "teacher" && selectedGradeIds.length === 0)
          errors.grades = "Please select at least one grade";

        setFormErrorsUsers(errors);
        if (Object.keys(errors).length > 0) {
          setLoading(false);
          return;
        }

        const body: any = {
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          phoneNumber: userPhoneNumber,
          userType,
          ...(userType === "student" && parentId && { parentId }),
          ...(userType === "teacher" && {
            gradeIds: selectedGradeIds,
            subjectIds: selectedSubjectIds,
          }),
        };

        const res: any = await dispatch(createUser(body)).unwrap();

        if (res.success) {
          addToast(
            "success",
            `${
              userType.charAt(0).toUpperCase() + userType.slice(1)
            } created successfully!`
          );
          resetUserForm();
          fetchUsers();
          setIsModalOpen(false);
        } else {
          addToast("error", res.message || "Failed to create user");
        }
      }
    } catch (err: any) {
      addToast("error", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Close Modal & Reset */
  /* ------------------------------------------------------------------ */
  const closeModal = () => {
    setIsModalOpen(false);
    resetAdminForm();
    resetUserForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {isLoading && !isModalOpen ? (
        <div className="min-h-[100vh] flex flex-col items-center justify-center">
          <Loader2 className="w-14 h-14 animate-spin text-green-700" />
          <p className="mt-4 text-green-700 text-[14px] font-semibold">
            Loading...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#064e3b] rounded-2xl flex items-center justify-center text-yellow-400 shadow-lg shadow-emerald-900/20">
                <FaUserPlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-[#064e3b] tracking-tighter">
                  {getTitle()}
                </h1>
                <p className="text-slate-500 font-bold text-sm">
                  Directory of all registered {userType}s in the system.
                </p>
              </div>
            </div>
          </div>

          {/* Filters + Add Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              {filterOptions[userType]?.map((f) => (
                <button
                  key={f}
                  onClick={() => navigate(`/${userType}/dashboard/${f}`)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f
                      ? "bg-yellow-400 text-[#064e3b] shadow-md shadow-yellow-400/20"
                      : "bg-transparent text-slate-400 hover:text-[#064e3b] hover:bg-slate-50"
                  }`}
                >
                  {formatFilterText(f)}
                </button>
              ))}
            </div>

            {/* Allow Add for admin, teacher AND student */}
            {(userType === "teacher" ||
              userType === "admin" ||
              userType === "student") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-3 bg-[#064e3b] text-yellow-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
              >
                <FaUserPlus /> Add {userType}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Name
                    </th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Email Address
                    </th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filterData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <User size={48} className="text-[#064e3b]" />
                          <p className="font-black text-xs uppercase tracking-widest">
                            No {userType}s Found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filterData.map((user: any) => (
                      <tr
                        key={user._id}
                        className="group hover:bg-emerald-50/30 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(user._id)}
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#064e3b] font-black border border-emerald-100">
                              {user.firstName?.[0] || user.name?.[0] || "?"}
                            </div>
                            <span className="font-black text-[#064e3b] text-base tracking-tight">
                              {user.name ||
                                `${user.firstName || ""} ${
                                  user.lastName || ""
                                }`.trim() ||
                                "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-500">
                          {user.email || "—"}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              user.isSuspended
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.isSuspended
                                  ? "bg-red-600"
                                  : "bg-emerald-600"
                              }`}
                            />
                            {user.isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(userType === "teacher" ||
                              userType === "admin" ||
                              userType === "student") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAdminClick(user);
                                }}
                                className="p-3 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <FaTrashAlt className="w-4 h-4" />
                              </button>
                            )}
                            <div className="p-3 rounded-xl text-[#064e3b] group-hover:bg-yellow-400 transition-all">
                              <FaChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
                  ADD USER MODAL – Restyled
                ═══════════════════════════════════════════════════════════════ */}
          {isModalOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={closeModal}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto my-8 overflow-hidden border border-slate-100"
                >
                  {/* Header */}
                  <div className="relative bg-[#064e3b] px-8 py-7">
                    <button
                      onClick={closeModal}
                      className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-[#064e3b] shadow-lg">
                        <FaUserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                          Add New{" "}
                          {userType.charAt(0).toUpperCase() + userType.slice(1)}
                        </h2>
                        <p className="text-emerald-100 text-sm font-medium mt-0.5">
                          Fill in the details to create a new account
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <form
                    onSubmit={handleSubmitAll}
                    className="p-8 space-y-6 max-h-[70vh] overflow-y-auto"
                  >
                    {/* ─── Admin Form ─── */}
                    {userType === "admin" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={addAdminEmail}
                            onChange={(e) => setAddAdminEmail(e.target.value)}
                            placeholder="admin@school.edu"
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-xs font-semibold mt-1.5">
                              {formErrors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                            Role
                          </label>
                          <div className="flex gap-4">
                            {["superadmin", "admin"].map((role) => (
                              <label
                                key={role}
                                className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                  addAdminRole === role
                                    ? "border-yellow-400 bg-yellow-50"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
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
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    addAdminRole === role
                                      ? "border-[#064e3b] bg-[#064e3b]"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {addAdminRole === role && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                                  )}
                                </div>
                                <span
                                  className={`font-bold text-sm ${
                                    addAdminRole === role
                                      ? "text-[#064e3b]"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {role === "superadmin"
                                    ? "Super Admin"
                                    : "Admin"}
                                </span>
                              </label>
                            ))}
                          </div>
                          {formErrors.role && (
                            <p className="text-red-500 text-xs font-semibold mt-1.5">
                              {formErrors.role}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={addAdminFirstName}
                              onChange={(e) =>
                                setAddAdminFirstName(e.target.value)
                              }
                              placeholder="John"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrors.firstName && (
                              <p className="text-red-500 text-xs font-semibold mt-1.5">
                                {formErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={addAdminLastName}
                              onChange={(e) =>
                                setAddAdminLastName(e.target.value)
                              }
                              placeholder="Doe"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrors.lastName && (
                              <p className="text-red-500 text-xs font-semibold mt-1.5">
                                {formErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={addAdminPassword}
                              onChange={(e) =>
                                setAddAdminPassword(e.target.value)
                              }
                              placeholder="••••••••"
                              className="w-full px-5 py-3.5 pr-16 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#064e3b] font-bold text-xs uppercase tracking-wider hover:text-emerald-700"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                          {formErrors.password && (
                            <p className="text-red-500 text-xs font-semibold mt-1.5">
                              {formErrors.password}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ─── Parent / Student / Teacher Form ─── */}
                    {["parent", "student", "teacher"].includes(userType) && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={userFirstName}
                              onChange={(e) => setUserFirstName(e.target.value)}
                              placeholder="Emma"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrorsUsers.firstName && (
                              <p className="text-red-500 text-xs font-semibold mt-1.5">
                                {formErrorsUsers.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={userLastName}
                              onChange={(e) => setUserLastName(e.target.value)}
                              placeholder="Wilson"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrorsUsers.lastName && (
                              <p className="text-red-500 text-xs font-semibold mt-1.5">
                                {formErrorsUsers.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="emma.wilson@school.com"
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrorsUsers.email && (
                            <p className="text-red-500 text-xs font-semibold mt-1.5">
                              {formErrorsUsers.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={userPhoneNumber}
                            onChange={(e) => setUserPhoneNumber(e.target.value)}
                            placeholder="+234 801 234 5678"
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrorsUsers.phoneNumber && (
                            <p className="text-red-500 text-xs font-semibold mt-1.5">
                              {formErrorsUsers.phoneNumber}
                            </p>
                          )}
                        </div>

                        {userType === "student" && (
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              Select Parent
                            </label>
                            <select
                              value={parentId}
                              onChange={(e) => setParentId(e.target.value)}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#064e3b] font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
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
                            {/* Grades */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-[#064e3b] text-yellow-400 flex items-center justify-center text-xs font-black">
                                    1
                                  </span>
                                  <h3 className="text-sm font-black text-[#064e3b]">
                                    Assign Grades{" "}
                                    <span className="text-red-500">*</span>
                                  </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                  {selectedGradeIds.length} selected
                                </span>
                              </div>

                              {loadingGrades ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#064e3b]" />
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                  {grades.map((grade) => {
                                    const isSelected =
                                      selectedGradeIds.includes(grade._id);
                                    return (
                                      <label
                                        key={grade._id}
                                        className="cursor-pointer"
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
                                          className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                                            isSelected
                                              ? "bg-[#064e3b] border-[#064e3b] text-yellow-400 shadow-md scale-[1.02]"
                                              : "bg-white border-slate-200 hover:border-emerald-300 text-slate-700"
                                          }`}
                                        >
                                          <p className="font-black text-lg leading-none">
                                            {grade.title.match(/\d+/)?.[0] ||
                                              "?"}
                                          </p>
                                          <p
                                            className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${
                                              isSelected
                                                ? "text-emerald-200"
                                                : "text-slate-400"
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
                                <p className="text-red-500 text-xs font-semibold mt-2">
                                  {formErrorsUsers.grades}
                                </p>
                              )}
                            </div>

                            {/* Subjects */}
                            {selectedGradeIds.length > 0 && (
                              <div className="pt-2 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-yellow-400 text-[#064e3b] flex items-center justify-center text-xs font-black">
                                      2
                                    </span>
                                    <h3 className="text-sm font-black text-[#064e3b]">
                                      Assign Subjects
                                    </h3>
                                  </div>
                                  <span className="text-xs font-bold text-slate-400">
                                    {selectedSubjectIds.length} selected
                                  </span>
                                </div>

                                {selectedGradeIds.map((gradeId) => {
                                  const grade = grades.find(
                                    (g) => g._id === gradeId
                                  );
                                  const subjects =
                                    subjectsByGrade[gradeId] || [];
                                  if (subjects.length === 0) return null;

                                  return (
                                    <div
                                      key={gradeId}
                                      className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
                                    >
                                      <h4 className="font-black text-[#064e3b] text-sm mb-3">
                                        {grade?.title}
                                      </h4>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {subjects.map((subject) => {
                                          const isSelected =
                                            selectedSubjectIds.includes(
                                              subject._id
                                            );
                                          return (
                                            <label
                                              key={subject._id}
                                              className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all ${
                                                isSelected
                                                  ? "bg-[#064e3b] text-yellow-400"
                                                  : "bg-white border border-slate-200 hover:border-emerald-300"
                                              }`}
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
                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                  isSelected
                                                    ? "border-yellow-400 bg-yellow-400"
                                                    : "border-slate-300"
                                                }`}
                                              >
                                                {isSelected && (
                                                  <div className="w-1.5 h-1.5 bg-[#064e3b] rounded-full" />
                                                )}
                                              </div>
                                              <span
                                                className={`text-sm font-semibold truncate ${
                                                  isSelected
                                                    ? "text-yellow-400"
                                                    : "text-slate-700"
                                                }`}
                                              >
                                                {subject.name || subject.title}
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

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-4 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20 disabled:opacity-60"
                      >
                        {isLoading
                          ? "Creating..."
                          : `Create ${
                              userType.charAt(0).toUpperCase() +
                              userType.slice(1)
                            }`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
                  CONFIRM DELETE / SUSPEND MODAL – Restyled
                ═══════════════════════════════════════════════════════════════ */}
          {confirmModal && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setConfirmModal(null)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
                >
                  {/* Colored Header */}
                  <div
                    className={`px-8 py-10 text-center relative ${
                      confirmModal.type === "remove"
                        ? "bg-gradient-to-br from-red-600 to-rose-700"
                        : "bg-gradient-to-br from-amber-500 to-orange-600"
                    }`}
                  >
                    <div className="w-24 h-24 mx-auto mb-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <img
                        src={
                          confirmModal.type === "remove"
                            ? removeImage
                            : suspendImage
                        }
                        alt=""
                        className="w-14 h-14"
                      />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {confirmModal.type === "remove" ? "Delete" : "Suspend"}{" "}
                      {userType}?
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-8">
                    <p className="text-center text-slate-600 font-medium leading-relaxed">
                      You are about to{" "}
                      <span
                        className={`font-black ${
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
                    <p className="text-center text-sm text-slate-400 mt-2">
                      All associated data will be affected.
                    </p>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAction}
                        className={`flex-1 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition hover:scale-[1.02] ${
                          confirmModal.type === "remove"
                            ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                            : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
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
