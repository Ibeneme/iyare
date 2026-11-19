import { useNavigate } from "react-router-dom";
import { PATHS, buildPath } from "../../../routes/paths";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  User,
  Lock,
  Layers,
  Search,
  AlertTriangle,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import {
  fetchGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  fetchSubjectsByGrade,
} from "../../../store/features/grades/grades.slice";
import { useToast } from "../../../contexts/ToastContext";
import { getUserType } from "../../../utils/userType";
import { PageHeader, Panel, EmptyState, Avatar } from "../../../components/ui";

type ToastType = "success" | "error" | "info" | "warning";

export interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

interface Grade {
  _id: string;
  title: string;
  description?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  teachers?: { firstName: string; lastName: string }[];
}

const GradesManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();
  const userType = getUserType();
  const isAdmin = userType === "admin";
  const navigate = useNavigate();

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsCache, setSubjectsCache] = useState<Record<string, Subject[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchGrades()).unwrap();
        setGrades(result || []);
      } catch {
        addToast("error", "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSubjects = async (gradeId: string) => {
    if (subjectsCache[gradeId]) return;
    try {
      const result = await dispatch(fetchSubjectsByGrade(gradeId)).unwrap();
      setSubjectsCache((p) => ({ ...p, [gradeId]: result || [] }));
    } catch {
      addToast("error", "Failed to load subjects");
    }
  };

  const openView = async (grade: Grade) => {
    setSelectedGrade(grade);
    setSubjectSearch("");
    await loadSubjects(grade._id);
    setIsViewOpen(true);
  };

  const openDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return addToast("error", "Title is required");
    try {
      const newGrade = await dispatch(createGrade(formData)).unwrap();
      setGrades((p) => [...p, newGrade]);
      addToast("success", "Grade created!");
      setIsAddOpen(false);
      setFormData({ title: "", description: "" });
    } catch {
      addToast("error", "Failed to create grade");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !formData.title.trim()) return;
    try {
      const updated = await dispatch(
        updateGrade({ id: selectedGrade._id, data: formData }),
      ).unwrap();
      setGrades((p) =>
        p.map((g) => (g._id === selectedGrade._id ? updated : g)),
      );
      addToast("success", "Grade updated!");
      setIsEditOpen(false);
    } catch {
      addToast("error", "Failed to update grade");
    }
  };

  const handleDelete = async () => {
    if (!selectedGrade) return;
    try {
      await dispatch(deleteGrade(selectedGrade._id)).unwrap();
      setGrades((p) => p.filter((g) => g._id !== selectedGrade._id));
      setSelectedIds((p) => p.filter((id) => id !== selectedGrade._id));
      setSubjectsCache((p) => {
        const { [selectedGrade._id]: _, ...rest } = p;
        return rest;
      });
      addToast("success", "Grade deleted");
      setIsDeleteOpen(false);
      setSelectedGrade(null);
    } catch {
      addToast("error", "Failed to delete grade");
    }
  };

  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) return grades;
    const q = searchQuery.toLowerCase();
    return grades.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q),
    );
  }, [grades, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const allVisibleSelected =
    filteredGrades.length > 0 &&
    filteredGrades.every((g) => selectedIds.includes(g._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredGrades.map((g) => g._id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedIds((prev) => {
        const merged = new Set([...prev, ...filteredGrades.map((g) => g._id)]);
        return Array.from(merged);
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);

    const targetIds = [...selectedIds];
    const results = await Promise.allSettled(
      targetIds.map((id) => dispatch(deleteGrade(id)).unwrap()),
    );

    const deletedIds: string[] = [];
    let failedCount = 0;

    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        deletedIds.push(targetIds[idx]);
      } else {
        failedCount += 1;
      }
    });

    if (deletedIds.length > 0) {
      const deletedSet = new Set(deletedIds);
      setGrades((prev) => prev.filter((g) => !deletedSet.has(g._id)));
      setSelectedIds((prev) => prev.filter((id) => !deletedSet.has(id)));
      setSubjectsCache((prev) => {
        const next = { ...prev };
        deletedIds.forEach((id) => delete next[id]);
        return next;
      });
      addToast(
        "success",
        `Deleted ${deletedIds.length} level${deletedIds.length === 1 ? "" : "s"}`,
      );
    }

    if (failedCount > 0) {
      addToast(
        "error",
        `Failed to delete ${failedCount} level${failedCount === 1 ? "" : "s"}`,
      );
    }

    setBulkDeleting(false);
    setIsBulkDeleteOpen(false);
  };

  const currentSubjects = selectedGrade
    ? subjectsCache[selectedGrade._id] || []
    : [];

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return currentSubjects;
    const q = subjectSearch.toLowerCase();
    return currentSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
    );
  }, [currentSubjects, subjectSearch]);

  const getSubjectCount = (gradeId: string) =>
    subjectsCache[gradeId]?.length || 0;

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow={isAdmin ? "Admin" : "Curriculum"}
        title="Grades & levels"
        highlight="levels"
        subtitle={
          isAdmin
            ? "Organize and manage academic levels and their subjects."
            : "Browse academic levels and their assigned subjects."
        }
        actions={
          isAdmin ? (
            <button
              type="button"
              onClick={() => navigate(PATHS.gradeNew)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add level
            </button>
          ) : undefined
        }
      />

      <Panel
        title={
          loading
            ? "All levels"
            : `All levels (${filteredGrades.length}${
                searchQuery.trim() ? ` of ${grades.length}` : ""
              })`
        }
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search levels…"
                aria-label="Search levels"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
              />
            </div>

            {isAdmin && filteredGrades.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                  {allVisibleSelected ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                  <span>{allVisibleSelected ? "Unmark all" : "Mark all"}</span>
                </button>

                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs"
                    >
                      Clear ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteOpen(true)}
                      className="btn btn-danger !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Delete ({selectedIds.length})</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading levels…</p>
          </div>
        ) : filteredGrades.length === 0 ? (
          <EmptyState
            title="No levels found"
            text={
              searchQuery.trim()
                ? "Try clearing your search query to see all levels."
                : "No academic levels have been created yet."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrades.map((grade) => {
              const isChecked = selectedIds.includes(grade._id);
              const subjectCount = getSubjectCount(grade._id);

              return (
                <div
                  key={grade._id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between bg-[var(--color-card)] transition-colors ${
                    isChecked
                      ? "border-[var(--color-primary)] bg-[var(--row-bg)]/60"
                      : "border-[var(--color-card-border)]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleSelect(grade._id)}
                            aria-label={
                              isChecked
                                ? `Unmark ${grade.title}`
                                : `Mark ${grade.title}`
                            }
                            aria-pressed={isChecked}
                            className="p-1.5 rounded-lg bg-[var(--row-bg)] text-[var(--color-primary)] hover:opacity-80 transition-opacity shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare size={15} />
                            ) : (
                              <Square
                                size={15}
                                className="text-[var(--color-muted)]"
                              />
                            )}
                          </button>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] font-medium">
                          <Layers size={12} />
                          <span>Level</span>
                        </span>
                      </div>

                      {isAdmin ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                buildPath(PATHS.gradeEdit, { id: grade._id }),
                              )
                            }
                            aria-label="Edit level"
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(grade)}
                            aria-label="Delete level"
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <Lock
                          size={14}
                          className="text-[var(--color-muted)] shrink-0"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-base text-[var(--color-primary)] leading-snug">
                        {grade.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {grade.description ||
                          "No description provided for this level."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-card-border)] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[var(--color-muted)] font-medium">
                      {subjectCount}{" "}
                      {subjectCount === 1 ? "subject" : "subjects"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openView(grade)}
                      className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                    >
                      <span>Subjects</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ADD MODAL */}
      <Modal
        title="Add level"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Level title"
            value={formData.title}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
            placeholder="e.g. Grade 10"
          />
          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Briefly describe this academic tier…"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 justify-center"
            >
              Create level
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        title="Edit level"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Level title"
            value={formData.title}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="btn btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 justify-center"
            >
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* SINGLE DELETE */}
      <Modal
        title="Delete level"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">
              Delete {selectedGrade?.title}?
            </h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              This action is permanent and will remove associated data.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="btn btn-secondary flex-1 justify-center"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger flex-1 justify-center"
            >
              Yes, delete
            </button>
          </div>
        </div>
      </Modal>

      {/* BULK DELETE */}
      <Modal
        title="Delete selected levels"
        isOpen={isBulkDeleteOpen}
        onClose={() => !bulkDeleting && setIsBulkDeleteOpen(false)}
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">
              Delete {selectedIds.length} level
              {selectedIds.length === 1 ? "" : "s"}?
            </h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              This action is permanent and will remove all selected levels.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(false)}
              disabled={bulkDeleting}
              className="btn btn-secondary flex-1 justify-center"
            >
              Keep them
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn btn-danger flex-1 inline-flex items-center justify-center gap-2"
            >
              {bulkDeleting && <Loader2 size={15} className="animate-spin" />}
              <span>
                {bulkDeleting
                  ? "Deleting…"
                  : `Yes, delete (${selectedIds.length})`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* VIEW SUBJECTS */}
      <Modal
        title={`Subjects — ${selectedGrade?.title || ""}`}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search subjects…"
              aria-label="Search subjects in level"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="form-input w-full !pl-9 text-sm"
            />
          </div>

          <div className="max-h-96 overflow-y-auto rounded-2xl border border-[var(--color-card-border)] bg-[var(--row-bg)] divide-y divide-[var(--color-card-border)]">
            {filteredSubjects.length === 0 ? (
              <div className="py-10 px-4">
                <EmptyState
                  title="No subjects found"
                  text="No subjects match this level or search query."
                />
              </div>
            ) : (
              filteredSubjects.map((subject) => {
                const teachersLabel = subject.teachers?.length
                  ? subject.teachers
                      .map((t) => `${t.firstName} ${t.lastName}`.trim())
                      .join(", ")
                  : "Unassigned";

                return (
                  <div key={subject._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-[var(--color-primary)]">
                        {subject.name}
                      </h4>
                      {subject.code && (
                        <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-muted)] shrink-0">
                          {subject.code}
                        </span>
                      )}
                    </div>

                    {subject.description && (
                      <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                        {subject.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] pt-0.5">
                      {subject.teachers?.length ? (
                        <Avatar name={teachersLabel} size={20} />
                      ) : (
                        <User size={13} />
                      )}
                      <span className="truncate">{teachersLabel}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// HELPER COMPONENTS
const Modal = ({ title, isOpen, onClose, children }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-primary)]">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="form-label block">{label}</label>
    <input className="form-input w-full" {...props} />
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="form-label block">{label}</label>
    <textarea className="form-input w-full resize-none" {...props} />
  </div>
);

export default GradesManagement;
