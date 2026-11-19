import Select from "../../../components/ui/Select";
import { getCookie, } from "../../../utils/cookies";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell, { AuthNotice } from "../../auth/AuthShell";
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
import { BASE_URL } from "../../../lib/baseUrl";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { fetchUser } from "../../../store/features/accounts/accounts.slice";

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
          const fetchedToken = getCookie("token") || null;

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
        navigate("/sign-in", { replace: true });
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
    navigate("/plans", {
      state: {
        parentId: user?._id,
        studentDetails: buildAllStudentDetails(),
      },
    });
  };

  // ───── LOADING ─────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface grid place-items-center" role="status" aria-label="Loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !token || !userType) return null;

  // ───── UI ─────
  return (
    <AuthShell
      width="xl"
      title="Edit your children"
      subtitle="Save each child, then proceed to payment"
      badge={<span className="badge-gray"><Book className="w-3.5 h-3.5" /> Profile</span>}
      showHomeLink={false}
    >
          {error && (
            <div className="mb-6"><AuthNotice tone="error">{error}</AuthNotice></div>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                    activeChildIndex === i
                      ? "bg-[var(--color-primary)] text-[var(--color-brand-fg)]"
                      : "bg-surface text-muted hover:text-primary"
                  }`}
                >
                  <span>{child.firstName}</span>
                  {isSaved && <Check className="w-4 h-4" />}
                  {isFilled && !isSaved && (
                    <div className="w-2 h-2 bg-[var(--color-warning)] rounded-full" />
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
              <h2 className="text-lg font-semibold text-primary text-center">
                Editing:{" "}
                <span className="text-muted">
                  {currentChild?.firstName} {currentChild?.lastName}
                </span>
                {currentSetup?.saved && (
                  <span className="ml-2 text-[var(--color-success)] text-sm">Saved</span>
                )}
              </h2>

              {/* Grade Picker */}
              <div>
                <label className="form-label">
                  Select Class <span className="text-[var(--color-danger)]">*</span>
                </label>
                {loadingGrades ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="relative">
                    <Select
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
                      className="form-select pr-10"
                    >
                      <option value="">Choose class...</option>
                      {grades.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.title}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </Select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle pointer-events-none" />
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
                    className="form-input mt-3"
                  />
                )}
              </div>

              {/* Enrolled Subjects */}
              <div>
                <label className="form-label">
                  Enrolled Subjects ({validEnrolledSubjectIds.length})
                </label>
                {validEnrolledSubjectIds.length === 0 ? (
                  <p className="text-muted text-sm py-4 text-center">
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
                          className="flex items-center justify-between p-3 bg-surface rounded-xl border border-transparent"
                        >
                          <div>
                            <span className="font-medium">{sub.name}</span>
                            <span className="text-xs text-muted ml-2">
                              ({sub.code})
                            </span>
                          </div>
                          <button
                            onClick={() => removeSubject(sid)}
                            className="text-[var(--color-danger)] hover:opacity-80"
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
                <label className="form-label">
                  Add Subjects
                </label>
                <div className="relative">
                  <Select
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
                    className="form-select pr-10"
                  >
                    <option value="">
                      {loadingSubjects ? "Loading..." : "Select subject"}
                    </option>
                    {filteredAvailable.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </Select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle pointer-events-none" />
                </div>
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input pl-10"
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
                className="btn-primary w-full"
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
          <div className="mt-8 pt-6 divider">
            <button
              onClick={proceedToPayment}
              disabled={!anyChildFilled}
              className="btn-accent btn-lg w-full"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Payment
              <ArrowRight className="w-5 h-5" />
            </button>
            {!anyChildFilled && (
              <p className="text-center text-muted text-sm mt-2">
                Save at least one child to proceed
              </p>
            )}
          </div>
    </AuthShell>
  );
};

export default UserSetupUpdates;