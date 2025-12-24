import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  CreditCard,
  Copy,
  AlertCircle,
  Circle,
  UserX,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../Redux/store";
import { fetchLessonFeesByUser } from "../../../Redux/Slices/lessonFee.slice";
import { useNavigate } from "react-router-dom";

interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  class?: string;
}

interface PaidInfo {
  isPaid: boolean;
  timestamp: string;
  paymentMethod: string;
  paymentService: string;
  details?: Record<string, any>;
}

export default function LessonFeesMain() {
  const dispatch = useDispatch<AppDispatch>();
  const { lessonFees, loading, error } = useSelector(
    (state: RootState) => state.lessonFee
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchLessonFeesByUser());
  }, [dispatch]);
  console.log(copiedRef);
  const getStudentDisplay = (
    student: StudentInfo | string | null | undefined
  ) => {
    if (!student || student === null) {
      return { name: "Record Deleted", deleted: true };
    }
    if (typeof student === "string") {
      return { name: "Unknown Student", deleted: false };
    }
    const fullName = `${student.firstName} ${student.lastName}`.trim();
    return { name: fullName || "Unknown Student", deleted: false };
  };

  const formatNGN = (amt: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amt);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const daysLeft = (exp?: string): number | null => {
    if (!exp) return null;
    const days = Math.ceil(
      (new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days >= 0 ? days : 0;
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    toast.success("Reference copied!");
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const renew = (fee: any) => {
    const userType = localStorage.getItem("userType");
    if (userType === "admin") {
      if (!fee?.studentId) {
        toast.error("Student no longer exists");
      } else {
        navigate(`/user-details/student/${fee?.studentId?._id}`);
      }
    } else {
      navigate("/profiles");
    }
  };

  const getStatusBadge = (paid: PaidInfo) => ({
    text: paid.isPaid ? "Paid" : "Pending",
    color: paid.isPaid
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-700 border-amber-200",
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [...lessonFees].reverse();
    const q = searchQuery.toLowerCase();
    return lessonFees
      .filter((fee: any) => {
        const { name } = getStudentDisplay(fee.studentId);
        return (
          name.toLowerCase().includes(q) ||
          (fee.planName?.toLowerCase() || "").includes(q) ||
          (fee.reference?.toLowerCase() || "").includes(q) ||
          fee.amount.toString().includes(q)
        );
      })
      .reverse();
  }, [lessonFees, searchQuery]);

  const userType = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.userType;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]"
          >
            <Loader2 className="w-12 h-12 animate-spin text-[#064e3b] mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#064e3b]">
              Auditing Financials...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {/* Header Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100  mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-10">
            <div>
              <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center  shadow-yellow-400/20 mb-4">
                <TrendingUp className="w-6 h-6 text-[#064e3b]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
                Finance & Billing
              </h1>
              <p className="text-slate-500 font-bold mt-2">
                Manage lesson access and review transaction history.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Total Records
                </p>
                <p className="text-2xl font-black text-[#064e3b]">
                  {filtered.length}
                </p>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="mb-10 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full max-w-xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
              <input
                type="text"
                placeholder="Search by student, reference, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none text-lg font-bold transition-all bg-white"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-6 py-4 rounded-[2rem] border border-red-100">
                <AlertCircle size={18} /> Error Loading Data
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <CreditCard className="w-20 h-20 text-slate-200 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-[#064e3b] tracking-tight">
                No Transactions Found
              </h2>
              <p className="text-slate-400 font-bold mt-2">
                No lesson fee records match your current criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100  overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Student Entity
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Subscription Plan
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                          Amount (NGN)
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                          Status
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Expires
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((fee: any) => {
                        const { name: studentName, deleted } =
                          getStudentDisplay(fee.studentId);
                        const badge = getStatusBadge(fee.paid);
                        const days = daysLeft(fee.expiresAt);
                        const expiringSoon =
                          days !== null && days <= 7 && days > 0;

                        return (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={fee._id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2.5 rounded-xl ${
                                    deleted
                                      ? "bg-red-50 text-red-500"
                                      : "bg-emerald-50 text-[#064e3b]"
                                  }`}
                                >
                                  {deleted ? (
                                    <UserX size={18} />
                                  ) : (
                                    <Circle
                                      size={10}
                                      className="fill-current"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={`font-black tracking-tight ${
                                      deleted
                                        ? "text-red-600"
                                        : "text-slate-900"
                                    }`}
                                  >
                                    {studentName}
                                  </p>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                    REF: {fee.reference?.substring(0, 8)}...
                                    <button
                                      onClick={() => copyRef(fee.reference)}
                                      className="hover:text-[#064e3b] ml-1"
                                    >
                                      <Copy size={10} />
                                    </button>
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="font-bold text-slate-700">
                                {fee.planName}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {fee.duration} Day Window
                              </p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="text-xl font-black text-[#064e3b]">
                                {formatNGN(fee.amount)}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.color}`}
                              >
                                {badge.text}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {fee.expiresAt ? (
                                <div>
                                  <p
                                    className={`font-bold text-sm ${
                                      expiringSoon
                                        ? "text-red-600"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {formatDate(fee.expiresAt)}
                                  </p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {days} Days Remaining
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <button
                                onClick={() => renew(fee)}
                                className="p-3 bg-slate-100 text-[#064e3b] rounded-xl hover:bg-yellow-400 transition-all group/btn"
                              >
                                <ChevronRight
                                  size={18}
                                  className="group-hover/btn:translate-x-1 transition-transform"
                                />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filtered.map((fee: any) => {
                  const { name: studentName, deleted } = getStudentDisplay(
                    fee.studentId
                  );
                  const badge = getStatusBadge(fee.paid);
                  const days = daysLeft(fee.expiresAt);

                  return (
                    <motion.div
                      key={fee._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase">
                            Amount
                          </p>
                          <p className="text-lg font-black text-[#064e3b]">
                            {formatNGN(fee.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-3 rounded-2xl ${
                            deleted
                              ? "bg-red-50 text-red-500"
                              : "bg-emerald-50 text-[#064e3b]"
                          }`}
                        >
                          {deleted ? (
                            <UserX size={20} />
                          ) : (
                            <CreditCard size={20} />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-black ${
                              deleted ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {studentName}
                          </h3>
                          <p className="text-xs font-bold text-slate-500">
                            {fee.planName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                            Expires
                          </p>
                          <p className="text-xs font-black text-slate-700">
                            {fee.expiresAt ? formatDate(fee.expiresAt) : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                            Remaining
                          </p>
                          <p
                            className={`text-xs font-black ${
                              days !== null && days <= 7
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >
                            {days !== null ? `${days} Days` : "N/A"}
                          </p>
                        </div>
                      </div>

                      {(userType === "student" || userType === "teacher") && (
                        <button
                          onClick={() => renew(fee)}
                          className="mt-4 w-full py-4 bg-[#064e3b] text-yellow-400 font-black uppercase text-xs tracking-widest rounded-2xl shadow-emerald-900/10 active:scale-[0.98] transition-all"
                        >
                          Renew Session
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
