// src/pages/admin/GradesManagement.tsx
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Loader2,
  X,
  Check,
  Lock,
  Layers,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  fetchSubjectsByGrade,
} from "../../../Redux/Slices/grades.slice";
import { useToast } from "../../../Context/ToastProvider";
import { getUserType } from "../../../utils/userType";

// --- Assuming ToastType is defined elsewhere (e.g., in Context/ToastProvider.tsx) ---
type ToastType = "success" | "error" | "info" | "warning";

/**
 * @interface ToastContextType
 * Defines the structure for the Toast Context or Hook.
 */
export interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}
// ---------------------------------------------------------------------------------

// Define the primary color variables for easy adjustment
const PRIMARY_COLOR = "#0077B6"; // Ocean Blue
const PRIMARY_LIGHT = "#0077B61A"; // 10% opacity for light backgrounds

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

  // Local state only — NO useSelector
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsCache, setSubjectsCache] = useState<Record<string, Subject[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Load all grades
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchGrades()).unwrap();
        setGrades(result || []);
      } catch {
        addToast("error", "Failed to load grades"); // Updated to use type/message
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch]);

  // Load subjects for a grade (cached)
  const loadSubjects = async (gradeId: string) => {
    if (subjectsCache[gradeId]) return;
    try {
      const result = await dispatch(fetchSubjectsByGrade(gradeId)).unwrap();
      setSubjectsCache((p) => ({ ...p, [gradeId]: result || [] }));
    } catch {
      addToast("error", "Failed to load subjects"); // Updated to use type/message
    }
  };

  const openView = async (grade: Grade) => {
    setSelectedGrade(grade);
    setSubjectSearch("");
    await loadSubjects(grade._id);
    setIsViewOpen(true);
  };

  const openEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setFormData({ title: grade.title, description: grade.description || "" });
    setIsEditOpen(true);
  };

  const openDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return addToast("error", "Title is required"); // Updated to use type/message

    try {
      const newGrade = await dispatch(createGrade(formData)).unwrap();
      setGrades((p) => [...p, newGrade]);
      addToast("success", "Grade created!"); // Updated to use type/message
      setIsAddOpen(false);
      setFormData({ title: "", description: "" });
    } catch {
      addToast("error", "Failed to create grade"); // Updated to use type/message
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !formData.title.trim()) return;

    try {
      const updated = await dispatch(
        updateGrade({ id: selectedGrade._id, data: formData })
      ).unwrap();
      setGrades((p) =>
        p.map((g) => (g._id === selectedGrade._id ? updated : g))
      );
      addToast("success", "Grade updated!"); // Updated to use type/message
      setIsEditOpen(false);
    } catch {
      addToast("error", "Failed to update grade"); // Updated to use type/message
    }
  };

  const handleDelete = async () => {
    if (!selectedGrade) return;
    try {
      await dispatch(deleteGrade(selectedGrade._id)).unwrap();
      setGrades((p) => p.filter((g) => g._id !== selectedGrade._id));
      setSubjectsCache((p) => {
        const { [selectedGrade._id]: _, ...rest } = p;
        return rest;
      });
      addToast("success", "Grade deleted"); // Updated to use type/message
      setIsDeleteOpen(false);
      setSelectedGrade(null);
    } catch {
      addToast("error", "Failed to delete grade"); // Updated to use type/message
    }
  };

  // Filtered grades
  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) return grades;
    const q = searchQuery.toLowerCase();
    return grades.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
    );
  }, [grades, searchQuery]);

  // Current subjects (from cache)
  const currentSubjects = selectedGrade
    ? subjectsCache[selectedGrade._id] || []
    : [];
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return currentSubjects;
    const q = subjectSearch.toLowerCase();
    return currentSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [currentSubjects, subjectSearch]);

  const getSubjectCount = (gradeId: string) =>
    subjectsCache[gradeId]?.length || 0;

  return (
    <>
      <section className="relative bg-white min-h-screen py-10 md:py-16 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="mb-6 mt-4">
              {/* Icon replaced yellow with blue accent */}
              <div
                className="rounded-full p-3 mb-3 inline-flex items-center justify-center"
                style={{ backgroundColor: PRIMARY_LIGHT }}
              >
                <Layers className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                Manage Grade Levels
              </h1>
              <p className="text-gray-600 text-base max-w-3xl">
                Define and organize academic levels within your institution.
              </p>
            </div>
          </motion.div>

          {/* Controls: Search & Add */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            {/* Search Input (Simplified styling) */}
            <div className="relative w-full sm:w-80">
              {/* Simplified vertical alignment */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search grades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6]/50 outline-none text-sm transition-colors"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setFormData({ title: "", description: "" });
                  setIsAddOpen(true);
                }}
                className="px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
                style={{ backgroundColor: PRIMARY_COLOR, color: "white" }}
              >
                <Plus className="w-4 h-4" /> Add New Grade
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: PRIMARY_COLOR }}
              />
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700">
                No Grades Found
              </h3>
              <p className="text-gray-500 mt-2">
                {isAdmin
                  ? "Click 'Add New Grade' to begin."
                  : "Check back later."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredGrades.map((grade, i) => (
                  <motion.div
                    key={grade._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 hover:border-[#0077B6] hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="p-5 flex flex-col justify-between h-full">
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                          {grade.title}
                        </h3>
                        {grade.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {grade.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          {getSubjectCount(grade._id)} subjects
                        </span>

                        <button
                          onClick={() => openView(grade)}
                          className="text-sm font-semibold text-[#0077B6] flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons (Admin) */}
                    {isAdmin && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openView(grade);
                          }}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                        >
                          <BookOpen className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(grade);
                          }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDelete(grade);
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-full transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                    {/* Lock Icon (Non-Admin) */}
                    {!isAdmin && (
                      <div className="absolute top-4 right-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* MODALS: All modals refactored with cleaner styling and new color */}
      <Modal
        title="Add New Grade"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
            primaryColor={PRIMARY_COLOR}
          />
          <Textarea
            label="Description (Optional)"
            rows={3}
            value={formData.description}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            primaryColor={PRIMARY_COLOR}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Check className="w-4 h-4" /> Create Grade
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Edit Grade"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
            primaryColor={PRIMARY_COLOR}
          />
          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e: any) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            primaryColor={PRIMARY_COLOR}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Check className="w-4 h-4" /> Update Grade
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete Grade?"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">
            Delete "{selectedGrade?.title}"?
          </h3>
          <p className="text-gray-600 mt-2">
            This action cannot be undone. All related data will be removed.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Subjects — ${selectedGrade?.title || ""}`}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      >
        <div className="space-y-5">
          <div className="relative">
            {/* Simplified search bar styling */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0077B6] outline-none text-sm transition-colors"
            />
          </div>

          {filteredSubjects.length === 0 ? (
            <p className="text-center text-gray-500 py-10 border border-dashed border-gray-200 rounded-lg">
              No subjects found for this grade.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 text-base">
                      {subject.name}
                    </h4>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full ml-4 flex-shrink-0">
                      {subject.code}
                    </span>
                  </div>
                  {subject.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {subject.description}
                    </p>
                  )}
                  {subject.teachers?.length ? (
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-medium text-gray-700">
                        Teachers:
                      </span>{" "}
                      {subject.teachers
                        .map((t) => `${t.firstName} ${t.lastName}`)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      No teachers assigned.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

// --- Reusable Modal and Input Components (Refactored) ---

const Modal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </motion.div>
    </div>
  );
};

// Input Component (Accepts primaryColor prop for dynamic focus)
const Input = ({ label, primaryColor, ...props }: any) => (
  <div>
    <label className="block text-gray-800 font-semibold text-sm mb-1">
      {label}
    </label>
    <input
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-sm transition-colors"
      style={{ focusBorderColor: primaryColor }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = primaryColor;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#D1D5DB"; // gray-300
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  </div>
);

// Textarea Component (Accepts primaryColor prop for dynamic focus)
const Textarea = ({ label, primaryColor, ...props }: any) => (
  <div>
    <label className="block text-gray-800 font-semibold text-sm mb-1">
      {label}
    </label>
    <textarea
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-sm resize-none transition-colors"
      style={{ focusBorderColor: primaryColor }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = primaryColor;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#D1D5DB"; // gray-300
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  </div>
);

export default GradesManagement;
