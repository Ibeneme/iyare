import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../Redux/store";
import { fetchUserById } from "../../../../Redux/Admin/adminUsers";
import axios from "axios";
import { BASE_URL } from "../../../../Redux/baseurl";
import Loader from "../../../../Components/Loader/Loader";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  BookOpen,
  Users,
  Edit3,
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

const UserDetailsPage: React.FC = () => {
  const { userType, id } = useParams<{ userType: string; id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadUser = async () => {
      if (!id || !userType) {
        setError("Invalid URL parameters.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
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
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader />
      </div>
    );

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-emerald-50">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-emerald-900/60 mb-6 font-medium">
            {error || "The requested user could not be loaded."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-900 text-yellow-400 rounded-xl hover:bg-emerald-800 transition-all font-bold"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User Profile";

  return (
    <div className="min-h-screen bg-[#f8faf7] p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-800 hover:text-emerald-600 transition-colors mb-6 font-bold group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Return to List
        </button>

        <div className="bg-emerald-900 rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-emerald-200 relative overflow-hidden">
          {/* Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -mr-20 -mt-20 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 bg-yellow-400 rounded-3xl flex items-center justify-center text-emerald-950 text-4xl font-black shadow-lg shadow-yellow-400/20 rotate-3">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="px-4 py-1.5 bg-yellow-400 text-emerald-950 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                    {user.userType}
                  </span>
                  {user.userType === "student" && (
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-2 ${
                        user.isSubscribed
                          ? "bg-emerald-800/50 text-yellow-400 border-yellow-400/30"
                          : "bg-red-500/20 text-red-200 border-red-500/30"
                      }`}
                    >
                      {user.isSubscribed ? "● Active" : "○ Unpaid"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold transition-all border border-white/10"
            >
              <Edit3 size={18} className="text-yellow-400" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Card */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-emerald-100 relative group">
            <div className="absolute top-0 left-10 w-12 h-1 bg-yellow-400 rounded-b-full" />
            <h2 className="text-xl font-black text-emerald-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                <UserIcon size={22} />
              </div>
              Core Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <InfoItem label="First Name" value={user.firstName} />
              <InfoItem label="Last Name" value={user.lastName} />
              <InfoItem
                label="Email Contact"
                value={user.email}
                icon={<Mail size={16} className="text-yellow-600" />}
              />
              <InfoItem
                label="Phone Line"
                value={user.phoneNumber || "Not listed"}
                icon={<Phone size={16} className="text-yellow-600" />}
              />

              {user.role && (
                <div className="md:col-span-2 flex items-center gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="h-12 w-12 rounded-xl bg-emerald-900 flex items-center justify-center text-yellow-400 shadow-inner">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em]">
                      Security Clearance
                    </p>
                    <p className="text-emerald-900 font-black text-lg">
                      {user.superadmin ? "Super Admin" : user.role}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Dynamic Content: Subjects */}
          {(user.userType === "teacher" || user.userType === "student") &&
            subjects.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-xl font-black text-emerald-900 flex items-center gap-3 px-2">
                  <BookOpen className="text-yellow-500" size={24} />
                  {user.userType === "teacher"
                    ? "Teaching Faculty"
                    : "Learning Path"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <button
                      key={subject._id}
                      onClick={() => navigate(`/subjects/${subject._id}`)}
                      className="p-6 bg-white border-2 border-transparent rounded-3xl text-left hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-100 transition-all group flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                          {subject.code}
                        </span>
                        <span className="text-lg font-bold text-emerald-900 group-hover:text-emerald-700">
                          {subject.name}
                        </span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-900 group-hover:bg-yellow-400 transition-colors">
                        →
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

          {/* Children List */}
          {user.userType === "parent" &&
            user.children &&
            user.children.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-xl font-black text-emerald-900 px-2 flex items-center gap-3">
                  <Users className="text-yellow-500" size={24} />
                  Family Registry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.children.map((child: any) => (
                    <div
                      key={child._id}
                      onClick={() =>
                        navigate(`/user-details/student/${child?._id}/`)
                      }
                      className="p-6 bg-white rounded-3xl border border-emerald-100 hover:border-yellow-400 cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 bg-emerald-900 text-yellow-400 rounded-2xl flex items-center justify-center font-bold">
                          {child.firstName?.[0]}
                          {child.lastName?.[0]}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black border ${
                            child.isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          {child.isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                      <p className="font-black text-emerald-900 text-lg group-hover:text-emerald-700">
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-sm text-emerald-800/50 font-medium">
                        {child.email}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <aside className="bg-emerald-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden shadow-emerald-900/20">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mb-10 -mr-10" />

            <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-yellow-400">
              <Calendar size={20} />
              Registry Log
            </h3>

            <div className="space-y-8 relative z-10">
              <LogItem label="Unique ID" value={user._id} mono />
              <LogItem
                label="Joined Academy"
                value={
                  user.createdAt
                    ? format(new Date(user.createdAt), "MMMM d, yyyy")
                    : "—"
                }
              />
              <LogItem
                label="Last Activity"
                value={
                  user.updatedAt
                    ? format(new Date(user.updatedAt), "MMM d, yyyy • h:mm a")
                    : "—"
                }
              />

              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full animate-pulse ${
                        user.isSuspended ? "bg-red-500" : "bg-yellow-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-black ${
                        user.isSuspended ? "text-red-400" : "text-yellow-400"
                      }`}
                    >
                      {user.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="bg-yellow-400 rounded-[2rem] p-8 text-emerald-950 shadow-xl shadow-yellow-400/10">
            <h4 className="font-black text-xl mb-3 uppercase tracking-tight">
              Administrative Help
            </h4>
            <p className="text-emerald-900/70 text-sm font-bold leading-relaxed">
              Updating a user's role or status will trigger an automated email
              notification to their registered address.
            </p>
          </div>
        </div>
      </div>
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
  <div className="flex flex-col gap-1.5">
    <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-[0.2em]">
      {label}
    </p>
    <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-lg">
      {icon && (
        <span className="p-1.5 bg-yellow-400/20 rounded-lg">{icon}</span>
      )}
      {value || "—"}
    </div>
  </div>
);

const LogItem = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div>
    <p className="text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.25em] mb-2">
      {label}
    </p>
    <p
      className={`text-emerald-50 font-bold ${
        mono
          ? "font-mono text-xs break-all bg-black/20 p-3 rounded-xl border border-white/5"
          : "text-base"
      }`}
    >
      {value}
    </p>
  </div>
);

export default UserDetailsPage;
