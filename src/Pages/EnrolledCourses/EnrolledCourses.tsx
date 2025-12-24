import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../Redux/baseurl";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  AlertCircle,
  Shield,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Types ---
interface Course {
  _id: string;
  title: string;
}
interface TeacherOrStudent {
  _id: string;
  name: string;
  email: string;
  courses: Course[];
  classes: any[];
}
interface DashboardData {
  teacher?: TeacherOrStudent;
  student?: TeacherOrStudent;
  parent?: { children: TeacherOrStudent[] };
}

const getAuthToken = () => localStorage.getItem("token");

// --- UI Components ---
const SkeletonCard = () => (
  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 animate-pulse">
    <div className="h-4 bg-slate-100 rounded w-1/4 mb-4" />
    <div className="h-8 bg-slate-100 rounded w-3/4 mb-6" />
    <div className="space-y-3">
      <div className="h-4 bg-slate-50 rounded w-full" />
      <div className="h-4 bg-slate-50 rounded w-5/6" />
    </div>
  </div>
);

const EnrolledCourses: React.FC = () => {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(
          `${BASE_URL}/api/admin-classes/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(response.data);
      } catch (err: any) {
        setError(err.message || "Synchronization Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const renderClasses = (classes: any[]) => {
    if (!classes?.length)
      return (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
          <BookOpen className="w-8 h-8 text-slate-200 mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            No active schedules
          </p>
        </div>
      );

    return (
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <motion.div
            key={cls._id}
            whileHover={{ y: -5 }}
            className="group bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:border-[#064e3b]/20 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-[#064e3b]">
                <GraduationCap size={20} />
              </div>
              <span
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                  cls.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : cls.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-yellow-50 text-yellow-700 border-yellow-100"
                }`}
              >
                {cls.status}
              </span>
            </div>

            <h4 className="text-lg font-black text-[#064e3b] tracking-tight mb-4 italic truncate">
              {cls.title}
            </h4>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500">
                <Calendar size={14} className="text-yellow-600" />
                <span className="text-[11px] font-bold uppercase tracking-tight">
                  {new Date(cls.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Clock size={14} className="text-yellow-600" />
                <span className="text-[11px] font-bold uppercase tracking-tight">
                  {cls.time || "TBD"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderUserSection = (user: TeacherOrStudent, role: string) => (
    <section className="space-y-8 animate-in fade-in duration-700">
      {/* User Identity Banner */}
      <div className="relative overflow-hidden bg-[#064e3b] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-emerald-900/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-[#064e3b] text-3xl font-black shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200/60 block mb-1">
                Authorized {role}
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic">
                {user.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.courses?.map((c) => (
              <span
                key={c._id}
                className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5"
              >
                {c.title}
              </span>
            ))}
          </div>
        </div>
        <Shield className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      {/* Schedule Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
            Scheduled Curriculum
          </h3>
          <div className="h-px flex-1 mx-6 bg-slate-100" />
        </div>
        {renderClasses(user.classes || [])}
      </div>
    </section>
  );

  if (loading)
    return (
      <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-12">
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
          <div className="h-12 bg-slate-100 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-2xl font-black text-[#064e3b] tracking-tighter italic">
            System Disconnected
          </h3>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
          >
            Re-initialize
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fcfdfc] py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Page Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Shield size={12} className="text-yellow-600" /> Secure Environment
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#064e3b] tracking-tighter leading-none">
            Learning <br className="md:hidden" /> Dashboard
          </h1>
          <p className="text-slate-500 font-bold max-w-xl text-sm md:text-base leading-relaxed">
            Real-time synchronization of your active curriculum, scheduled
            sessions, and academic progress.
          </p>
        </header>

        <div className="space-y-24">
          {data.teacher && renderUserSection(data.teacher, "Instructor")}
          {data.student && renderUserSection(data.student, "Scholar")}
          {data.parent?.children.map((child) => (
            <div key={child._id} className="space-y-12">
              <div className="flex items-center gap-4 text-[#064e3b]">
                <User size={24} />
                <h2 className="text-2xl font-black tracking-tighter italic">
                  Dependent: {child.name}
                </h2>
              </div>
              {renderUserSection(child, "Student")}
            </div>
          ))}

          {!data.teacher && !data.student && !data.parent && (
            <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
              <BookOpen className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <h3 className="text-xl font-black text-[#064e3b] tracking-tight italic">
                Zero Environment Data
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
                Awaiting enrollment confirmation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrolledCourses;
