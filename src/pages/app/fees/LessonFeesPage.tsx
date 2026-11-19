import { getCookie,} from "../../../utils/cookies";
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
  
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/index";
import { fetchLessonFeesByUser } from "../../../store/features/payments/lessonFees.slice";
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
    (state: RootState) => state.lessonFees
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
    const userType = getCookie("userType");
    if (userType === "admin") {
      if (!fee?.studentId) {
        toast.error("Student no longer exists");
      } else {
        navigate(`/app/user/student/${fee?.studentId?._id}`);
      }
    } else {
      navigate("/app/profile");
    }
  };

  const getStatusBadge = (paid: PaidInfo) => ({
    text: paid.isPaid ? "Paid" : "Pending",
    color: paid.isPaid
      ? "badge-green"
      : "badge-yellow",
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
      const user = JSON.parse(getCookie("user") || "{}");
      return user?.userType;
    } catch {
      return null;
    }
  })();

  const paidCount = lessonFees.filter((f: any) => f?.paid?.isPaid).length;
  const pendingCount = lessonFees.length - paidCount;
  const canRenew = userType === "student" || userType === "teacher";

  return (
    <div className="page">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--color-surface)] flex flex-col items-center justify-center z-[100]"
          >
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted">Loading your payments…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <>
          <header className="page-header">
            <div>
              <h1 className="page-title">Fees &amp; Billing</h1>
              <p className="page-subtitle">Manage lesson access and review your payment history.</p>
            </div>
          </header>

          {/* Stat strip */}
          <section className="card p-5 sm:p-6 grid grid-cols-3 gap-4">
            <div>
              <p className="stat-label">Total records</p>
              <p className="stat-value mt-1">{filtered.length}</p>
            </div>
            <div>
              <p className="stat-label">Paid</p>
              <p className="stat-value mt-1 flex items-center gap-2">
                {paidCount}
                <span className="badge-green text-[11px]">Successful</span>
              </p>
            </div>
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value mt-1 flex items-center gap-2">
                {pendingCount}
                <span className="badge-yellow text-[11px]">Awaiting</span>
              </p>
            </div>
          </section>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
              <input
                type="text"
                placeholder="Search by student, reference or amount"
                aria-label="Search fees"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input bg-card"
              />
            </div>
            {error && (
              <span className="badge-red">
                <AlertCircle size={14} /> Error loading data
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-20 px-6">
              <CreditCard className="w-12 h-12 text-subtle mx-auto mb-4" />
              <h2 className="section-title">No transactions found</h2>
              <p className="text-sm text-muted mt-1">No lesson fee records match your search.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <section className="hidden md:block card p-2 sm:p-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Expires</th>
                        <th className="sr-only">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((fee: any) => {
                        const { name: studentName, deleted } = getStudentDisplay(fee.studentId);
                        const badge = getStatusBadge(fee.paid);
                        const days = daysLeft(fee.expiresAt);
                        const expiringSoon = days !== null && days <= 7 && days > 0;

                        return (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={fee._id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
                                    deleted ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]" : "bg-surface text-muted"
                                  }`}
                                >
                                  {deleted ? <UserX size={16} /> : <Circle size={8} className="fill-current" />}
                                </span>
                                <div className="min-w-0">
                                  <p className={`font-medium truncate ${deleted ? "text-[var(--color-danger)]" : "text-primary"}`}>
                                    {studentName}
                                  </p>
                                  <p className="text-xs text-muted flex items-center gap-1">
                                    Ref {fee.reference?.substring(0, 8)}…
                                    <button
                                      onClick={() => copyRef(fee.reference)}
                                      className="hover:text-primary"
                                      aria-label="Copy reference"
                                    >
                                      <Copy size={11} />
                                    </button>
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p className="font-medium text-primary">{fee.planName}</p>
                              <p className="text-xs text-muted">{fee.duration} day window</p>
                            </td>
                            <td className="font-semibold text-primary whitespace-nowrap">{formatNGN(fee.amount)}</td>
                            <td>
                              <span className={badge.color}>{badge.text}</span>
                            </td>
                            <td>
                              {fee.expiresAt ? (
                                <div>
                                  <p className={`text-sm ${expiringSoon ? "text-[var(--color-danger)] font-medium" : "text-primary"}`}>
                                    {formatDate(fee.expiresAt)}
                                  </p>
                                  <p className="text-xs text-muted">{days} days left</p>
                                </div>
                              ) : (
                                <span className="text-subtle">—</span>
                              )}
                            </td>
                            <td className="text-right">
                              <button onClick={() => renew(fee)} className="btn-icon" aria-label="Open">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((fee: any) => {
                  const { name: studentName, deleted } = getStudentDisplay(fee.studentId);
                  const badge = getStatusBadge(fee.paid);
                  const days = daysLeft(fee.expiresAt);

                  return (
                    <motion.div
                      key={fee._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card p-5"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className={`font-semibold truncate ${deleted ? "text-[var(--color-danger)]" : "text-primary"}`}>
                            {studentName}
                          </h3>
                          <p className="text-xs text-muted">{fee.planName}</p>
                        </div>
                        <span className={badge.color}>{badge.text}</span>
                      </div>

                      <p className="stat-value mt-3">{formatNGN(fee.amount)}</p>

                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 divider">
                        <div>
                          <p className="stat-label">Expires</p>
                          <p className="text-sm font-medium text-primary mt-0.5">
                            {fee.expiresAt ? formatDate(fee.expiresAt) : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="stat-label">Remaining</p>
                          <p
                            className={`text-sm font-medium mt-0.5 ${
                              days !== null && days <= 7 ? "text-[var(--color-danger)]" : "text-primary"
                            }`}
                          >
                            {days !== null ? `${days} days` : "N/A"}
                          </p>
                        </div>
                      </div>

                      {canRenew && (
                        <button onClick={() => renew(fee)} className="btn-primary w-full mt-4">
                          Renew session
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
