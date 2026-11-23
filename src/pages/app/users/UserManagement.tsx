import Select from "../../../components/ui/Select";
import { getCookie } from "../../../utils/cookies";
/* ─────────────────────────────────────────────────────────────────────────────
   AdminDashboard.tsx – COMPLETE & FULLY FIXED VERSION
   ───────────────────────────────────────────────────────────────────────────── */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronRight, FaUserPlus, FaTrashAlt } from "react-icons/fa";
import { useAdminActions } from "../../../hooks/useAdmins";
import { addAdmin } from "../../../store/features/auth/auth.slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { useToast } from "../../../contexts/ToastContext";
import {
  createUser,
  fetchAllUsersByType,
} from "../../../store/features/users/users.slice";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
import suspendImage from "../../../assets/images/admin/suspend.png";
import removeImage from "../../../assets/images/admin/removeImage.png";
import {
  Loader2,
  User,
  X,
  Download,
  FileJson,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

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

interface WindowMetric {
  key: string;
  label: string;
  hours: number;
  current: number;
  previous: number;
  deltaPct: number | null;
}

const TIME_WINDOWS: { key: string; label: string; hours: number }[] = [
  { key: "24h", label: "Last 24 hrs", hours: 24 },
  { key: "48h", label: "Last 48 hrs", hours: 48 },
  { key: "72h", label: "Last 72 hrs", hours: 72 },
  { key: "2w", label: "2 Weeks", hours: 24 * 14 },
  { key: "1m", label: "1 Month", hours: 24 * 30 },
];

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

const getUserDisplayName = (user: any): string => {
  if (user?.name && String(user.name).trim()) {
    return String(user.name).trim();
  }
  const full = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return full || "—";
};

const getRecordTimestamp = (item: any): number | null => {
  const candidate = item?.createdAt || item?.created_at || item?.updatedAt;
  if (candidate) {
    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  // Fallback: extract ObjectId timestamp if _id is a 24-hex Mongo ID
  if (typeof item?._id === "string" && /^[a-f\d]{24}$/i.test(item._id)) {
    const seconds = parseInt(item._id.slice(0, 8), 16);
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  return null;
};

const sanitizeUserForExport = (user: any, role: UserType) => ({
  id: user?._id ?? "",
  userType: role,
  name: getUserDisplayName(user),
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  email: user?.email ?? "",
  phoneNumber: user?.phoneNumber ?? user?.phone ?? "",
  status: user?.isSuspended ? "Suspended" : "Active",
  isSuspended: Boolean(user?.isSuspended),
  createdAt: user?.createdAt ?? "",
  raw: user,
});

const escapeCsvCell = (value: unknown): string => {
  const str =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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

  // Teacher-specific (grades optional)
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsByGrade, setSubjectsByGrade] = useState<
    Record<string, Subject[]>
  >({});
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  console.log(loadingSubjects);
  const token = getCookie("token");

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
      dispatch(fetchAllUsersByType(type as any)),
    );

    try {
      const results = await Promise.all(promises);
      results.forEach((res: any, idx: number) => {
        const resolvedType = res.payload?.userType || types[idx];
        const list =
          res.payload?.users ||
          res.payload?.data ||
          (Array.isArray(res.payload) ? res.payload : null);

        if (Array.isArray(list)) {
          switch (resolvedType) {
            case "admin":
              setAdminsFilter(list);
              break;
            case "teacher":
              setTeachers(list);
              break;
            case "parent":
              setParents(list);
              break;
            case "student":
              setStudents(list);
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
          err.response?.data?.message || "Failed to load grades",
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

  const activeParents = useMemo(
    () => parents.filter((p: any) => !p?.isSuspended),
    [parents],
  );

  /* ------------------------------------------------------------------ */
  /* Time Comparison Metrics & Graph Data                               */
  /* ------------------------------------------------------------------ */
  const windowMetrics: WindowMetric[] = useMemo(() => {
    const now = Date.now();
    const baseList = getSampleData();

    return TIME_WINDOWS.map((win) => {
      const windowMs = win.hours * 60 * 60 * 1000;
      const currentStart = now - windowMs;
      const previousStart = now - windowMs * 2;

      let current = 0;
      let previous = 0;

      baseList.forEach((item: any) => {
        const ts = getRecordTimestamp(item);
        if (ts === null) return;
        if (ts >= currentStart && ts <= now) {
          current += 1;
        } else if (ts >= previousStart && ts < currentStart) {
          previous += 1;
        }
      });

      let deltaPct: number | null = null;
      if (previous > 0) {
        deltaPct = Math.round(((current - previous) / previous) * 100);
      } else if (current > 0) {
        deltaPct = 100;
      } else {
        deltaPct = 0;
      }

      return {
        ...win,
        current,
        previous,
        deltaPct,
      };
    });
  }, [adminsFilter, teachers, parents, students, userType]);

  /* ------------------------------------------------------------------ */
  /* CSV & JSON Export Handlers                                         */
  /* ------------------------------------------------------------------ */
  const handleExportSingleCsv = (user: any) => {
    const record = sanitizeUserForExport(user, userType);
    const flatRecord = {
      id: record.id,
      userType: record.userType,
      name: record.name,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      status: record.status,
      createdAt: record.createdAt,
    };
    const headers = Object.keys(flatRecord);
    const csv = [
      headers.map(escapeCsvCell).join(","),
      headers
        .map((k) => escapeCsvCell(flatRecord[k as keyof typeof flatRecord]))
        .join(","),
    ].join("\n");

    const safeName = record.name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    downloadFile(
      csv,
      `${userType}_${safeName || record.id}_data.csv`,
      "text/csv;charset=utf-8;",
    );
    addToast("success", `Exported ${record.name} as CSV`);
  };

  const handleExportSingleJson = (user: any) => {
    const record = sanitizeUserForExport(user, userType);
    const payload = {
      exportedAt: new Date().toISOString(),
      userType,
      user: user,
    };
    const safeName = record.name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    downloadFile(
      JSON.stringify(payload, null, 2),
      `${userType}_${safeName || record.id}_data.json`,
      "application/json",
    );
    addToast("success", `Exported ${record.name} as JSON`);
  };

  const handleExportListCsv = () => {
    if (filterData.length === 0) {
      addToast("error", "No records to export");
      return;
    }
    const rows = filterData.map((u: any) => {
      const r = sanitizeUserForExport(u, userType);
      return {
        id: r.id,
        userType: r.userType,
        name: r.name,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        status: r.status,
        createdAt: r.createdAt,
      };
    });
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) =>
        headers.map((h) => escapeCsvCell(row[h as keyof typeof row])).join(","),
      ),
    ].join("\n");

    downloadFile(
      csv,
      `${userType}s_${filter}_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    addToast("success", `Exported ${rows.length} ${userType} record(s) as CSV`);
  };

  const handleExportListJson = () => {
    if (filterData.length === 0) {
      addToast("error", "No records to export");
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      userType,
      filter,
      count: filterData.length,
      items: filterData,
    };
    downloadFile(
      JSON.stringify(payload, null, 2),
      `${userType}s_${filter}_${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
    addToast(
      "success",
      `Exported ${filterData.length} ${userType} record(s) as JSON`,
    );
  };

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
    navigate(`/app/user/${userType}/${id}`);
  };

  /* ------------------------------------------------------------------ */
  /* Reset Forms */
  /* ------------------------------------------------------------------ */
  const resetAdminForm = () => {
    setAddAdminEmail("");
    setAddAdminRole("");
    setAddAdminFirstName("");
    setAddAdminLastName("");
    setAddAdminPassword("");
    setShowPassword(false);
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
          }),
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
          ...(userType === "teacher" &&
            selectedGradeIds.length > 0 && {
              gradeIds: selectedGradeIds,
            }),
          ...(userType === "teacher" &&
            selectedSubjectIds.length > 0 && {
              subjectIds: selectedSubjectIds,
            }),
        };

        const res: any = await dispatch(createUser(body)).unwrap();

        if (res.success) {
          addToast(
            "success",
            `${
              userType.charAt(0).toUpperCase() + userType.slice(1)
            } created successfully!`,
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

  const allData = getSampleData();
  const totalCount = allData.length;
  const activeCount = allData.filter((u: any) => !u.isSuspended).length;
  const suspendedCount = totalCount - activeCount;
  const canAdd = ["teacher", "admin", "student", "parent"].includes(userType);

  const fullName = (user: any) => getUserDisplayName(user);

  const maxChartValue = useMemo(() => {
    const highest = Math.max(
      1,
      ...windowMetrics.flatMap((m) => [m.current, m.previous]),
    );
    return highest;
  }, [windowMetrics]);

  return (
    <div className="page">
      {isLoading && !isModalOpen ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">Loading…</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="page-title capitalize">{userType}s</h1>
              <p className="page-subtitle">
                Everyone registered as a {userType} on the platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportListCsv}
                className="btn-outline inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportListJson}
                className="btn-outline inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </button>
              {canAdd && (
                <button
                  onClick={() => navigate(`/app/people/${userType}/new`)}
                  className="btn-primary"
                >
                  <FaUserPlus /> Add {userType}
                </button>
              )}
            </div>
          </header>

          {/* Stat strip */}
          <section
            aria-label="Summary"
            className="card grid grid-cols-3 divide-x divide-[var(--color-card-border)]"
          >
            {[
              { label: "Total", value: totalCount },
              { label: "Active", value: activeCount },
              { label: "Suspended", value: suspendedCount },
            ].map((s) => (
              <div key={s.label} className="px-4 sm:px-6 py-4">
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
              </div>
            ))}
          </section>

          {/* Time-Window Comparison Cards (24h, 48h, 72h, 2 Weeks, 1 Month) */}
          <section aria-label="Time comparison cards" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {windowMetrics.map((m) => {
                const isPositive = (m.deltaPct ?? 0) > 0;
                const isNegative = (m.deltaPct ?? 0) < 0;
                return (
                  <div
                    key={m.key}
                    className="card p-4 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-muted)]">
                        {m.label}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isPositive
                            ? "badge-green"
                            : isNegative
                              ? "badge-red"
                              : "bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                        }`}
                      >
                        {isPositive ? `+${m.deltaPct}%` : `${m.deltaPct}%`}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-semibold text-[var(--color-primary)]">
                        {m.current}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        vs {m.previous} prev
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Period Comparison Graph */}
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-primary)] capitalize">
                    {userType} Growth Comparison Across Time Windows
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)] inline-block" />
                    Current Window
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    Previous Window
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 620 210"
                  className="w-full min-w-[460px] h-48"
                  role="img"
                  aria-label="Comparison graph for 24 hours, 48 hours, 72 hours, 2 weeks, and 1 month"
                >
                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 165 - ratio * 130;
                    const labelVal = Math.round(maxChartValue * ratio);
                    return (
                      <g key={idx}>
                        <line
                          x1={42}
                          y1={y}
                          x2={600}
                          y2={y}
                          stroke="currentColor"
                          strokeOpacity={0.12}
                          strokeDasharray="4 4"
                        />
                        <text
                          x={34}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="currentColor"
                          opacity={0.6}
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars per time window */}
                  {windowMetrics.map((m, idx) => {
                    const groupWidth = 104;
                    const xStart = 58 + idx * groupWidth;
                    const currHeight = (m.current / maxChartValue) * 130;
                    const prevHeight = (m.previous / maxChartValue) * 130;
                    const currY = 165 - currHeight;
                    const prevY = 165 - prevHeight;

                    return (
                      <g key={m.key}>
                        {/* Current bar */}
                        <rect
                          x={xStart}
                          y={currY}
                          width={26}
                          height={Math.max(2, currHeight)}
                          rx={5}
                          fill="var(--color-brand, #1b2030)"
                        />
                        {/* Previous bar */}
                        <rect
                          x={xStart + 32}
                          y={prevY}
                          width={26}
                          height={Math.max(2, prevHeight)}
                          rx={5}
                          fill="#facc15"
                        />
                        <text
                          x={xStart + 29}
                          y={186}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="currentColor"
                        >
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </section>

          {/* Filters */}
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter by status"
          >
            {filterOptions[userType]?.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => navigate(`/app/users/${userType}/${f}`)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                    : "bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                }`}
              >
                {formatFilterText(f)}
              </button>
            ))}
          </div>

          {/* Table (desktop) */}
          <div className="card overflow-hidden">
            {filterData.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 text-[var(--color-muted)]">
                <User size={40} className="opacity-40" />
                <p className="text-sm font-medium">No {userType}s found</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto px-2 pb-2">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th className="text-right">Export & Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterData.map((user: any) => (
                        <tr
                          key={user._id}
                          className="cursor-pointer"
                          onClick={() => handleViewDetails(user._id)}
                        >
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-[var(--color-surface-alt)] grid place-items-center text-sm font-semibold text-[var(--color-primary)]">
                                {getUserDisplayName(user)[0] || "?"}
                              </span>
                              <span className="font-medium">
                                {fullName(user)}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap text-[var(--color-muted)]">
                            {user.email || "—"}
                          </td>
                          <td>
                            <span
                              className={
                                user.isSuspended ? "badge-red" : "badge-green"
                              }
                            >
                              {user.isSuspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Export user as CSV"
                                aria-label={`Export ${fullName(user)} as CSV`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportSingleCsv(user);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] inline-flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                CSV
                              </button>
                              <button
                                type="button"
                                title="Export user as JSON"
                                aria-label={`Export ${fullName(user)} as JSON`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportSingleJson(user);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] inline-flex items-center gap-1 transition-colors"
                              >
                                <FileJson className="w-3.5 h-3.5" />
                                JSON
                              </button>
                              {canAdd && (
                                <button
                                  aria-label={`Remove ${fullName(user)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAdminClick(user);
                                  }}
                                  className="w-9 h-9 grid place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                                >
                                  <FaTrashAlt className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span className="w-8 h-9 grid place-items-center text-[var(--color-subtle)]">
                                <FaChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards (mobile) */}
                <ul className="md:hidden divide-y divide-[var(--color-card-border)]">
                  {filterData.map((user: any) => (
                    <li
                      key={user._id}
                      className="p-4 space-y-3 cursor-pointer"
                      onClick={() => handleViewDetails(user._id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-[var(--color-surface-alt)] grid place-items-center font-semibold shrink-0">
                          {getUserDisplayName(user)[0] || "?"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {fullName(user)}
                          </p>
                          <p className="text-xs text-[var(--color-muted)] truncate">
                            {user.email || "—"}
                          </p>
                        </div>
                        <span
                          className={
                            user.isSuspended ? "badge-red" : "badge-green"
                          }
                        >
                          {user.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSingleCsv(user);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-primary)] inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSingleJson(user);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-primary)] inline-flex items-center gap-1"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          JSON
                        </button>
                        {canAdd && (
                          <button
                            aria-label={`Remove ${fullName(user)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAdminClick(user);
                            }}
                            className="w-9 h-9 grid place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                          >
                            <FaTrashAlt className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
                  ADD USER MODAL
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
                  className="bg-[var(--color-card)] rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-2xl mx-auto my-8 overflow-hidden border border-[var(--color-card-border)]"
                >
                  {/* Header */}
                  <div className="relative bg-[var(--color-card)] border-b border-[var(--color-card-border)] px-8 py-7">
                    <button
                      onClick={closeModal}
                      className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-[var(--color-primary)]" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-[var(--color-primary)] shadow-[var(--shadow-elevated)]">
                        <FaUserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight">
                          Add New{" "}
                          {userType.charAt(0).toUpperCase() + userType.slice(1)}
                        </h2>
                        <p className="text-[var(--color-muted)] text-sm mt-0.5">
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
                          <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={addAdminEmail}
                            onChange={(e) => setAddAdminEmail(e.target.value)}
                            placeholder="admin@school.edu"
                            className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrors.email && (
                            <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                              {formErrors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-3">
                            Role
                          </label>
                          <div className="flex gap-4">
                            {["superadmin", "admin"].map((role) => (
                              <label
                                key={role}
                                className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                  addAdminRole === role
                                    ? "border-yellow-400 bg-[var(--color-warning-bg)]"
                                    : "border-[var(--color-card-border)] bg-[var(--color-card)] hover:border-[var(--color-card-border)]"
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
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    addAdminRole === role
                                      ? "border-[var(--color-primary)] bg-[var(--color-brand)]"
                                      : "border-[var(--color-card-border)]"
                                  }`}
                                >
                                  {addAdminRole === role && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                                  )}
                                </div>
                                <span
                                  className={`font-semibold text-sm ${
                                    addAdminRole === role
                                      ? "text-[var(--color-primary)]"
                                      : "text-[var(--color-primary)]"
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
                            <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                              {formErrors.role}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={addAdminFirstName}
                              onChange={(e) =>
                                setAddAdminFirstName(e.target.value)
                              }
                              placeholder="John"
                              className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrors.firstName && (
                              <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                                {formErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={addAdminLastName}
                              onChange={(e) =>
                                setAddAdminLastName(e.target.value)
                              }
                              placeholder="Doe"
                              className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrors.lastName && (
                              <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                                {formErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
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
                              className="w-full px-5 py-3.5 pr-16 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            <button
                              type="button"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              aria-pressed={showPassword}
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] font-semibold text-xs tracking-tight hover:text-[var(--color-primary)]"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                          {formErrors.password && (
                            <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
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
                            <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={userFirstName}
                              onChange={(e) => setUserFirstName(e.target.value)}
                              placeholder="Emma"
                              className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrorsUsers.firstName && (
                              <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                                {formErrorsUsers.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={userLastName}
                              onChange={(e) => setUserLastName(e.target.value)}
                              placeholder="Wilson"
                              className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            />
                            {formErrorsUsers.lastName && (
                              <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                                {formErrorsUsers.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="emma.wilson@school.com"
                            className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrorsUsers.email && (
                            <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                              {formErrorsUsers.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={userPhoneNumber}
                            onChange={(e) => setUserPhoneNumber(e.target.value)}
                            placeholder="+234 801 234 5678"
                            className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                          />
                          {formErrorsUsers.phoneNumber && (
                            <p className="text-[var(--color-danger)] text-xs font-semibold mt-1.5">
                              {formErrorsUsers.phoneNumber}
                            </p>
                          )}
                        </div>

                        {userType === "student" && (
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-muted)] tracking-tight mb-2">
                              Select Parent
                            </label>
                            <Select
                              value={parentId}
                              onChange={(e) => setParentId(e.target.value)}
                              className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl text-[var(--color-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                            >
                              <option value="">Choose parent...</option>
                              {activeParents.map((p: any) => (
                                <option key={p._id} value={p._id}>
                                  {getUserDisplayName(p)} • {p.email}
                                </option>
                              ))}
                            </Select>
                          </div>
                        )}

                        {userType === "teacher" && (
                          <>
                            {/* Grades (Optional) */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-[var(--color-brand)] text-[var(--color-brand-fg)] flex items-center justify-center text-xs font-semibold">
                                    1
                                  </span>
                                  <h3 className="text-sm font-semibold text-[var(--color-primary)]">
                                    Assign Grades{" "}
                                    <span className="text-xs font-normal text-[var(--color-muted)]">
                                      (Optional)
                                    </span>
                                  </h3>
                                </div>
                                <span className="text-xs font-semibold text-[var(--color-muted)]">
                                  {selectedGradeIds.length} selected
                                </span>
                              </div>

                              {loadingGrades ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
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
                                                    (id) => id !== grade._id,
                                                  )
                                                : [...prev, grade._id],
                                            )
                                          }
                                          className="sr-only"
                                        />
                                        <div
                                          className={`p-3.5 rounded-2xl border text-center transition-all ${
                                            isSelected
                                              ? "bg-[var(--color-brand)] border-[var(--color-primary)] text-[var(--color-brand-fg)] shadow-[var(--shadow-card)] scale-[1.02]"
                                              : "bg-[var(--color-card)] border-[var(--color-card-border)] hover:border-[var(--color-card-border)] text-[var(--color-primary)]"
                                          }`}
                                        >
                                          <p className="font-semibold text-lg leading-none">
                                            {grade.title.match(/\d+/)?.[0] ||
                                              "?"}
                                          </p>
                                          <p
                                            className={`text-[10px] font-semibold mt-1 tracking-tight ${
                                              isSelected
                                                ? "text-white/70"
                                                : "text-[var(--color-muted)]"
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
                                <p className="text-[var(--color-danger)] text-xs font-semibold mt-2">
                                  {formErrorsUsers.grades}
                                </p>
                              )}
                            </div>

                            {/* Subjects */}
                            {selectedGradeIds.length > 0 && (
                              <div className="pt-2 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-yellow-400 text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                                      2
                                    </span>
                                    <h3 className="text-sm font-semibold text-[var(--color-primary)]">
                                      Assign Subjects{" "}
                                      <span className="text-xs font-normal text-[var(--color-muted)]">
                                        (Optional)
                                      </span>
                                    </h3>
                                  </div>
                                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                                    {selectedSubjectIds.length} selected
                                  </span>
                                </div>

                                {selectedGradeIds.map((gradeId) => {
                                  const grade = grades.find(
                                    (g) => g._id === gradeId,
                                  );
                                  const subjects =
                                    subjectsByGrade[gradeId] || [];
                                  if (subjects.length === 0) return null;

                                  return (
                                    <div
                                      key={gradeId}
                                      className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-card-border)]"
                                    >
                                      <h4 className="font-semibold text-[var(--color-primary)] text-sm mb-3">
                                        {grade?.title}
                                      </h4>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {subjects.map((subject) => {
                                          const isSelected =
                                            selectedSubjectIds.includes(
                                              subject._id,
                                            );
                                          return (
                                            <label
                                              key={subject._id}
                                              className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all ${
                                                isSelected
                                                  ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                                                  : "bg-[var(--color-card)] border border-[var(--color-card-border)] hover:border-[var(--color-card-border)]"
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
                                                              id !==
                                                              subject._id,
                                                          )
                                                        : [
                                                            ...prev,
                                                            subject._id,
                                                          ],
                                                  )
                                                }
                                                className="sr-only"
                                              />
                                              <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                  isSelected
                                                    ? "border-yellow-400 bg-yellow-400"
                                                    : "border-[var(--color-card-border)]"
                                                }`}
                                              >
                                                {isSelected && (
                                                  <div className="w-1.5 h-1.5 bg-[var(--color-brand)] rounded-full" />
                                                )}
                                              </div>
                                              <span
                                                className={`text-sm font-semibold truncate ${
                                                  isSelected
                                                    ? "text-yellow-400"
                                                    : "text-[var(--color-primary)]"
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
                    <div className="flex gap-3 pt-6 border-t border-[var(--color-card-border)]">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-4 bg-[var(--color-surface-alt)] text-[var(--color-primary)] rounded-full font-semibold text-sm tracking-tight hover:bg-[var(--color-surface-alt)] transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-4 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-full font-semibold text-sm tracking-tight hover:bg-[var(--color-brand-hover)] transition shadow-[var(--shadow-elevated)] disabled:opacity-60"
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
                  CONFIRM DELETE / SUSPEND MODAL
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
                  className="bg-[var(--color-card)] rounded-3xl shadow-[var(--shadow-elevated)] max-w-md w-full overflow-hidden border border-[var(--color-card-border)]"
                >
                  {/* Colored Header */}
                  <div
                    className={`px-8 py-10 text-center relative ${
                      confirmModal.type === "remove"
                        ? "bg-[var(--color-danger-bg)]"
                        : "bg-[var(--color-warning-bg)]"
                    }`}
                  >
                    <div className="w-24 h-24 mx-auto mb-5 bg-[var(--color-card)] rounded-full flex items-center justify-center backdrop-blur-sm">
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
                    <h3 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight">
                      {confirmModal.type === "remove" ? "Delete" : "Suspend"}{" "}
                      {userType}?
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-8">
                    <p className="text-center text-[var(--color-primary)] font-medium leading-relaxed">
                      You are about to{" "}
                      <span
                        className={`font-semibold ${
                          confirmModal.type === "remove"
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--color-warning)]"
                        }`}
                      >
                        {confirmModal.type === "remove"
                          ? "permanently delete"
                          : "suspend"}
                      </span>{" "}
                      this {userType}.
                    </p>
                    <p className="text-center text-sm text-[var(--color-muted)] mt-2">
                      All associated data will be affected.
                    </p>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 py-4 bg-[var(--color-surface-alt)] text-[var(--color-primary)] rounded-2xl font-semibold text-sm tracking-tight hover:bg-[var(--color-surface-alt)] transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAction}
                        className={`flex-1 py-4 text-[var(--color-brand-fg)] rounded-full font-semibold text-sm tracking-tight shadow-[var(--shadow-elevated)] transition hover:scale-[1.02] ${
                          confirmModal.type === "remove"
                            ? "bg-[var(--color-brand)] hover:from-red-700 hover:to-rose-800"
                            : "bg-[var(--color-brand)] hover:from-amber-600 hover:to-orange-700"
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
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
