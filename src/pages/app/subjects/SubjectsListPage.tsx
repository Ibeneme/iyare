import Select from "../../../components/ui/Select";
import { getCookie } from "../../../utils/cookies";
import React, {
  useEffect,
  useState,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  Check,
  AlertCircle,
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../../store/features/subjects/subjects.slice";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
import { useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";

const GRADES_API = `${BASE_URL}/api/grades/grades`;
const TEACHERS_API = `${BASE_URL}/api/grades/grades/teachers/all`;

/* ------------------------------------------------- Types ------------------------------------------------- */

interface Grade {
  _id: string;
  title: string;
  description: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

type SubjectForm = {
  name: string;
  code: string;
  description: string;
  gradeLevel: string;
  isActive: boolean;
  teachers: string[];
};

type Subject = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevelTitle?: string;
  gradeLevelId: string;
  isActive: boolean;
  teachers: Array<{ _id: string; firstName: string; lastName: string }>;
  children: any[];
  classes: any[];
  createdAt: string;
  updatedAt: string;
};

type ViewLayout = "ledger" | "grades";

/* ------------------------------------------------- Component ------------------------------------------------- */

export default function SubjectsManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = getCookie("token") || "";
  const userType = getUserType();
  const isAdmin = userType === "admin";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewLayout, setViewLayout] = useState<ViewLayout>("ledger");
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<SubjectForm>({
    name: "",
    code: "",
    description: "",
    gradeLevel: "",
    isActive: true,
    teachers: [],
  });

  /* ---------- Load Subjects ---------- */
  const loadSubjects = useCallback(() => {
    setLoading(true);
    setError(null);
    dispatch(fetchSubjects())
      .unwrap()
      .then((subjectsFromApi: any[]) => {
        const normalized: Subject[] = subjectsFromApi.map((s) => {
          const primaryGrade = s.gradeLevel?.[0] || s.grades?.[0];

          return {
            _id: s._id,
            name: s.name,
            code: s.code,
            description: s.description,
            gradeLevelTitle: primaryGrade?.title ?? "—",
            gradeLevelId: primaryGrade?._id || primaryGrade?.id || "",
            isActive: s.isActive,
            teachers: s.teachers ?? [],
            children: s.children ?? [],
            classes: s.classes ?? [],
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          };
        });
        setSubjects(normalized);
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load subjects";
        setError(msg);
        toast.error(msg);
        setLoading(false);
      });
  }, [dispatch]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  /* ---------- Load Grades ---------- */
  useEffect(() => {
    if (!token) {
      setLoadingGrades(false);
      return;
    }
    const fetchGrades = async () => {
      try {
        setLoadingGrades(true);
        const res = await axios.get(GRADES_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = res.data.data || res.data || [];
        setGrades(fetched);
      } catch (err: any) {
        const msg =
          err.response?.data?.message || "Failed to load grade levels";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [token]);

  /* ---------- Load Teachers ---------- */
  useEffect(() => {
    if (!token) {
      setLoadingTeachers(false);
      return;
    }
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await axios.get(TEACHERS_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = res.data.data || res.data || [];
        setTeachers(fetched);
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to load teachers";
        toast.error(msg);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, [token]);

  /* ---------- Sync Form when Editing ---------- */
  useEffect(() => {
    if (editingSubject) {
      setForm({
        name: editingSubject.name,
        code: editingSubject.code,
        description: editingSubject.description ?? "",
        gradeLevel: editingSubject.gradeLevelId,
        isActive: editingSubject.isActive,
        teachers: editingSubject.teachers.map((t) => t._id),
      });
    } else {
      setForm({
        name: "",
        code: "",
        description: "",
        gradeLevel: "",
        isActive: true,
        teachers: [],
      });
    }
    setFormStep(1);
  }, [editingSubject]);

  /* ---------- Handlers ---------- */
  const openAddEdit = (subject?: Subject) => {
    setEditingSubject(subject ?? null);
    setFormStep(1);
    setIsAddEditOpen(true);
  };

  const closeAddEdit = () => {
    setIsAddEditOpen(false);
    setEditingSubject(null);
    setSubmitted(false);
    setFormLoading(false);
    setTeacherDropdownOpen(false);
    setFormStep(1);
  };

  const openDetails = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedSubject(null);
  };

  const openDeleteConfirm = (id: string) => {
    setSubjectToDelete(id);
    setIsDeleteOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteOpen(false);
    setSubjectToDelete(null);
  };

  const handleChange = (
    e:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | any,
  ) => {
    const { name, value } = e.target;
    if (!name) return;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleActiveToggle = () => {
    setForm((p) => ({ ...p, isActive: !p.isActive }));
  };

  const toggleTeacher = (teacherId: string) => {
    setForm((prev) => ({
      ...prev,
      teachers: prev.teachers.includes(teacherId)
        ? prev.teachers.filter((id) => id !== teacherId)
        : [...prev.teachers, teacherId],
    }));
  };

  const goToStep2 = () => {
    setSubmitted(true);
    if (!form.name || !form.code || !form.gradeLevel) return;
    setSubmitted(false);
    setFormStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name || !form.code || !form.gradeLevel) {
      setFormStep(1);
      return;
    }
    setFormLoading(true);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      gradeLevel: [form.gradeLevel],
      teachers: form.teachers,
      isActive: form.isActive,
    };

    const action = editingSubject
      ? updateSubject({ id: editingSubject._id, data: payload as any })
      : createSubject(payload as any);

    try {
      const result: any = await dispatch(action as any).unwrap();
      const normalizedResult = {
        ...result,
        gradeLevelTitle:
          grades.find((g) => g._id === result.gradeLevel?.[0])?.title ?? "—",
        gradeLevelId: result.gradeLevel?.[0] ?? "",
        teachers: result.teachers || [],
      };

      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) =>
            s._id === editingSubject._id ? normalizedResult : s,
          ),
        );
        toast.success("Subject updated!");
      } else {
        setSubjects((prev) => [...prev, normalizedResult]);
        toast.success("Subject created!");
      }
      closeAddEdit();
    } catch (err: any) {
      const msg = err || "Operation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteSubject(subjectToDelete)).unwrap();
      setSubjects((prev) => prev.filter((s) => s._id !== subjectToDelete));
      toast.success("Subject deleted");
    } catch (err: any) {
      const msg = err?.message || "Delete failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
      closeDeleteConfirm();
    }
  };

  const filteredSubjects = React.useMemo(() => {
    let result = subjects;
    if (selectedGrade) {
      result = result.filter((s) => s.gradeLevelId === selectedGrade);
    }
    const term = search?.trim()?.toLowerCase();
    if (term) {
      result = result.filter((s) => {
        const name = s.name?.toLowerCase() ?? "";
        const code = s.code?.toLowerCase() ?? "";
        const grade = s.gradeLevelTitle?.toLowerCase() ?? "";
        return (
          name.includes(term) || code.includes(term) || grade.includes(term)
        );
      });
    }
    return result;
  }, [subjects, selectedGrade, search]);

  const groupedByGrade = React.useMemo(() => {
    const map = new Map<string, { title: string; items: Subject[] }>();
    for (const subj of filteredSubjects) {
      const key = subj.gradeLevelId || "unassigned";
      const label =
        subj.gradeLevelTitle && subj.gradeLevelTitle !== "—"
          ? subj.gradeLevelTitle
          : "General / Unassigned grade";
      if (!map.has(key)) {
        map.set(key, { title: label, items: [] });
      }
      map.get(key)!.items.push(subj);
    }
    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));
  }, [filteredSubjects]);

  const resetFilters = () => {
    setSearch("");
    setSelectedGrade("");
  };

  const getEmptyMessage = () => {
    if (search && selectedGrade) {
      return "No subjects match both your search and selected grade level.";
    }
    if (search) return "No subjects match your search query.";
    if (selectedGrade) {
      return "No subjects are assigned to this grade level yet.";
    }
    return "No subjects are available yet.";
  };

  const isInitialLoading = loading || loadingGrades || loadingTeachers;

  const renderSubjectActions = (subject: Subject) => (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => openDetails(subject)}
        className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
      >
        <Eye size={13} />
        <span>Syllabus</span>
      </button>
      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => openAddEdit(subject)}
            aria-label={`Edit ${subject.name}`}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteConfirm(subject._id)}
            aria-label={`Delete ${subject.name}`}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow={isAdmin ? "Admin" : "Curriculum"}
        title="Subjects & modules"
        highlight="modules"
        subtitle="Browse subjects by grade level, view assigned teachers, and open course details."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewLayout("ledger")}
                className={`btn !min-h-0 !py-1.5 !px-3 text-xs ${
                  viewLayout === "ledger" ? "btn-primary" : "btn-secondary"
                }`}
              >
                All subjects
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("grades")}
                className={`btn !min-h-0 !py-1.5 !px-3 text-xs ${
                  viewLayout === "grades" ? "btn-primary" : "btn-secondary"
                }`}
              >
                By grade
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => openAddEdit()}
                className="btn btn-primary inline-flex items-center gap-1.5"
              >
                <Plus size={16} /> Add subject
              </button>
            )}
          </div>
        }
      />

      {error && subjects.length === 0 && !isInitialLoading && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadSubjects}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      <Panel
        title={
          isInitialLoading
            ? "Subjects"
            : `Subjects (${filteredSubjects.length}${
                search || selectedGrade ? ` of ${subjects.length}` : ""
              })`
        }
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search subject, code, grade…"
                aria-label="Search subjects"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="form-input w-full !min-h-0 !py-1.5 text-sm"
              >
                <option value="">All grade levels</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </Select>
            </div>

            {(search || selectedGrade) && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs"
              >
                Reset
              </button>
            )}
          </div>
        }
      >
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading subjects…</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState title="No subjects found" text={getEmptyMessage()} />
        ) : viewLayout === "ledger" ? (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[var(--color-card-border)]">
              {filteredSubjects.map((subject) => {
                const teachersLabel =
                  subject.teachers.length > 0
                    ? subject.teachers
                        .map((t) => `${t.firstName} ${t.lastName}`.trim())
                        .join(", ")
                    : "Unassigned";

                return (
                  <div
                    key={subject._id}
                    className="py-3.5 first:pt-1 last:pb-1 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-primary)] break-words">
                          {subject.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          {subject.code}
                          {subject.gradeLevelTitle &&
                          subject.gradeLevelTitle !== "—"
                            ? ` · ${subject.gradeLevelTitle}`
                            : ""}
                        </p>
                      </div>
                      <StatusPill
                        status={subject.isActive ? "active" : "inactive"}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={teachersLabel} size={26} />
                        <span className="text-xs text-[var(--color-muted)] truncate">
                          {teachersLabel}
                        </span>
                      </div>
                      {renderSubjectActions(subject)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 px-4">Grade</th>
                    <th className="py-2 px-4">Teachers</th>
                    <th className="py-2 px-4 whitespace-nowrap">Students</th>
                    <th className="py-2 px-4 whitespace-nowrap">Status</th>
                    <th className="py-2 pl-4 whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-card-border)]">
                  {filteredSubjects.map((subject) => {
                    const teachersLabel =
                      subject.teachers.length > 0
                        ? subject.teachers
                            .map((t) => `${t.firstName} ${t.lastName}`.trim())
                            .join(", ")
                        : "Unassigned";

                    return (
                      <tr key={subject._id}>
                        <td className="py-3 pr-4">
                          <div className="leading-tight">
                            <div className="font-medium text-[var(--color-primary)]">
                              {subject.name}
                            </div>
                            <div className="text-xs text-[var(--color-muted)] mt-0.5">
                              {subject.code}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[var(--color-muted)]">
                          {subject.gradeLevelTitle}
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-2 align-middle">
                            <Avatar name={teachersLabel} size={26} />
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[200px]">
                              {teachersLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[var(--color-muted)]">
                          {subject.children.length}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusPill
                            status={subject.isActive ? "active" : "inactive"}
                          />
                        </td>
                        <td className="py-3 pl-4 whitespace-nowrap text-right">
                          {renderSubjectActions(subject)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="divide-y divide-[var(--color-card-border)]">
            {groupedByGrade.map((group, idx) => (
              <section
                key={group.key}
                className={`space-y-3 ${
                  idx === 0
                    ? "pb-5"
                    : idx === groupedByGrade.length - 1
                      ? "pt-5"
                      : "py-5"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--color-primary)]">
                      {group.title}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)]">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "subject" : "subjects"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--row-bg)] divide-y divide-[var(--color-card-border)] px-4">
                  {group.items.map((subject) => (
                    <div
                      key={subject._id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-[var(--color-primary)]">
                            {subject.name}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-muted)]">
                            {subject.code}
                          </span>
                          <StatusPill
                            status={subject.isActive ? "active" : "inactive"}
                          />
                        </div>
                        {subject.description && (
                          <p className="text-xs text-[var(--color-muted)] truncate">
                            {subject.description}
                          </p>
                        )}
                      </div>

                      {renderSubjectActions(subject)}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Panel>

      {/* ==================== DETAILS MODAL ==================== */}
      <AnimatePresence>
        {isDetailsOpen && selectedSubject && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetails}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] truncate">
                      {selectedSubject.name}
                    </h3>
                    <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] shrink-0">
                      {selectedSubject.code}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Subject details and syllabus overview
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close subject details"
                  className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-4 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)]">
                    <span className="form-label block mb-0.5">Grade level</span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {selectedSubject.gradeLevelTitle}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] flex items-center justify-between">
                    <div>
                      <span className="form-label block mb-0.5">Status</span>
                      <StatusPill
                        status={
                          selectedSubject.isActive ? "active" : "inactive"
                        }
                      />
                    </div>
                    <div className="text-right">
                      <span className="form-label block mb-0.5">Students</span>
                      <span className="font-medium text-[var(--color-primary)]">
                        {selectedSubject.children.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)]">
                  <span className="form-label block mb-1">Teachers</span>
                  <span className="font-medium text-[var(--color-primary)]">
                    {selectedSubject.teachers.length > 0
                      ? selectedSubject.teachers
                          .map((t) => `${t.firstName} ${t.lastName}`.trim())
                          .join(", ")
                      : "Unassigned"}
                  </span>
                </div>

                <div>
                  <span className="form-label block mb-1.5">
                    Syllabus overview
                  </span>
                  <div className="p-4 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] max-h-56 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--color-primary)]">
                    {selectedSubject.description ||
                      "No syllabus overview has been provided for this subject."}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6 border-t border-[var(--color-card-border)] bg-[var(--row-bg)]/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="btn btn-secondary justify-center"
                >
                  Close
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedSubject;
                      closeDetails();
                      openAddEdit(target);
                    }}
                    className="btn btn-secondary justify-center"
                  >
                    Edit subject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedSubject._id;
                    closeDetails();
                    navigate(`/app/subjects/${id}`);
                  }}
                  className="btn btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Eye size={15} /> Open subject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== ADD / EDIT MODAL (2 STEPS) ==================== */}
      <AnimatePresence>
        {isAddEditOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddEdit}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--color-primary)]">
                    {editingSubject ? "Edit subject" : "New subject"}
                  </h2>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Step {formStep} of 2
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddEdit}
                  aria-label="Close modal"
                  className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4"
              >
                {formStep === 1 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="form-label block">Subject title</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="form-input w-full"
                        placeholder="e.g. Further Mathematics"
                      />
                      {submitted && !form.name && (
                        <p className="text-[var(--color-danger)] text-xs font-medium">
                          Title is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="form-label block">Subject code</label>
                      <input
                        type="text"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        required
                        className="form-input w-full"
                        placeholder="MTH201"
                      />
                      {submitted && !form.code && (
                        <p className="text-[var(--color-danger)] text-xs font-medium">
                          Code is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="form-label block">Grade level</label>
                      <Select
                        name="gradeLevel"
                        value={form.gradeLevel}
                        onChange={handleChange}
                        required
                        className="form-input w-full"
                      >
                        <option value="">Select grade</option>
                        {grades.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.title}
                          </option>
                        ))}
                      </Select>
                      {submitted && !form.gradeLevel && (
                        <p className="text-[var(--color-danger)] text-xs font-medium">
                          Grade level is required
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={closeAddEdit}
                        className="btn btn-secondary flex-1 justify-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={goToStep2}
                        className="btn btn-primary flex-1 justify-center inline-flex items-center gap-1.5"
                      >
                        <span>Next</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </>
                )}

                {formStep === 2 && (
                  <>
                    <div className="relative space-y-1.5">
                      <label className="form-label block">
                        Assign teachers
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTeacherDropdownOpen(!teacherDropdownOpen)
                        }
                        className="form-input w-full flex justify-between items-center text-left"
                      >
                        <span
                          className={
                            form.teachers.length === 0
                              ? "text-[var(--color-muted)]"
                              : "text-[var(--color-primary)]"
                          }
                        >
                          {form.teachers.length === 0
                            ? "Select teachers…"
                            : `${form.teachers.length} teacher${
                                form.teachers.length === 1 ? "" : "s"
                              } selected`}
                        </span>
                        <ChevronDown
                          size={16}
                          className="text-[var(--color-muted)]"
                        />
                      </button>

                      {teacherDropdownOpen && (
                        <div className="mt-1.5 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl max-h-44 overflow-y-auto divide-y divide-[var(--color-card-border)]">
                          {teachers.map((teacher) => {
                            const isSelected = form.teachers.includes(
                              teacher._id,
                            );
                            return (
                              <button
                                key={teacher._id}
                                type="button"
                                onClick={() => toggleTeacher(teacher._id)}
                                className={`w-full flex items-center justify-between gap-2 p-2.5 text-left text-xs font-medium transition-colors ${
                                  isSelected
                                    ? "bg-[var(--row-bg)] text-[var(--color-primary)]"
                                    : "text-[var(--color-primary)] hover:bg-[var(--row-bg)]/60"
                                }`}
                              >
                                <span>
                                  {teacher.firstName} {teacher.lastName}
                                </span>
                                {isSelected && <Check size={14} />}
                              </button>
                            );
                          })}
                          {teachers.length === 0 && (
                            <p className="text-xs text-[var(--color-muted)] p-3 text-center">
                              No teachers available
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="form-label block">Syllabus notes</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="form-input w-full resize-none"
                        placeholder="Topics covered, prerequisites, or notes…"
                      />
                    </div>

                    <label className="inline-flex items-center gap-2.5 text-sm cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={handleActiveToggle}
                      />
                      <span className="font-medium text-[var(--color-primary)]">
                        Active in catalog
                      </span>
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="btn btn-secondary flex-1 justify-center"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="btn btn-primary flex-1 justify-center inline-flex items-center gap-2"
                      >
                        {formLoading ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : editingSubject ? (
                          <Check size={15} />
                        ) : (
                          <Plus size={15} />
                        )}
                        <span>
                          {editingSubject ? "Save changes" : "Create subject"}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteConfirm}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-md p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                  Delete subject?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This action is permanent and will remove this subject.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {deleting && <Loader2 className="animate-spin" size={15} />}
                  <span>Delete subject</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
