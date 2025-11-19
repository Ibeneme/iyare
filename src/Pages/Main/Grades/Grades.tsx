// src/pages/admin/GradesManagement.tsx
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
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
        addToast("Failed to load grades", "error");
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
      addToast("Failed to load subjects", "error");
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
    if (!formData.title.trim()) return addToast("Title is required", "error");

    try {
      const newGrade = await dispatch(createGrade(formData)).unwrap();
      setGrades((p) => [...p, newGrade]);
      addToast("Grade created!", "success");
      setIsAddOpen(false);
      setFormData({ title: "", description: "" });
    } catch {
      addToast("Failed to create grade", "error");
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
      addToast("Grade updated!", "success");
      setIsEditOpen(false);
    } catch {
      addToast("Failed to update grade", "error");
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
      addToast("Grade deleted", "success");
      setIsDeleteOpen(false);
      setSelectedGrade(null);
    } catch {
      addToast("Failed to delete grade", "error");
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

  //bg-gradient-to-b from-[#f5fdf5] to-white
  return (
    <>
      <section className="relative bg-white min-h-screen py-16 overflow-hidden">


        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className=" mb-12"
          >
            <div className="mb-8 mt-4">
              <div className="bg-yellow-200 rounded-full p-4 mb-4 inline-flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-yellow-900" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                Manage Grades
              </h1>
              <p className="text-gray-900/70 text-sm md:text-base max-w-3xl">
                Organize academic levels
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-[#023009]/60" />
              <input
                type="text"
                placeholder="Search grades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/30 focus:border-[#ffd000] outline-none text-sm"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setFormData({ title: "", description: "" });
                  setIsAddOpen(true);
                }}
                className="bg-[#023009] text-white px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#023009]/90 transition-all "
              >
                <Plus className="w-5 h-5" /> Add New Grade
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-[#ffd000]" />
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl ">
              <BookOpen className="w-20 h-20 text-[#ffd000]/30 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#023009]/70">
                No Grades Found
              </h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGrades.map((grade, i) => (
                <motion.div
                  key={grade._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-3xl border-2 border-[#ffd000]/20 hover:border-[#ffd000] transition-all group relative  overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-black text-[#023009] mb-2">
                      {grade.title}
                    </h3>
                    {grade.description && (
                      <p className="text-sm text-[#023009]/70 line-clamp-2">
                        {grade.description}
                      </p>
                    )}
                    <div className="mt-5 flex items-center justify-between">
                      {/* <span className="text-xs font-bold text-[#023009]/70 bg-[#ffd000]/10 px-3 py-1 rounded-full">
                        {getSubjectCount(grade._id)} subjects
                      </span> */}
                      <button
                        onClick={() => openView(grade)}
                        className="text-xs font-bold text-[#023009] flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        View <span className="text-[#ffd000]">→</span>
                      </button>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => openView(grade)}
                        className="p-2 bg-[#ffd000]/10 hover:bg-[#ffd000]/20 rounded-full"
                      >
                        <BookOpen className="w-4 h-4 text-[#023009]" />
                      </button>
                      <button
                        onClick={() => openEdit(grade)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full"
                      >
                        <Edit2 className="w-4 h-4 text-blue-700" />
                      </button>
                      <button
                        onClick={() => openDelete(grade)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-full"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="absolute top-4 right-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODALS — Your Style */}
      <Modal
        title="Add New Grade"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
          <Textarea
            label="Description (Optional)"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#023009] text-white py-3 rounded-xl font-bold hover:bg-[#023009]/90 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Create Grade
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 bg-gray-200 text-[#023009] py-3 rounded-xl font-bold hover:bg-gray-300 transition"
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
            onChange={(e) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
          />
          <div className=" made flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#023009] text-white py-3 rounded-xl font-bold hover:bg-[#023009]/90 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Update Grade
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 bg-gray-200 text-[#023009] py-3 rounded-xl font-bold hover:bg-gray-300 transition"
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
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-[#023009]">
            Delete "{selectedGrade?.title}"?
          </h3>
          <p className="text-[#023009]/70 mt-3">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 bg-gray-200 text-[#023009] py-3 rounded-xl font-bold hover:bg-gray-300"
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
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#ffd000] outline-none text-sm"
            />
          </div>

          {filteredSubjects.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No subjects found</p>
          ) : (
            <div className="space-y-4">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:bg-white hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-[#023009] text-lg">
                      {subject.name}
                    </h4>
                    <span className="text-xs font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                      {subject.code}
                    </span>
                  </div>
                  {subject.description && (
                    <p className="text-sm text-gray-700 mb-3">
                      {subject.description}
                    </p>
                  )}
                  {subject.teachers?.length ? (
                    <p className="text-xs text-gray-500">
                      Teachers:{" "}
                      {subject.teachers
                        .map((t) => `${t.firstName} ${t.lastName}`)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

// Modal & Input Components
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
        className="bg-white rounded-3xl  w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200"
      >
        <div className="p-5 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#023009]" />
            <h2 className="text-2xl font-black text-[#023009]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </motion.div>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="block text-[#023009] font-bold text-sm mb-2">
      {label}
    </label>
    <input
      className="w-full px-4 py-3 rounded-xl border-2 border-[#ffd000]/30 focus:border-[#ffd000] outline-none text-sm"
      {...props}
    />
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div>
    <label className="block text-[#023009] font-bold text-sm mb-2">
      {label}
    </label>
    <textarea
      className="w-full px-4 py-3 rounded-xl border-2 border-[#ffd000]/30 focus:border-[#ffd000] outline-none text-sm resize-none"
      {...props}
    />
  </div>
);

export default GradesManagement;
