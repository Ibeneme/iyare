import Select from "../../components/ui/Select";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthShell, { AuthNotice } from "./AuthShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Book,
  ChevronDown,
  X,
  Search,
  CheckCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../lib/baseUrl";

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
}

interface ChildSetup {
  childId: string;
  class: string;
  subjects: string[];
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
}

interface StudentDetail {
  _id: string;
  firstName: string;
  lastName: string;
  class: string;
  subjects: string[];
}

// ────────────────────── COMPONENT ──────────────────────
const UserSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ───── State from location.state ONLY ─────
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<"student" | "parent">("student");

  // ───── UI States ─────
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [childSetups, setChildSetups] = useState<Record<string, ChildSetup>>(
    {}
  );
  const [studentClass, setStudentClass] = useState("");
  const [studentCustomClass, setStudentCustomClass] = useState("");
  const [isStudentCustom, setIsStudentCustom] = useState(false);
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ───── Data ─────
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsByGrade, setSubjectsByGrade] = useState<
    Record<string, Subject[]>
  >({});
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // ───── Time & Country ─────
  const currentTime = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  /* ───── GET USER, TOKEN, TYPE FROM location.state ───── */
  useEffect(() => {
    const state = location.state as {
      user?: User;
      token?: string;
      userType?: "student" | "parent";
    } | null;

    if (!state?.user || !state?.token || !state?.userType) {
      console.warn(
        "Missing user data in location.state. Redirecting to signin."
      );
      navigate("/sign-in", { replace: true });
      return;
    }

    console.log("========================================");
    console.log(" USER SETUP - DATA FROM location.state ");
    console.log("========================================");
    console.log("Timestamp (WAT):", currentTime);
    console.log("Country: NG");
    console.log("User ID:", state.user._id);
    console.log("User Type:", state.userType);
    console.log("Email:", state.user.email);
    console.log("Name:", `${state.user.firstName} ${state.user.lastName}`);
    console.log("Token:", state.token);
    console.log("Children Count:", state.user.children?.length || 0);
    console.log("========================================");

    setUser(state.user);
    setToken(state.token);
    setUserType(state.userType);

    // Initialize child setups for parent
    if (state.userType === "parent" && state.user.children?.length) {
      const initialSetups: Record<string, ChildSetup> = {};
      state.user.children.forEach((child: User) => {
        initialSetups[child._id] = {
          childId: child._id,
          class: "",
          subjects: [],
        };
      });
      setChildSetups(initialSetups);
    }
  }, [location.state, navigate]);

  /* ───── Fetch Grades ───── */
  useEffect(() => {
    if (!token) return;

    const fetchGrades = async () => {
      try {
        setLoadingGrades(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(GRADES_API, config);
        const fetchedGrades = res.data.data || res.data || [];
        setGrades(fetchedGrades);
        console.log("Fetched Grades:", fetchedGrades);
      } catch (err) {
        console.error("Failed to fetch grades:", err);
        setError("Failed to load classes. Please refresh.");
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [token]);

  /* ───── Fetch Subjects for Grade ───── */
  const fetchSubjectsForGrade = async (gradeId: string) => {
    if (subjectsByGrade[gradeId] || !token) return;

    try {
      setLoadingSubjects(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${GRADES_API}/subjects/${gradeId}`, config);
      const subjects = res.data.data || [];
      setSubjectsByGrade((prev) => ({ ...prev, [gradeId]: subjects }));
      console.log(`Subjects for Grade ${gradeId}:`, subjects);
    } catch (err) {
      console.error(`Failed to fetch subjects for grade ${gradeId}:`, err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ───── Safe children ─────
  const children = user?.children ?? [];

  // ───── Current Child & Setup ─────
  const currentChild =
    userType === "parent" ? children[activeChildIndex] : null;
  const currentSetup = currentChild ? childSetups[currentChild._id] : null;

  const updateChildSetup = (field: keyof ChildSetup, value: any) => {
    if (!currentChild) return;
    setChildSetups((prev) => ({
      ...prev,
      [currentChild._id]: {
        ...prev[currentChild._id],
        childId: currentChild._id,
        [field]: value,
      },
    }));
  };

  const toggleChildSubject = (subjectId: string) => {
    const current = currentSetup?.subjects || [];
    const updated = current.includes(subjectId)
      ? current.filter((s) => s !== subjectId)
      : [...current, subjectId];
    updateChildSetup("subjects", updated);
  };

  // ───── Student Final Class ─────
  const finalStudentClass = isStudentCustom
    ? `custom:${studentCustomClass.trim()}`
    : studentClass;

  // ───── Current Grade Subjects ─────
  const currentGradeId = currentSetup?.class || studentClass;
  const currentSubjects = currentGradeId
    ? subjectsByGrade[currentGradeId] || []
    : [];

  useEffect(() => {
    if (currentGradeId && !isStudentCustom && token) {
      fetchSubjectsForGrade(currentGradeId);
    }
  }, [currentGradeId, isStudentCustom, token]);

  // ───── Filtered Subjects ─────
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return currentSubjects;
    return currentSubjects.filter((s) =>
      `${s.name} ${s.code}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentSubjects, searchQuery]);

  // ───── All Children Filled? ─────
  const allChildrenFilled =
    userType === "parent" && children.length > 0
      ? children.every((child) => {
          const setup = childSetups[child._id];
          return setup && setup.class && setup.subjects?.length > 0;
        })
      : false;

  const hasMultipleChildren = children.length > 1;

  // ───── Build Student Details (IDs only) ─────
  const buildStudentDetails = (): StudentDetail[] => {
    return children.map((child) => {
      const setup = childSetups[child._id];
      return {
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        class: setup?.class || "",
        subjects: setup?.subjects || [],
      };
    });
  };

  // ───── Submit: Parent ─────
  const handleParentSubmit = async () => {
    if (!allChildrenFilled || !token) return;
    setIsSubmitting(true);
    setError("");

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const updatePromises = Object.entries(childSetups).map(
        async ([childId, setup]) => {
          const payload = { class: setup.class, subjects: setup.subjects };
          console.log(`Updating child ${childId}:`, payload);
          const response = await axios.put(
            `${API_BASE}/update/student/${childId}`,
            payload,
            config
          );
          return response.data;
        }
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every((r) => r?.success === true);

      if (allSuccess) {
        const studentDetails = buildStudentDetails();
        console.log("All children updated. Sending to Pricing:");
        studentDetails.forEach((s, i) => {
          console.log(`  [${i + 1}] ${s.firstName} ${s.lastName}`);
          console.log(`     ID: ${s._id}`);
          console.log(`     Class ID: ${s.class}`);
          console.log(`     Subject IDs: [${s.subjects.join(", ")}]`);
        });

        navigate("/plans", {
          state: {
            parentId: user?._id,
            studentDetails,
          },
        });
      } else {
        setError("Some updates failed. Check console.");
      }
    } catch (err: any) {
      console.error("Submit error:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───── Submit: Student ─────
  const handleStudentSubmit = async () => {
    if (studentSubjects.length === 0 || !finalStudentClass || !token) return;

    setIsSubmitting(true);
    setError("");

    try {
      const payload = { class: finalStudentClass, subjects: studentSubjects };
      console.log(" STUDENT SUBMIT PAYLOAD (IDs):", payload);

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `${API_BASE}/update/student/${user?._id}`,
        payload,
        config
      );
      console.log("Student update response:", response.data);

      const studentDetail: StudentDetail = {
        _id: user!._id,
        firstName: user!.firstName,
        lastName: user!.lastName,
        class: finalStudentClass,
        subjects: studentSubjects,
      };

      console.log("========================================");
      console.log(" STUDENT SETUP COMPLETE - SENDING IDs ");
      console.log("========================================");
      console.log("Timestamp (WAT):", currentTime);
      console.log("Country: NG");
      console.log("Student Detail (IDs):", studentDetail);

      navigate("/plans", {
        state: {
          parentId: user?.parentId || null,
          studentDetails: [studentDetail],
        },
      });
    } catch (err: any) {
      console.error("Student submit error:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───── Loading Guard ─────
  if (!user || !token || !userType) return null;

  // ───── PARENT FLOW ─────
  if (userType === "parent") {
    return (
      <AuthShell
        width="xl"
        title="Set up your children"
        subtitle="Choose class and subjects for each child"
        badge={<span className="badge-gray"><Book className="w-3.5 h-3.5" /> Parent account</span>}
        showHomeLink={false}
      >
            {error && (
              <div className="mb-6"><AuthNotice tone="error">{error}</AuthNotice></div>
            )}

            {children.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-subtle mb-4" />
                <h3 className="text-lg font-semibold text-primary">
                  No Child Registered
                </h3>
                <p className="text-muted mt-2">
                  Please add a child to continue.
                </p>
                <button
                  onClick={() => navigate("/register-students")}
                  className="btn-primary mt-6"
                >
                  Add Child
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {children.map((child, index) => {
                      const setup = childSetups[child._id];
                      const isFilled =
                        setup && setup.class && setup.subjects?.length > 0;
                      return (
                        <button
                          key={child._id}
                          onClick={() => setActiveChildIndex(index)}
                          disabled={isSubmitting}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                            activeChildIndex === index
                              ? "bg-[var(--color-primary)] text-[var(--color-brand-fg)]"
                              : "bg-surface text-muted hover:text-primary"
                          } ${
                            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {child.firstName}
                          {isFilled && (
                            <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
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
                      Setting up:{" "}
                      <span className="text-muted">
                        {currentChild?.firstName} {currentChild?.lastName}
                      </span>
                    </h2>

                    {/* Grade Picker */}
                    <div>
                      <label className="form-label">
                        Select Class <span className="text-[var(--color-danger)]">*</span>
                      </label>

                      {loadingGrades ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <AnimatePresence mode="wait">
                          {currentSetup?.class?.startsWith("custom") ? (
                            <motion.div
                              key="custom"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <input
                                type="text"
                                placeholder="e.g. Primary 4, Year 7..."
                                value={
                                  currentSetup?.class.replace("custom:", "") ||
                                  ""
                                }
                                onChange={(e) =>
                                  updateChildSetup(
                                    "class",
                                    "custom:" + e.target.value
                                  )
                                }
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 form-input disabled:opacity-50"
                                autoFocus
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="predefined"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <div className="relative">
                                <Select
                                  value={currentSetup?.class || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateChildSetup(
                                      "class",
                                      val === "custom" ? "custom" : val
                                    );
                                  }}
                                  disabled={isSubmitting || loadingGrades}
                                  className="form-select pr-10 disabled:opacity-50"
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Subjects */}
                    <div>
                      <label className="form-label">
                        Select Subjects <span className="text-[var(--color-danger)]">*</span>
                        <span className="text-muted ml-1">
                          ({currentSetup?.subjects?.length || 0} selected)
                        </span>
                      </label>

                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-subtle" />
                        <input
                          type="text"
                          placeholder="Search subjects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={isSubmitting || loadingSubjects}
                          className="form-input pl-10"
                        />
                      </div>

                      {loadingSubjects ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : currentSubjects.length === 0 ? (
                        <p className="text-center text-muted py-4 text-sm">
                          {currentSetup?.class?.startsWith("custom")
                            ? "Custom class: no subjects"
                            : "No subjects for selected class"}
                        </p>
                      ) : (
                        <div className="rounded-2xl bg-surface p-2 max-h-64 overflow-y-auto">
                          <div className="space-y-1">
                            {filteredSubjects.map((subject) => {
                              const isSelected =
                                currentSetup?.subjects?.includes(subject._id) ||
                                false;
                              return (
                                <div
                                  key={subject._id}
                                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-[var(--color-card)] group"
                                  onClick={() =>
                                    !isSubmitting &&
                                    toggleChildSubject(subject._id)
                                  }
                                >
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                                        ${
                                          isSelected
                                            ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                                            : "bg-card border-[var(--color-card-border)] group-hover:border-[var(--color-primary)]"
                                        }`}
                                    >
                                      <motion.svg
                                        initial={{ scale: 0 }}
                                        animate={{ scale: isSelected ? 1 : 0 }}
                                        className="w-4 h-4 text-[var(--color-brand-fg)]"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </motion.svg>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <span
                                      className={`font-medium ${
                                        isSelected
                                          ? "text-primary"
                                          : "text-secondary"
                                      }`}
                                    >
                                      {subject.name}
                                    </span>
                                    <span className="text-xs text-subtle ml-2">
                                      ({subject.code})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {(currentSetup?.subjects?.length || 0) > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 flex flex-wrap gap-2"
                          >
                            {currentSetup?.subjects?.map((subId) => {
                              const sub = currentSubjects.find(
                                (s) => s._id === subId
                              );
                              if (!sub) return null;
                              return (
                                <motion.span
                                  key={subId}
                                  layout
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-brand-fg)] rounded-full text-sm font-medium"
                                >
                                  {sub.name} ({sub.code})
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      !isSubmitting &&
                                        toggleChildSubject(subId);
                                    }}
                                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition"
                                    disabled={isSubmitting}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </motion.span>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={handleParentSubmit}
                      disabled={!allChildrenFilled || isSubmitting}
                      className="btn-primary w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving... ({Object.keys(childSetups).length} children)
                        </>
                      ) : hasMultipleChildren ? (
                        allChildrenFilled ? (
                          "Continue for All"
                        ) : (
                          `Complete all ${children.length} children`
                        )
                      ) : (
                        `Continue for ${currentChild?.firstName}`
                      )}
                    </button>
                  </motion.div>
                </AnimatePresence>
              </>
            )}
      </AuthShell>
    );
  }

  // ───── STUDENT FLOW ─────
  return (
    <AuthShell
      width="lg"
      title="Complete your profile"
      subtitle="First select your class, then your subjects"
      badge={<span className="badge-gray"><Book className="w-3.5 h-3.5" /> Student account</span>}
      showHomeLink={false}
    >
          {error && (
            <div className="mb-6"><AuthNotice tone="error">{error}</AuthNotice></div>
          )}

          {/* Grade Picker */}
          <div className="mb-6">
            <label className="form-label">
              Select Class <span className="text-[var(--color-danger)]">*</span>
            </label>
            {loadingGrades ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="relative">
                <Select
                  value={studentClass}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudentClass(val);
                    setIsStudentCustom(val === "custom");
                  }}
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
            {isStudentCustom && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <input
                  type="text"
                  placeholder="e.g. Primary 4, Year 7..."
                  value={studentCustomClass}
                  onChange={(e) => setStudentCustomClass(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          {/* Subjects */}
          <div>
            <label className="form-label">
              Select Subjects <span className="text-[var(--color-danger)]">*</span>
              <span className="text-muted ml-1">
                ({studentSubjects.length} selected)
              </span>
            </label>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-subtle" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loadingSubjects}
                className="form-input pl-10"
              />
            </div>

            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : currentSubjects.length === 0 ? (
              <p className="text-center text-muted py-4 text-sm">
                {isStudentCustom
                  ? "Custom class: no subjects"
                  : "No subjects for selected class"}
              </p>
            ) : (
              <div className="rounded-2xl bg-surface p-2 max-h-64 overflow-y-auto">
                <div className="space-y-1">
                  {filteredSubjects.map((subject) => {
                    const isSelected = studentSubjects.includes(subject._id);
                    return (
                      <div
                        key={subject._id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-[var(--color-card)] group"
                        onClick={() => {
                          setStudentSubjects((prev) =>
                            prev.includes(subject._id)
                              ? prev.filter((s) => s !== subject._id)
                              : [...prev, subject._id]
                          );
                        }}
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                                  : "bg-card border-[var(--color-card-border)] group-hover:border-[var(--color-primary)]"
                              }`}
                          >
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: isSelected ? 1 : 0 }}
                              className="w-4 h-4 text-[var(--color-brand-fg)]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </motion.svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isSelected
                                ? "text-primary"
                                : "text-secondary"
                            }`}
                          >
                            {subject.name}
                          </span>
                          <span className="text-xs text-subtle ml-2">
                            ({subject.code})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <AnimatePresence>
              {studentSubjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {studentSubjects.map((subId) => {
                    const sub = currentSubjects.find((s) => s._id === subId);
                    if (!sub) return null;
                    return (
                      <motion.span
                        key={subId}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-brand-fg)] rounded-full text-sm font-medium"
                      >
                        {sub.name} ({sub.code})
                        <button
                          type="button"
                          onClick={() => {
                            setStudentSubjects((prev) =>
                              prev.filter((s) => s !== subId)
                            );
                          }}
                          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.span>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleStudentSubmit}
            disabled={
              studentSubjects.length === 0 || !finalStudentClass || isSubmitting
            }
            className="btn-primary mt-8 w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Pricing"
            )}
          </button>
    </AuthShell>
  );
};

export default UserSetup;
