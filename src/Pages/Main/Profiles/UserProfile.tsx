import { useEffect, useState } from "react";
import {
  Loader2,
  User,
  Mail,
  Shield,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  User2Icon,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchUser } from "../../../Redux/Slices/accounts.slice";
import { useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";

// ... Interfaces stay the same ...
interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
}
interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "student" | "parent";
  parentId?: string;
  class?: string;
  gradeId?: string;
  subjects: Subject[];
  isPaid: boolean;
  isSubscribed: boolean;
  isSuspended: boolean;
  createdAt?: string;
  updatedAt?: string;
}
interface StudentDetail {
  _id: string;
  firstName: string;
  lastName: string;
  class: string;
  subjects: string[];
}

export default function UserProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelStudentId, setCancelStudentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const goToAddStudent = () => navigate("/add-student");
  const closeCancelModal = () => setCancelStudentId(null);
  const type = getUserType();

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getBadge = (value: boolean, yes: string, no: string) => ({
    icon: value ? CheckCircle : XCircle,
    className: value
      ? "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100"
      : "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-50 text-slate-500 border border-slate-200",
    text: value ? yes : no,
  });

  const confirmCancelSubscription = () => {
    if (!cancelStudentId) return;
    setStudents((prev) =>
      prev.map((s) =>
        s._id === cancelStudentId ? { ...s, isSubscribed: false } : s
      )
    );
    toast.success("Subscription cancelled");
    closeCancelModal();
  };

  const subscribeAgain = (student: StudentData) => {
    const studentDetail: StudentDetail = {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class || student.gradeId || "Not Set",
      subjects: student.subjects.map((s) => s._id),
    };
    navigate("/pricing-page", {
      state: {
        parentId: student.parentId || student._id,
        studentDetails: [studentDetail],
      },
    });
    toast.success("Redirecting to pricing...");
  };

  const requestDeleteAccount = (student: StudentData) => {
    const subject = encodeURIComponent("Request to Delete Student Account");
    const body = encodeURIComponent(
      `Hello Support,\n\nPlease delete this student account:\n\nName: ${student.firstName} ${student.lastName}\nEmail: ${student.email}\nID: ${student._id}\n\nThank you.`.trim()
    );
    window.location.href = `mailto:onyekachiiyare@gmail.com?subject=${subject}&body=${body}`;
    toast.success("Opening email...");
  };

  const goToSubject = (subjectId: string) => navigate(`/subjects/${subjectId}`);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchUser())
      .unwrap()
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) setStudents(res.data);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  if (!loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl shadow-emerald-900/5 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-50 text-[#064e3b] rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <User2Icon size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#064e3b] tracking-tighter mb-4 italic">
            No Node Found
          </h2>
          <p className="text-slate-500 font-bold mb-10 text-sm">
            Synchronize your first student profile to begin administrative
            access.
          </p>
          <button
            onClick={goToAddStudent}
            className="w-full py-5 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <Plus size={18} /> Add Student Profile
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] pb-20">
      <AnimatePresence>
        {loading && (
          <motion.div
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-[60]"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-[#064e3b] opacity-20" />
              <Shield className="absolute inset-0 m-auto w-6 h-6 text-[#064e3b] animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-[0.5em]">
              Synchronizing Profiles
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && students.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Page Header */}
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <Shield size={12} className="text-yellow-600" /> Administrative
                Access
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-[#064e3b] tracking-tighter leading-none">
                Profiles
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-tight">
                Managing {students.length} active node
                {students.length > 1 ? "s" : ""} in the Iyare Hub environment.
              </p>
            </div>

            {type === "admin" && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/user-updates`)}
                  className="px-6 py-4 bg-white border border-slate-100 text-[#064e3b] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Edit3 size={14} /> Edit Data
                </button>
                <button
                  onClick={goToAddStudent}
                  className="px-6 py-4 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/10 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Plus size={16} /> Add Profile
                </button>
              </div>
            )}
          </header>

          {error && (
            <div className="mb-10 p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-black text-red-900 tracking-tight italic">
                  {error}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-red-600 hover:rotate-180 transition-transform duration-500"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}

          {/* Student Cards */}
          <div className="space-y-12">
            {students.map((student) => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 group"
              >
                {/* Visual Identity Strip */}
                <div className="h-2 bg-emerald-600 w-full group-hover:bg-yellow-400 transition-colors duration-500" />

                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: User Avatar & Meta */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-[#064e3b] rounded-[1.8rem] flex items-center justify-center text-yellow-400 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                          <User size={36} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-[#064e3b] tracking-tighter italic">
                            {student.firstName} <br /> {student.lastName}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                            Joined {formatDate(student.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <div className="flex items-center justify-between py-3 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Auth Status
                          </span>
                          <span className="text-[10px] font-black uppercase text-[#064e3b] tracking-widest bg-emerald-50 px-2 py-1 rounded">
                            Student
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Subscription
                          </span>
                          {(() => {
                            const b = getBadge(
                              student.isSubscribed,
                              "Active",
                              "Offline"
                            );
                            const Icon = b.icon;
                            return (
                              <span className={b.className}>
                                <Icon size={12} />
                                {b.text}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Account Fee
                          </span>
                          {(() => {
                            const b = getBadge(
                              student.isPaid,
                              "Settled",
                              "Outstanding"
                            );
                            const Icon = b.icon;
                            return (
                              <span className={b.className}>
                                <Icon size={12} />
                                {b.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Right: Detailed Info & Subjects */}
                    <div className="lg:col-span-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Email Node
                          </label>
                          <p className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
                            <Mail size={14} className="text-yellow-600" />{" "}
                            {student.email}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Identification
                          </label>
                          <p className="text-sm font-bold text-[#064e3b] flex items-center gap-2 uppercase tracking-tighter">
                            ID: {student._id.slice(-8)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Enrolled Curriculum ({student.subjects.length})
                          </h4>
                          <div className="h-px flex-1 ml-6 bg-slate-50" />
                        </div>

                        {student.subjects.length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-slate-50 rounded-[2rem] text-center">
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                              No Curriculum Synchronized
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {student.subjects.map((subject) => (
                              <button
                                key={subject._id}
                                onClick={() => goToSubject(subject._id)}
                                className="group/btn flex items-center justify-between p-5 bg-[#fcfdfc] rounded-[1.5rem] border border-slate-100 hover:border-[#064e3b] hover:bg-white transition-all text-left"
                              >
                                <div>
                                  <p className="text-sm font-black text-[#064e3b] italic tracking-tight">
                                    {subject.name}
                                  </p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    {subject.code}
                                  </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-200 group-hover/btn:text-yellow-600 group-hover/btn:translate-x-1 transition-all" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-slate-50">
                        {!student.isSubscribed && (
                          <button
                            onClick={() => subscribeAgain(student)}
                            className="px-8 py-4 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/10 flex items-center gap-3 hover:brightness-110 transition-all"
                          >
                            <CheckCircle size={16} /> Re-Authorize Subscription
                          </button>
                        )}
                        {type === "parent" && (
                          <button
                            onClick={() => requestDeleteAccount(student)}
                            className="px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-3"
                          >
                            <Trash2 size={16} /> Decommission Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal (Same styling as logout/report) */}
      <AnimatePresence>
        {cancelStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#064e3b]/40 backdrop-blur-sm flex items-center justify-center p-6 z-[100]"
            onClick={closeCancelModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto">
                <XCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#064e3b] tracking-tighter italic">
                  Terminate Sub?
                </h3>
                <p className="text-slate-500 font-bold text-sm">
                  Administrative access will be revoked immediately for this
                  node.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={confirmCancelSubscription}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest"
                >
                  Confirm Termination
                </button>
                <button
                  onClick={closeCancelModal}
                  className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest"
                >
                  Maintain Access
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
