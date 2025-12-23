// src/pages/UserProfile.tsx
import { useEffect, useState } from "react";
import {
  Loader2,
  User,
  Mail,
  // Calendar,
  Shield,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  CreditCard,
  Users,
  Trash2,
  Plus,
  User2Icon,
  BookOpen,
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
      ? "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300"
      : "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-300",
    text: value ? yes : no,
  });

  //const openCancelModal = (id: string) => setCancelStudentId(id);
  const closeCancelModal = () => setCancelStudentId(null);

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
      `
Hello Support,

Please delete this student account:

Name: ${student.firstName} ${student.lastName}
Email: ${student.email}
ID: ${student._id}

Thank you.
    `.trim()
    );

    window.location.href = `mailto:onyekachiiyare@gmail.com?subject=${subject}&body=${body}`;
    toast.success("Opening email...");
  };

  const goToSubject = (subjectId: string) => {
    navigate(`/c/${subjectId}`);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    dispatch(fetchUser())
      .unwrap()
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setStudents(res.data);
        } else {
          setStudents([]);
        }
      })
      .catch((err) => {
        const msg = err?.message || "Failed to load profile";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const type = getUserType();

  if (!loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-10 shadow-lg text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-yellow-100 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <User2Icon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No Profile Found
          </h2>
          <p className="text-gray-600 mb-8">
            Add your first student to get started.
          </p>
          <button
            onClick={goToAddStudent}
            className="w-full py-3 bg-yellow-100 text-yellow-900 rounded-lg font-medium  flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%]  bg-white flex flex-col items-center justify-center gap-5 z-50"
          >
            <Loader2 className="w-14 h-14 animate-spin text-gray-900" />
            <p className="text-xl font-bold text-gray-900">
              Loading Profiles...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && students.length > 0 && (
        <div className="min-h-screen bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8 md:px-6">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="w-14 h-14 bg-yellow-100 text-yellow-900 rounded-full flex items-center justify-center mb-4">
                  <User2Icon className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-gray-900">Profiles</h1>
                <p className="text-gray-600 mt-1">
                  Managing {students.length} student account
                  {students.length > 1 ? "s" : ""}
                </p>
              </div>

              {type === "admin" && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => navigate(`/user-updates`)}
                    className="px-5 py-2.5 border-gray-900 text-gray-900 rounded-lg  font-medium text-sm flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>

                  <button
                    onClick={goToAddStudent}
                    className="inline-flex items-center gap-2 px-5 py-3 border-gray-900 text-gray-900 rounded-lg  font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add Student
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-8 p-5 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-bold text-red-800">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm underline text-red-700 hover:text-red-800 flex items-center gap-1 mt-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Student Cards */}
            <div className="space-y-8">
              {students.map((student) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className=" p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 text-gray-900 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm opacity-90">
                          Joined {formatDate(student.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">
                            {student.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Account Type</p>
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Student
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Lesson Fee</p>
                          {(() => {
                            const b = getBadge(
                              student.isPaid,
                              "Paid",
                              "Unpaid"
                            );
                            const Icon = b.icon;
                            return (
                              <span className={b.className}>
                                <Icon className="w-3.5 h-3.5" />
                                {b.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Subscription</p>
                          {(() => {
                            const b = getBadge(
                              student.isSubscribed,
                              "Active",
                              "Inactive"
                            );
                            const Icon = b.icon;
                            return (
                              <span className={b.className}>
                                <Icon className="w-3.5 h-3.5" />
                                {b.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Subjects Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-gray-600" />
                        <h4 className="font-bold text-gray-900">
                          Subjects Enrolled
                        </h4>
                        <span className="text-sm text-gray-500">
                          ({student.subjects.length})
                        </span>
                      </div>

                      {student.subjects.length === 0 ? (
                        <p className="text-gray-500 italic">
                          No subjects assigned yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {student.subjects.map((subject) => (
                            <button
                              key={subject._id}
                              onClick={() => goToSubject(subject._id)}
                              className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-100 transition"
                            >
                              <div className="text-left">
                                <p className="font-bold text-gray-900">
                                  {subject.name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {subject.code}
                                </p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      {/* {student.isSubscribed ? (
                        <button
                          onClick={() => openCancelModal(student._id)}
                          className="px-5 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm border border-red-300 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Subscription
                        </button>
                      ) : (
                        <button
                          onClick={() => subscribeAgain(student)}
                          className="px-5 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm border border-green-300 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Subscribe Again
                        </button>
                      )} */}
                      {!student.isSubscribed && (
                        <button
                          onClick={() => subscribeAgain(student)}
                          className="px-5 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm border border-green-300 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Subscribe Again
                        </button>
                      )}

                      {type === "parent" && (
                        <button
                          onClick={() => requestDeleteAccount(student)}
                          className="px-5 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm border border-red-300 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Request Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={closeCancelModal}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 mb-6">Access will end immediately.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeCancelModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Keep Active
                </button>
                <button
                  onClick={confirmCancelSubscription}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Cancel Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
