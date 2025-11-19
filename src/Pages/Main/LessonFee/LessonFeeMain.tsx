// src/pages/LessonFeesMain.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  Circle,
  Clock,
  UserX,
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

  // Helper: Get student name safely
  const getStudentDisplay = (
    student: StudentInfo | string | null | undefined
  ) => {
    if (!student || student === null) {
      return { name: "Student deleted or doesn't exist", deleted: true };
    }
    if (typeof student === "string") {
      return { name: "Unknown Student", deleted: false };
    }

    const fullName = `${student.firstName} ${student.lastName}`.trim();
    return {
      name: fullName || "Unknown Student",
      deleted: false,
    };
  };

  const formatNGN = (amt: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
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
        toast.error("Cannot view details – student no longer exists");
      } else {
        navigate(`/user-details/student/${fee?.studentId?._id}`);
      }
    } else {
      navigate("/profiles");
    }
  };

  const getStatusBadge = (paid: PaidInfo) => ({
    text: paid.isPaid ? "Paid" : "Not Paid",
    color: paid.isPaid
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700",
  });

  // Search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return lessonFees;

    const q = searchQuery.toLowerCase();
    return lessonFees.filter((fee: any) => {
      const { name } = getStudentDisplay(fee.studentId);
      const plan = fee.planName?.toLowerCase() || "";
      const ref = fee.reference?.toLowerCase() || "";
      const amount = fee.amount.toString();

      return (
        name.toLowerCase().includes(q) ||
        plan.includes(q) ||
        ref.includes(q) ||
        amount.includes(q)
      );
    });
  }, [lessonFees, searchQuery]);

  return (
    <>
      {/* Fullscreen Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%] py-48  bg-white flex flex-col items-center justify-center gap-6 z-50"
          >
            <Loader2 className="w-16 h-16 animate-spin text-gray-700" />
            <p className="text-lg font-medium text-gray-700">
              Loading lesson fees...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!loading && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 mt-12">
              <div className="bg-yellow-200 rounded-full p-4 mb-4 inline-flex">
                <CreditCard className="w-8 h-8 text-yellow-900" />
              </div>
              <h1 className="text-4xl font-black text-gray-900">Lesson Fees</h1>
              <p className="text-lg text-gray-600 mt-2">
                View payment history and renew lesson access. All prices in
                Naira.
              </p>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, plan, reference, amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3 text-red-700"
              >
                <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Failed to load fees</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm underline font-medium mt-2 hover:text-red-800"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <CreditCard className="w-28 h-28 text-gray-300 mx-auto mb-8" />
                <h2 className="text-3xl font-black text-gray-900 mb-4">
                  {searchQuery ? "No Results Found" : "No Lesson Fees Yet"}
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  {searchQuery
                    ? `No records match "${searchQuery}"`
                    : "You haven't purchased any lesson plans yet."}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (unchanged) */}
                <div className="md:hidden space-y-4">
                  {filtered.map((fee: any) => {
                    const { name: studentName, deleted } = getStudentDisplay(
                      fee.studentId
                    );
                    const badge = getStatusBadge(fee.paid);
                    const days = daysLeft(fee.expiresAt);
                    const expiringSoon = days !== null && days <= 7 && days > 0;

                    return (
                      <motion.div
                        key={fee._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                      >
                        {/* ... mobile card content (unchanged) ... */}
                        <div className="flex justify-between items-start mb-4">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${badge.color}`}
                          >
                            {badge.text}
                          </span>
                          {fee.paid.isPaid && (
                            <span className="text-xs text-gray-500">
                              via {fee.paid.paymentService}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {deleted && (
                            <UserX className="w-6 h-6 text-red-500" />
                          )}
                          <h3
                            className={`text-xl font-black ${
                              deleted ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {studentName}
                          </h3>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {fee.planName} • {fee.duration} days plan
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-2xl font-black text-gray-900">
                            {formatNGN(fee.amount)}
                          </p>

                          {fee.reference && (
                            <button
                              onClick={() => copyRef(fee.reference)}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition"
                            >
                              {copiedRef === fee.reference
                                ? "Copied"
                                : "Copy Ref"}
                              {copiedRef === fee.reference ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {fee.paid.timestamp && (
                          <p className="text-xs text-gray-500 mt-3">
                            Paid on {formatDate(fee.paid.timestamp)}
                          </p>
                        )}

                        {fee.expiresAt && (
                          <p
                            className={`text-sm font-medium mt-3 flex items-center gap-2 ${
                              expiringSoon ? "text-red-600" : "text-gray-600"
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            Expires in {days} day{days === 1 ? "" : "s"} •{" "}
                            {formatDate(fee.expiresAt)}
                          </p>
                        )}

                        <button
                          onClick={() => renew(fee)}
                          className="mt-5 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition"
                        >
                          Renew Plan
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Desktop Table – now horizontally scrollable */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Wrapper with horizontal scroll */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      {" "}
                      {/* min-w ensures it never collapses */}
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Student
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Paid On
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Expires
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Reference
                          </th>
                          <th className="px-6 py-4 text-left font-bold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filtered.map((fee: any) => {
                          const { name: studentName, deleted } =
                            getStudentDisplay(fee.studentId);
                          const badge = getStatusBadge(fee.paid);
                          const days = daysLeft(fee.expiresAt);
                          const expiringSoon =
                            days !== null && days <= 7 && days > 0;

                          return (
                            <tr
                              key={fee._id}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {deleted && (
                                    <UserX className="w-5 h-5 text-red-500" />
                                  )}
                                  <span
                                    className={`font-medium ${
                                      deleted ? "text-red-600" : "text-gray-900"
                                    }`}
                                  >
                                    {studentName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {fee.planName} ({fee.duration} days)
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {formatNGN(fee.amount)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${badge.color}`}
                                >
                                  <Circle className="w-3 h-3 fill-current" />
                                  {badge.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {fee.paid.timestamp
                                  ? formatDate(fee.paid.timestamp)
                                  : "—"}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {fee.expiresAt ? (
                                  <span
                                    className={
                                      expiringSoon
                                        ? "text-red-600 font-medium"
                                        : "text-gray-600"
                                    }
                                  >
                                    {formatDate(fee.expiresAt)} ({days} day
                                    {days === 1 ? "" : "s"})
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                {fee.reference || "—"}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => renew(fee)}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
