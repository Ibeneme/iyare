import { useEffect, useState } from "react";
import {
  Loader2,
  Mail,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  User2Icon,
  ArrowRight,
  Edit3,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { fetchUser } from "../../../store/features/accounts/accounts.slice";
import { useNavigate } from "react-router-dom";

import Avatar from "../../../components/ui/Avatar";
import { getUserType } from "../../../utils/userType";
import ChangePasswordPanel from "../account/ChangePasswordPanel";

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

  const goToAddStudent = () => navigate("/app/students/new");
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
    className: value ? "badge-green" : "badge-gray",
    text: value ? yes : no,
  });

  const confirmCancelSubscription = () => {
    if (!cancelStudentId) return;
    setStudents((prev) =>
      prev.map((s) =>
        s._id === cancelStudentId ? { ...s, isSubscribed: false } : s,
      ),
    );
    toast.success("Subscription cancelled");
    closeCancelModal();
  };

  const payForChild = (student: StudentData) => {
    if (student.isPaid || student.isSubscribed) return;
    navigate("/app/transactions", {
      state: {
        childId: student._id,
        studentIds: [student._id],
        parentId: student.parentId,
      },
    });
  };

  const subscribeAgain = (student: StudentData) => {
    const studentDetail: StudentDetail = {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class || student.gradeId || "Not Set",
      subjects: student.subjects.map((s) => s._id),
    };
    navigate("/plans", {
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
      `Hello Support,\n\nPlease delete this student account:\n\nName: ${student.firstName} ${student.lastName}\nEmail: ${student.email}\nID: ${student._id}\n\nThank you.`.trim(),
    );
    window.location.href = `mailto:onyekachiiyare@gmail.com?subject=${subject}&body=${body}`;
    toast.success("Opening email...");
  };

  const goToSubject = (subjectId: string) =>
    navigate(`/app/subjects/${subjectId}`);

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
      <div className="page min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-surface text-muted rounded-full grid place-items-center mx-auto mb-6">
            <User2Icon size={28} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-primary mb-2">
            No profiles yet
          </h2>
          <p className="text-sm text-muted mb-8">
            {type === "parent"
              ? "Add your first student profile to get started."
              : "Your profile will appear here once your account is set up."}
          </p>
          {type === "parent" && (
            <button onClick={goToAddStudent} className="btn-primary w-full">
              <Plus size={16} /> Add student
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page">
      <AnimatePresence>
        {loading && (
          <motion.div
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface backdrop-blur-md flex flex-col items-center justify-center gap-3 z-[60]"
          >
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted">Loading profiles…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && students.length > 0 && (
        <>
          <header className="page-header">
            <div>
              <h1 className="page-title">
                {type === "parent" ? "My children" : "My profile"}
              </h1>
              <p className="page-subtitle">
                {students.length} active profile{students.length > 1 ? "s" : ""}{" "}
                on Yare Height.
              </p>
            </div>

            {type === "parent" && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/app/profile/edit`)}
                  className="btn-secondary"
                >
                  <Edit3 size={15} /> Edit details
                </button>
                <button onClick={goToAddStudent} className="btn-primary">
                  <Plus size={16} /> Add student
                </button>
              </div>
            )}
          </header>

          {error && (
            <div className="p-4 bg-[var(--color-danger-bg)] rounded-3xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
              <p className="flex-1 text-sm font-medium text-[var(--color-danger)]">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-icon"
                aria-label="Reload"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          )}

          <div className="space-y-6">
            {students.map((student) => {
              const needsPayment = !student.isPaid && !student.isSubscribed;

              return (
                <motion.section
                  key={student._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-5 sm:p-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Identity */}
                    <div className="lg:col-span-4 space-y-5">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={`${student.firstName} ${student.lastName}`}
                          email={(student as any).email}
                          src={(student as any).avatarUrl}
                          size={56}
                        />
                        <div className="min-w-0">
                          <h3 className="text-xl font-semibold tracking-tight text-primary truncate">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-xs text-muted mt-0.5">
                            Joined {formatDate(student.createdAt)}
                          </p>
                        </div>
                      </div>

                      <dl className="divide-y divide-[var(--color-card-border)] text-sm">
                        <div className="flex items-center justify-between py-3">
                          <dt className="text-muted">Account</dt>
                          <dd>
                            <span className="badge-gray">Student</span>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <dt className="text-muted">Subscription</dt>
                          <dd>
                            {(() => {
                              const b = getBadge(
                                student.isSubscribed,
                                "Active",
                                "Inactive",
                              );
                              const Icon = b.icon;
                              return (
                                <span className={b.className}>
                                  <Icon size={12} />
                                  {b.text}
                                </span>
                              );
                            })()}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <dt className="text-muted">Fees</dt>
                          <dd>
                            {(() => {
                              const b = getBadge(
                                student.isPaid,
                                "Paid",
                                "Outstanding",
                              );
                              const Icon = b.icon;
                              return (
                                <span className={b.className}>
                                  <Icon size={12} />
                                  {b.text}
                                </span>
                              );
                            })()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-8 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="stat-label">Email</p>
                          <p className="text-sm font-medium text-primary flex items-center gap-2 mt-1 break-all">
                            <Mail size={14} className="text-muted shrink-0" />{" "}
                            {student.email}
                          </p>
                        </div>
                        <div>
                          <p className="stat-label">Student ID</p>
                          <p className="text-sm font-medium text-primary mt-1">
                            {student._id.slice(-8)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="section-title mb-4">
                          Enrolled subjects{" "}
                          <span className="text-muted font-normal">
                            ({student.subjects.length})
                          </span>
                        </h4>

                        {student.subjects.length === 0 ? (
                          <div className="p-8 bg-surface rounded-3xl text-center">
                            <p className="text-sm text-muted">
                              No subjects enrolled yet
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {student.subjects.map((subject) => (
                              <button
                                key={subject._id}
                                onClick={() => goToSubject(subject._id)}
                                className="group/btn flex items-center justify-between p-4 bg-surface rounded-2xl hover:bg-[var(--color-surface-alt)] transition-colors text-left"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-primary truncate">
                                    {subject.name}
                                  </p>
                                  <p className="text-xs text-muted mt-0.5">
                                    {subject.code}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-subtle group-hover/btn:text-primary group-hover/btn:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-6 divider">
                        {type === "parent" && needsPayment && (
                          <button
                            onClick={() => payForChild(student)}
                            className="btn-primary"
                          >
                            <CreditCard size={16} /> Pay for {student.firstName}
                          </button>
                        )}
                        {!student.isSubscribed && (
                          <button
                            onClick={() => subscribeAgain(student)}
                            className="btn-secondary"
                          >
                            <CheckCircle size={16} /> Renew subscription
                          </button>
                        )}
                        {type === "parent" && (
                          <button
                            onClick={() => requestDeleteAccount(student)}
                            className="btn-danger"
                          >
                            <Trash2 size={16} /> Request account removal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>
              );
            })}
          </div>
        </>
      )}

      <ChangePasswordPanel />

      {/* Cancel subscription dialog */}
      <AnimatePresence>
        {cancelStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-[100]"
            onClick={closeCancelModal}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card-elevated rounded-t-[1.75rem] sm:rounded-[1.75rem] p-8 max-w-md w-full text-center space-y-6"
            >
              <div className="w-14 h-14 bg-[var(--color-danger-bg)] text-[var(--color-danger)] rounded-full grid place-items-center mx-auto">
                <XCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-semibold tracking-tight text-primary">
                  Cancel subscription?
                </h3>
                <p className="text-sm text-muted">
                  Access will be revoked immediately for this student.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmCancelSubscription}
                  className="btn-danger w-full"
                >
                  Yes, cancel
                </button>
                <button onClick={closeCancelModal} className="btn-ghost w-full">
                  Keep access
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
