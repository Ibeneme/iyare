import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  ChevronDown,
  X,
  Search,
  Loader2,
  Plus,
  ArrowRight,
  Check,
  CreditCard,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../Redux/baseurl";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import { fetchUser } from "../Redux/Slices/accounts.slice";

const API_BASE = `${BASE_URL}/api/users`;
const GRADES_API = `${BASE_URL}/api/grades/grades`;

// ────────────────────── INTERFACES ──────────────────────
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "student" | "parent";
  subjects?: string[];
  courses?: any[];
  children?: User[];
  parentId?: string;
  class?: string;
  gradeId?: string;
  isPaid?: boolean;
}

interface ChildSetup {
  childId: string;
  class: string;
  subjects: string[];
  originalSubjects: string[];
  saved?: boolean; // ← Track per-child save
}

interface Grade {
  _id: string;
  title: string;
  description: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  gradeId: string;
}

interface StudentDetail {
  _id: string;
  firstName: string;
  lastName: string;
  class?: string;
  subjects: string[];
}

// ────────────────────── COMPONENT ──────────────────────
const UserSetupUpdates: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // ───── Auth state ─────
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<"student" | "parent" | null>(null);

  // ───── UI state ─────
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [childSetups, setChildSetups] = useState<Record<string, ChildSetup>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // ───── Data ─────
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsByGrade, setSubjectsByGrade] = useState<
    Record<string, Subject[]>
  >({});
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  /* ───── FETCH USER FROM API ───── */
  useEffect(() => {
    setLoading(true);
    setError("");

    dispatch(fetchUser())
      .unwrap()
      .then((res: any) => {
        if (res.success && res.data?.[0]) {
          const children = res.data;
          const fetchedToken = localStorage.getItem("token") || null;

          const parentUser: User = {
            _id: children[0].parentId || "parent-id",
            firstName: "Parent",
            lastName: "",
            email: "",
            userType: "parent",
            children,
            isPaid: children[0].isPaid ?? false,
          };

          setUser(parentUser);
          setUserType("parent");
          setToken(fetchedToken);

          const init: Record<string, ChildSetup> = {};
          children.forEach((child: any) => {
            init[child._id] = {
              childId: child._id,
              class: child.gradeId || "",
              subjects: [...(child.subjects ?? [])],
              originalSubjects: [...(child.subjects ?? [])],
              saved: false,
            };
          });
          setChildSetups(init);
        } else {
          throw new Error("Invalid payload");
        }
      })
      .catch((err) => {
        const msg = err?.message || "Failed to load profile";
        setError(msg);
        toast.error(msg);
        navigate("/auth-sign-in", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [dispatch, navigate]);

  /* ───── FETCH GRADES + PRE-SELECT ───── */
  useEffect(() => {
    if (!token || !user || !userType) return;

    const fetch = async () => {
      try {
        setLoadingGrades(true);
        const { data } = await axios.get(GRADES_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const gradesList = data.data || data || [];
        setGrades(gradesList);

        // Pre-select for all children
        user.children?.forEach((child) => {
          if (child.gradeId) {
            const matched = gradesList.find(
              (g: Grade) => g._id === child.gradeId
            );
            if (matched) {
              setChildSetups((prev) => ({
                ...prev,
                [child._id]: {
                  ...prev[child._id],
                  class: matched._id,
                },
              }));
            }
          }
        });
      } catch (e: any) {
        setError("Failed to load classes.");
      } finally {
        setLoadingGrades(false);
      }
    };

    fetch();
  }, [token, user, userType]);

  /* ───── FETCH SUBJECTS FOR GRADE ───── */
  const fetchSubjectsForGrade = async (gradeId: string) => {
    if (subjectsByGrade[gradeId] || !token) return;
    try {
      setLoadingSubjects(true);
      const { data } = await axios.get(`${GRADES_API}/subjects/${gradeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjects = (data.data || []).map((s: any) => ({
        ...s,
        gradeId,
      }));
      setSubjectsByGrade((p) => ({ ...p, [gradeId]: subjects }));
    } catch (e: any) {
      console.error("Failed to load subjects:", e);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ───── Current data ─────
  const children = user?.children ?? [];
  const currentChild = children[activeChildIndex];
  const currentSetup = currentChild ? childSetups[currentChild._id] : null;
  const currentGradeId = currentSetup?.class || "";
  const gradeSubjects = currentGradeId
    ? subjectsByGrade[currentGradeId] ?? []
    : [];
  const enrolledSubjectIds = currentSetup?.subjects ?? [];

  useEffect(() => {
    if (
      currentGradeId &&
      token &&
      !currentSetup?.class?.startsWith?.("custom")
    ) {
      fetchSubjectsForGrade(currentGradeId);
    }
  }, [currentGradeId, token]);

  // ───── VALIDATE: Same grade only ─────
  const validEnrolledSubjectIds = useMemo(() => {
    if (!currentGradeId || currentSetup?.class?.startsWith?.("custom")) {
      return enrolledSubjectIds;
    }
    return enrolledSubjectIds.filter((sid) =>
      gradeSubjects.some((s) => s._id === sid)
    );
  }, [enrolledSubjectIds, gradeSubjects, currentGradeId, currentSetup?.class]);

  const invalidSubjectCount =
    enrolledSubjectIds.length - validEnrolledSubjectIds.length;

  // ───── Available subjects ─────
  const availableSubjects = useMemo(() => {
    return gradeSubjects.filter((s) => !enrolledSubjectIds.includes(s._id));
  }, [gradeSubjects, enrolledSubjectIds]);

  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableSubjects;
    const q = searchQuery.toLowerCase();
    return availableSubjects.filter((s) =>
      `${s.name} ${s.code}`.toLowerCase().includes(q)
    );
  }, [availableSubjects, searchQuery]);

  // ───── Actions ─────
  const updateChildSetup = (
    field: keyof Omit<ChildSetup, "originalSubjects" | "saved">,
    value: any
  ) => {
    if (!currentChild) return;
    setChildSetups((p) => ({
      ...p,
      [currentChild._id]: {
        ...p[currentChild._id],
        [field]: value,
        saved: false, // Unmark as saved
      },
    }));
  };

  const addSubject = (subjectId: string) => {
    if (!enrolledSubjectIds.includes(subjectId)) {
      updateChildSetup("subjects", [...enrolledSubjectIds, subjectId]);
    }
  };

  const removeSubject = (subjectId: string) => {
    updateChildSetup(
      "subjects",
      enrolledSubjectIds.filter((id) => id !== subjectId)
    );
  };

  // const resetChanges = () => {
  //   if (!currentChild) return;
  //   const original = childSetups[currentChild._id].originalSubjects;
  //   updateChildSetup("subjects", [...original]);
  //   toast.success("Changes discarded");
  // };

  // const hasChanges =
  //   currentSetup?.subjects.join("") !== currentSetup?.originalSubjects.join("");

  // ───── SAVE CURRENT CHILD ─────
  const saveCurrentChild = async () => {
    if (!currentChild || !token || invalidSubjectCount > 0) {
      toast.error("Fix invalid subjects first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        gradeId: currentSetup?.class,
        subjects: validEnrolledSubjectIds,
      };
      const res = await axios.put(
        `${API_BASE}/update/student/${currentChild._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setChildSetups((p) => ({
          ...p,
          [currentChild._id]: {
            ...p[currentChild._id],
            saved: true,
            originalSubjects: [...validEnrolledSubjectIds],
          },
        }));
        toast.success(`${currentChild.firstName} saved!`);
      } else {
        throw new Error("Save failed");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───── PROCEED TO PAY ─────
  const anyChildFilled = Object.values(childSetups).some(
    (s) => s.class && s.subjects.length > 0
  );

  const buildAllStudentDetails = (): StudentDetail[] => {
    return children.map((c) => {
      const s = childSetups[c._id];
      return {
        _id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        gradeId: s.class ?? "",
        subjects: s.subjects ?? [],
      };
    });
  };

  const proceedToPayment = () => {
    if (!anyChildFilled) return;
    navigate("/pricing-page", {
      state: {
        parentId: user?._id,
        studentDetails: buildAllStudentDetails(),
      },
    });
  };

  // ───── LOADING ─────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#023009]" />
      </div>
    );
  }

  if (!user || !token || !userType) return null;

  // ───── UI ─────
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-12 h-12 text-[#023009]" />
            </div>
            <h1 className="text-3xl font-black text-[#023009]">
              Edit Your Children
            </h1>
            <p className="text-[#023009]/70 mt-1">
              Save each child → Proceed to payment
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Child Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {children.map((child, i) => {
              const setup = childSetups[child._id];
              const isSaved = setup?.saved;
              const isFilled = setup?.class && setup?.subjects.length > 0;
              return (
                <button
                  key={child._id}
                  onClick={() => setActiveChildIndex(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeChildIndex === i
                      ? "bg-[#023009] text-white"
                      : "bg-gray-100 text-[#023009] hover:bg-gray-200"
                  }`}
                >
                  <span>{child.firstName}</span>
                  {isSaved && <Check className="w-4 h-4" />}
                  {isFilled && !isSaved && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentChild?._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <h2 className="text-xl font-bold text-[#023009] text-center">
                Editing:{" "}
                <span className="text-[#ffd000]">
                  {currentChild?.firstName} {currentChild?.lastName}
                </span>
                {currentSetup?.saved && (
                  <span className="ml-2 text-green-600 text-sm">Saved</span>
                )}
              </h2>

              {/* Grade Picker */}
              <div>
                <label className="block text-sm font-bold text-[#023009] mb-3">
                  Select Class <span className="text-red-600">*</span>
                </label>
                {loadingGrades ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#023009]" />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={currentSetup?.class ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateChildSetup(
                          "class",
                          v === "custom" ? "custom" : v
                        );
                        if (v !== currentSetup?.class) {
                          updateChildSetup("subjects", []);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] bg-white text-[#023009] pr-10 shadow-sm"
                    >
                      <option value="">Choose class...</option>
                      {grades.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.title}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#023009]/50 pointer-events-none" />
                  </div>
                )}
                {currentSetup?.class?.startsWith?.("custom") && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    placeholder="e.g. Primary 4..."
                    value={currentSetup.class.replace("custom:", "")}
                    onChange={(e) =>
                      updateChildSetup("class", "custom:" + e.target.value)
                    }
                    className="mt-3 w-full px-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] bg-white text-[#023009] shadow-sm"
                  />
                )}
              </div>

              {/* Enrolled Subjects */}
              <div>
                <label className="block text-sm font-bold text-[#023009] mb-3">
                  Enrolled Subjects ({validEnrolledSubjectIds.length})
                </label>
                {validEnrolledSubjectIds.length === 0 ? (
                  <p className="text-[#023009]/60 text-sm py-4 text-center">
                    No subjects selected.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {validEnrolledSubjectIds.map((sid) => {
                      const sub = gradeSubjects.find((s) => s._id === sid);
                      if (!sub) return null;
                      return (
                        <div
                          key={sid}
                          className="flex items-center justify-between p-3 bg-[#f0fdf0] rounded-xl border border-[#ffd000]/30"
                        >
                          <div>
                            <span className="font-medium">{sub.name}</span>
                            <span className="text-xs text-[#023009]/60 ml-2">
                              ({sub.code})
                            </span>
                          </div>
                          <button
                            onClick={() => removeSubject(sid)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Subjects */}
              <div>
                <label className="block text-sm font-bold text-[#023009] mb-3">
                  Add Subjects
                </label>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        addSubject(val);
                        e.target.value = "";
                      }
                    }}
                    disabled={
                      isSubmitting ||
                      loadingSubjects ||
                      availableSubjects.length === 0
                    }
                    className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] bg-white text-[#023009] pr-10 shadow-sm"
                  >
                    <option value="">
                      {loadingSubjects ? "Loading..." : "Select subject"}
                    </option>
                    {filteredAvailable.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#023009]/50 pointer-events-none" />
                </div>
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#023009]/50" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] bg-white text-[#023009]"
                    />
                  </div>
                </div>
              </div>

              {/* Save This Child */}
              <button
                onClick={saveCurrentChild}
                disabled={
                  !currentSetup?.class ||
                  validEnrolledSubjectIds.length === 0 ||
                  isSubmitting ||
                  currentSetup?.saved
                }
                className="w-full bg-[#023009] text-white py-4 rounded-xl font-black text-lg hover:bg-[#023009]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : currentSetup?.saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Save {currentChild?.firstName}
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>

          {/* PROCEED TO PAY — BOTTOM */}
          <div className="mt-8 pt-6 border-t border-[#ffd000]/30">
            <button
              onClick={proceedToPayment}
              disabled={!anyChildFilled}
              className="w-full bg-gradient-to-r from-[#ffd000] to-[#ffed4e] text-[#023009] py-5 rounded-xl font-black text-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <CreditCard className="w-6 h-6" />
              Proceed to Payment
              <ArrowRight className="w-6 h-6" />
            </button>
            {!anyChildFilled && (
              <p className="text-center text-[#023009]/60 text-sm mt-2">
                Save at least one child to proceed
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSetupUpdates;
