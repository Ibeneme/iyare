import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Loader2,
  X,
  User,
  // Check,
  Lock,
  Layers,
  Search,
  AlertTriangle,
  ChevronRight,
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

type ToastType = "success" | "error" | "info" | "warning";

export interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

// // PREMIUM COLOR PALETTE
// const PRIMARY_COLOR = "#064e3b"; // Deep Emerald
// const ACCENT_COLOR = "#fbbf24"; // Amber/Gold
// const PRIMARY_LIGHT = "#064e3b0a"; // Ultra-light emerald for backgrounds

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
  }, [dispatch]);

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
        updateGrade({ id: selectedGrade._id, data: formData })
      ).unwrap();
      setGrades((p) =>
        p.map((g) => (g._id === selectedGrade._id ? updated : g))
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
        g.description?.toLowerCase().includes(q)
    );
  }, [grades, searchQuery]);

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
    <div className="min-h-screen bg-[#fcfdfc] font-sans">
      <section className="relative py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-4">
                  <Layers className="w-6 h-6 text-[#064e3b]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
                  Academic Grades
                </h1>
                <p className="text-slate-500 font-bold mt-2">
                  Organize and manage institutional academic levels.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setFormData({ title: "", description: "" });
                    setIsAddOpen(true);
                  }}
                  className="px-8 py-4 bg-[#064e3b] text-yellow-400 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Level
                </button>
              )}
            </div>
          </motion.div>

          {/* Search Bar */}
          <div className="mb-10 flex justify-center">
            <div className="relative w-full max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
              <input
                type="text"
                placeholder="Search levels (e.g. 'Grade 10' or 'Advanced')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none text-lg font-bold transition-all bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Grid Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-[#064e3b] mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#064e3b]">
                Fetching levels...
              </p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">
                No Levels Found
              </h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredGrades.map((grade, i) => (
                  <motion.div
                    key={grade._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:border-yellow-400 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group relative flex flex-col"
                  >
                    <div className="mb-6 flex justify-between items-start">
                      <div className="bg-slate-50 p-3 rounded-2xl text-[#064e3b] group-hover:bg-yellow-400 group-hover:text-emerald-900 transition-colors">
                        <Layers size={20} />
                      </div>

                      {isAdmin ? (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(grade)}
                            className="p-2 hover:bg-emerald-50 text-emerald-700 rounded-lg"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => openDelete(grade)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <Lock size={14} className="text-slate-300" />
                      )}
                    </div>

                    <h3 className="text-xl font-black text-[#064e3b] mb-2">
                      {grade.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-bold line-clamp-2 flex-grow">
                      {grade.description ||
                        "No description provided for this academic level."}
                    </p>

                    <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {getSubjectCount(grade._id)} Subjects
                        </span>
                      </div>
                      <button
                        onClick={() => openView(grade)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#064e3b] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Details <ChevronRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* MODALS REFACTORED TO PREMIUM STYLE */}
      <Modal
        title="Add Level"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <Input
            label="Level Title"
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
            placeholder="Briefly describe this academic tier..."
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#064e3b] text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg"
            >
              Create Level
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Edit Level"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <Input
            label="Level Title"
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
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#064e3b] text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete Confirmation"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-[#064e3b]">
            Delete {selectedGrade?.title}?
          </h3>
          <p className="text-slate-500 font-bold mt-2">
            This is permanent. All associated data will be purged.
          </p>
          <div className="flex gap-3 mt-10">
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200"
            >
              Yes, Purge
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Keep It
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Subjects — ${selectedGrade?.title || ""}`}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      >
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-bold bg-slate-50 focus:bg-white focus:border-yellow-400 transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSubjects.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-10 border-2 border-dashed border-slate-100 rounded-[2rem]">
                Empty curriculum.
              </p>
            ) : (
              filteredSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-yellow-400 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-black text-[#064e3b] text-lg">
                      {subject.name}
                    </h4>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-950 text-yellow-400 px-3 py-1 rounded-lg">
                      {subject.code}
                    </span>
                  </div>
                  {subject.description && (
                    <p className="text-slate-500 text-xs font-bold leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                    <User size={12} className="text-yellow-500" />
                    {subject.teachers?.length
                      ? subject.teachers
                          .map((t) => `${t.firstName} ${t.lastName}`)
                          .join(", ")
                      : "Unassigned"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// HELPER COMPONENTS
const Modal = ({ title, isOpen, onClose, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-white/20"
      >
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#064e3b] tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </motion.div>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/60 ml-1">
      {label}
    </label>
    <input
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none text-sm font-bold bg-slate-50 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/5 transition-all"
      {...props}
    />
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b]/60 ml-1">
      {label}
    </label>
    <textarea
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none text-sm font-bold bg-slate-50 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/5 transition-all resize-none"
      {...props}
    />
  </div>
);

export default GradesManagement;
