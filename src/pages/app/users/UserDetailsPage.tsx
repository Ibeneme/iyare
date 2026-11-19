import { getCookie } from "../../../utils/cookies";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { fetchUserById } from "../../../store/features/users/users.slice";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
import Loader from "../../../components/common/Loader";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  BookOpen,
  Users,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";

const GRADES_API = `${BASE_URL}/api/grades/grades`;

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface UserData {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  superadmin?: boolean;
  isSuspended: boolean;
  userType: "admin" | "student" | "parent" | "teacher";
  parentDetails?: any;
  children?: any[];
  gradeIds?: string[];
  gradeId?: string;
  subjects?: Subject[];
  createdAt?: string;
  updatedAt?: string;
  phoneNumber?: string;
  isSubscribed?: boolean;
  isPaid?: boolean;
}

const splitNameParts = (user: UserData) => {
  if (user.firstName || user.lastName) {
    return {
      firstName: user.firstName || "—",
      lastName: user.lastName || "—",
    };
  }
  const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "—", lastName: "—" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "—" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const getInitials = (user: UserData) => {
  if (user.firstName || user.lastName) {
    return (
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      "?"
    );
  }
  const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const UserDetailsPage: React.FC = () => {
  const { userType, id } = useParams<{ userType: string; id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const token = getCookie("token");

  useEffect(() => {
    const loadUser = async () => {
      if (!id || !userType) {
        setError("Invalid URL parameters.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setSubjects([]);
        const action = await dispatch(fetchUserById({ id, userType }));
        if (action.payload) {
          setUser(action.payload);
        } else {
          setError("User details could not be found.");
        }
      } catch (err) {
        setError("A server error occurred while fetching user data.");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id, userType, dispatch]);

  useEffect(() => {
    if (!user || !token || subjects.length > 0) return;

    const gradeIds: string[] = [];
    if (user.userType === "teacher" && user.gradeIds?.length)
      gradeIds.push(...user.gradeIds);
    if (user.userType === "student" && user.gradeId)
      gradeIds.push(user.gradeId);

    if (gradeIds.length === 0) return;

    const fetchedIds = new Set<string>();
    gradeIds.forEach(async (gradeId) => {
      if (!gradeId) return;
      try {
        const res = await axios.get(`${GRADES_API}/subjects/${gradeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newSubs: Subject[] = res.data.data || [];
        const unique = newSubs.filter((s) => {
          if (fetchedIds.has(s._id)) return false;
          fetchedIds.add(s._id);
          return true;
        });
        setSubjects((prev) => [...prev, ...unique]);
      } catch (err) {
        console.error("Failed to fetch subjects");
      }
    });
  }, [user, token, subjects.length]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <Loader />
      </div>
    );

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[var(--color-surface)]">
        <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-card-border)] shadow-[var(--shadow-elevated)] max-w-md">
          <h2 className="text-2xl font-semibold text-[var(--color-danger)] mb-2">
            Error
          </h2>
          <p className="text-[var(--color-primary)] mb-6 font-medium">
            {error || "The requested user could not be loaded."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-xl hover:bg-[var(--color-brand-hover)] transition-all font-semibold"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const { firstName, lastName } = splitNameParts(user);
  const fullName =
    user.name?.trim() ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "User Profile";
  const initials = getInitials(user);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-primary)] flex flex-col lg:flex-row">
      {/* Center - Main Detail */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-[var(--color-card-border)] bg-[var(--color-card)] flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="More options"
              className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-2xl">
            {/* Avatar + Name header */}
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-900 shrink-0 shadow-[var(--shadow-card)]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
                  {fullName}
                </h1>
                <p className="text-[var(--color-muted)] text-sm mt-1 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="px-3 py-1 bg-yellow-400/20 text-[var(--color-primary)] border border-yellow-400/40 text-xs font-medium rounded-full">
                    {user.userType}
                  </span>
                  {user.userType === "student" && (
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.isSubscribed
                          ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                          : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                      }`}
                    >
                      {user.isSubscribed ? "Active" : "Unpaid"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Identity */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-card-border)] p-6 mb-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">
                Core Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoItem label="First Name" value={firstName} />
                <InfoItem label="Last Name" value={lastName} />
                <InfoItem
                  label="Email"
                  value={user.email}
                  icon={
                    <Mail size={14} className="text-[var(--color-muted)]" />
                  }
                />
                <InfoItem
                  label="Phone"
                  value={user.phoneNumber || "Not listed"}
                  icon={
                    <Phone size={14} className="text-[var(--color-muted)]" />
                  }
                />
              </div>

              {user.role && (
                <div className="mt-6 flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-[var(--color-brand-fg)] shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--color-muted)]">Role</p>
                    <p className="font-semibold text-[var(--color-primary)]">
                      {user.superadmin ? "Super Admin" : user.role}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Subjects */}
            {(user.userType === "teacher" || user.userType === "student") &&
              subjects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-yellow-500" />
                    {user.userType === "teacher"
                      ? "Teaching Subjects"
                      : "Learning Path"}
                  </h3>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject._id}
                        onClick={() => navigate(`/app/subjects/${subject._id}`)}
                        className="w-full text-left p-4 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:border-yellow-400 transition flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs text-[var(--color-muted)]">
                            {subject.code}
                          </p>
                          <p className="font-medium text-[var(--color-primary)]">
                            {subject.name}
                          </p>
                        </div>
                        <span className="text-[var(--color-muted)]">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Children */}
            {user.userType === "parent" &&
              user.children &&
              user.children.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                    <Users size={16} className="text-yellow-500" />
                    Children
                  </h3>
                  <div className="space-y-2">
                    {user.children.map((child: any) => (
                      <div
                        key={child._id}
                        onClick={() =>
                          navigate(`/app/user/student/${child?._id}/`)
                        }
                        className="p-4 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:border-yellow-400 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-[var(--color-primary)]">
                              {child.name?.trim() ||
                                `${child.firstName || ""} ${child.lastName || ""}`.trim() ||
                                "—"}
                            </p>
                            <p className="text-sm text-[var(--color-muted)]">
                              {child.email}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              child.isPaid
                                ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                                : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                            }`}
                          >
                            {child.isPaid ? "PAID" : "UNPAID"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-[var(--color-card-border)] bg-[var(--color-card)] p-5 space-y-5 shrink-0 overflow-y-auto">
        {/* Status / Registry */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--color-muted)]" />
            Registry
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--color-muted)]">Joined</p>
              <p className="font-medium text-sm text-[var(--color-primary)] mt-0.5">
                {user.createdAt
                  ? format(new Date(user.createdAt), "MMMM d, yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Last Activity</p>
              <p className="font-medium text-sm text-[var(--color-primary)] mt-0.5">
                {user.updatedAt
                  ? format(new Date(user.updatedAt), "MMM d, yyyy • h:mm a")
                  : "—"}
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--color-card-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">Status</span>
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  user.isSuspended
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-success)]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.isSuspended ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                {user.isSuspended ? "SUSPENDED" : "ACTIVE"}
              </span>
            </div>
          </div>
        </div>

  

        {/* Account status */}
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-primary)] flex items-center gap-2">
              <CheckSquare size={16} className="text-[var(--color-muted)]" />
              Account
            </h3>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl">
            <span className="text-sm text-[var(--color-primary)]">
              Account Status
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                user.isSuspended
                  ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                  : "bg-[var(--color-success-bg)] text-[var(--color-success)]"
              }`}
            >
              {user.isSuspended ? "Suspended" : "Active"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) => (
  <div>
    <p className="text-xs text-[var(--color-muted)] mb-1">{label}</p>
    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
      {icon}
      <span className="truncate">{value || "—"}</span>
    </div>
  </div>
);

export default UserDetailsPage;
