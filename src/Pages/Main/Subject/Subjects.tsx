
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
  Filter,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../../Redux/Slices/subject.slice";
import axios from "axios";
import { BASE_URL } from "../../../Redux/baseurl";
import { useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";


const GRADES_API = `${BASE_URL}/api/grades/grades`;
const TEACHERS_API = `${BASE_URL}/api/grades/grades/teachers/all`;

/* -------------------------------------------------
         Types
      ------------------------------------------------- */

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

/* -------------------------------------------------
         Component
      ------------------------------------------------- */
export default function SubjectsManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const token = localStorage.getItem("token") || "";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log(error);
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
    console.log(submitted);
    setLoading(true);
    setError(null);
    dispatch(fetchSubjects())
      .unwrap()
      .then((subjectsFromApi) => {
        const normalized: Subject[] = subjectsFromApi.map((s) => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          description: s.description,
          gradeLevelTitle: s.gradeLevelTitle ?? "—",
          gradeLevelId: s.gradeLevelId ?? "",
          isActive: s.isActive,
          teachers: s.teachers ?? [],
          children: s.children ?? [],
          classes: s.classes ?? [],
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));

        setSubjects(normalized);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.message || "Failed to load subjects";
        setError(msg);
        toast.error(msg);
        setLoading(false);
      });
  }, [dispatch]);

  useEffect(() => loadSubjects(), [loadSubjects]);

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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
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
      const result = await dispatch(action as any).unwrap();
      const normalizedResult = {
        ...result,
        gradeLevelTitle:
          grades.find((g) => g._id === result.gradeLevel?.[0])?.title ?? "—",
        gradeLevelId: result.gradeLevel?.[0] ?? "",
        teachers: result.teachers || [],
      };

      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) => (s._id === editingSubject._id ? normalizedResult : s))
        );
        toast.success("Subject updated!");
      } else {
        setSubjects((prev) => [...prev, normalizedResult]);
        toast.success("Subject created!");
      }
      closeAddEdit();
    } catch (err: any) {
      console.log(err, "err");
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

  const resetFilters = () => {
    setSearch("");
    setSelectedGrade("");
  };

  const getEmptyMessage = () => {
    if (search && selectedGrade)
      return "No subjects found matching your search and grade filter.";
    if (search) return "No subjects match your search.";
    if (selectedGrade) return "No subjects found in this grade level.";
    return "Subscribe to View subjects";
  };

  const type = getUserType();

  return (
    <>
      {(loading || loadingGrades || loadingTeachers) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[100]"
        >
          <Loader2 className="w-16 h-16 animate-spin text-emerald-900 mb-4" />
          <p className="text-emerald-900 font-black uppercase tracking-[0.3em] text-xs">
            Accessing Subject Database...
          </p>
        </motion.div>
      )}

      {!loading && !loadingGrades && !loadingTeachers && (
        <div className="min-h-screen bg-[#f8faf7] p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div className="space-y-3">
                <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-950" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter">
                  Academic Subjects
                </h1>
                <p className="text-emerald-800/60 font-medium text-base max-w-xl italic">
                  Manage your curriculum, track faculty assignments, and monitor
                  student enrollment across all departments.
                </p>
              </div>

              {type === "admin" && (
                <button
                  onClick={() => openAddEdit()}
                  className="bg-emerald-900 text-yellow-400 px-6 py-3.5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-800 transition-all group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  New Subject
                </button>
              )}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-white p-4 rounded-[2.5rem] border border-[#66666612]">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search by name, code, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-3.5 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold transition-all placeholder:text-[#666]"
                />
              </div>

              <div className="relative flex-1 lg:max-w-xs">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="pl-12 pr-10 py-3.5 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold appearance-none transition-all text-emerald-950"
                >
                  <option value="">All Academic Grades</option>
                  {grades.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#666]">
                  <ChevronDown size={18} />
                </div>
              </div>

              {(search || selectedGrade) && (
                <button
                  onClick={resetFilters}
                  className="px-6 py-3.5 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-3xl transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSubjects.map((subject) => (
                  <motion.div
                    key={subject._id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white rounded-[2.5rem] border border-[#66666612] p-6 md:p-7 hover:border-yellow-400 transition-all duration-300 relative overflow-hidden flex flex-col"
                  >
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#66666608] rounded-bl-[2.5rem] -mr-6 -mt-6 group-hover:bg-yellow-400/80 transition-colors duration-300" />

                    <div className="relative z-10 mb-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">
                          {subject.code}
                        </span>
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            subject.isActive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              subject.isActive
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-red-500"
                            }`}
                          />
                          {subject.isActive ? "Live" : "Hold"}
                        </div>
                      </div>

                      <h3 className="text-xl md:text-2xl font-black text-emerald-950 leading-tight group-hover:text-emerald-900 transition-colors">
                        {subject.name}
                      </h3>
                    </div>

                    <p className="text-sm text-emerald-800/60 font-medium mb-6 line-clamp-2 italic leading-relaxed flex-1">
                      {subject.description ||
                        "No course description has been drafted for this subject."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6 pt-5 border-t border-[#66666612]">
                      <div>
                        <p className="text-[9px] font-black text-[#666] uppercase tracking-widest mb-1">
                          Grade Level
                        </p>
                        <p className="text-xs font-black text-emerald-950 uppercase">
                          {subject.gradeLevelTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#666] uppercase tracking-widest mb-1">
                          Community
                        </p>
                        <p className="text-xs font-black text-emerald-950 uppercase">
                          {subject.teachers.length} Staff ·{" "}
                          {subject.children.length} Std
                        </p>
                      </div>
                    </div>

                    {/* Action buttons — View / Edit / Delete */}
                    <div className="flex gap-2 relative z-10 mt-auto">
                      <button
                        onClick={() => openDetails(subject)}
                        className="flex-1 py-2.5 bg-sky-50 text-sky-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      {type === "admin" && (
                        <>
                          <button
                            onClick={() => openAddEdit(subject)}
                            className="flex-1 py-2.5 bg-amber-50 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(subject._id)}
                            className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {!filteredSubjects.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-28 text-center"
              >
                <div className="relative mb-8">
                  <BookOpen className="w-20 h-20 text-emerald-900/30 relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-emerald-950 mb-3 tracking-tighter">
                  {search || selectedGrade
                    ? "No Matches Found"
                    : "Curriculum Empty"}
                </h2>
                <p className="text-emerald-800/40 font-medium max-w-sm italic mb-8">
                  {getEmptyMessage()}
                </p>
                {type === "admin" && (
                  <button
                    onClick={() => openAddEdit()}
                    className="bg-emerald-950 text-yellow-400 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all"
                  >
                    Add Your First Subject
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ==================== DETAILS MODAL ==================== */}
      <AnimatePresence>
        {isDetailsOpen && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110]"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-8 max-w-xl w-full relative overflow-hidden max-h-[88vh] overflow-y-auto"
            >
              {/* Mobile grab handle */}
              <div className="sm:hidden w-10 h-1 bg-[#66666630] rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="pr-4">
                  <span className="px-2.5 py-0.5 bg-yellow-400 text-emerald-950 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                    {selectedSubject.code}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tighter leading-tight">
                    {selectedSubject.name}
                  </h2>
                </div>
                <button
                  onClick={closeDetails}
                  className="p-2 hover:bg-[#66666612] rounded-xl transition-colors text-[#666] shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1.5">
                    Course Overview
                  </p>
                  <p className="text-emerald-900/80 font-medium leading-relaxed italic text-sm bg-[#66666604] p-4 rounded-2xl border border-[#66666608]">
                    {selectedSubject.description ||
                      "Detailed syllabus information is currently pending upload."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#66666612]">
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-0.5">
                      Academic Level
                    </p>
                    <p className="text-base font-black text-emerald-950 uppercase">
                      {selectedSubject.gradeLevelTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-0.5">
                      Registry Status
                    </p>
                    <span
                      className={`inline-block text-sm font-black uppercase ${
                        selectedSubject.isActive
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {selectedSubject.isActive
                        ? "Active Enrollment"
                        : "Registration Closed"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-0.5">
                      Faculty Count
                    </p>
                    <p className="text-base font-black text-emerald-950">
                      {selectedSubject.teachers.length} Members
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-0.5">
                      Student Capacity
                    </p>
                    <p className="text-base font-black text-emerald-950">
                      {selectedSubject.children.length} Enrolled
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      closeDetails();
                      navigate(`/subjects/${selectedSubject._id}`);
                    }}
                    className="flex-1 py-3.5 bg-emerald-950 text-yellow-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all"
                  >
                    <Eye size={16} /> Manage Course
                  </button>
                  {type === "admin" && (
                    <button
                      onClick={() => {
                        closeDetails();
                        openAddEdit(selectedSubject);
                      }}
                      className="px-5 py-3.5 border-2 border-emerald-900/20 text-emerald-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#66666608] transition-all"
                    >
                      Quick Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ADD / EDIT MODAL (2 STEPS) ==================== */}
      <AnimatePresence>
        {isAddEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddEdit}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110]"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-7 max-w-md w-full max-h-[88vh] overflow-y-auto"
            >
              {/* Mobile grab handle */}
              <div className="sm:hidden w-10 h-1 bg-[#66666630] rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tighter">
                    {editingSubject ? "Modify Subject" : "New Subject"}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#666] mt-1">
                    Step {formStep} of 2
                  </p>
                </div>
                <button
                  onClick={closeAddEdit}
                  className="p-2 hover:bg-[#66666612] rounded-xl transition-colors text-[#666]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 mb-6">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    formStep >= 1 ? "bg-emerald-900" : "bg-[#66666620]"
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    formStep >= 2 ? "bg-emerald-900" : "bg-[#66666620]"
                  }`}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formStep === 1 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#666] ml-1 tracking-widest">
                        Subject Title
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-xl p-3.5 font-bold outline-none text-emerald-950 transition-all placeholder:text-[#666] text-sm"
                        placeholder="e.g. Theoretical Physics"
                      />
                      {submitted && !form.name && (
                        <p className="text-red-500 text-[10px] font-bold ml-1">
                          Title is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#666] ml-1 tracking-widest">
                        Unique Code
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-xl p-3.5 font-bold outline-none text-emerald-950 font-mono uppercase transition-all placeholder:text-[#666] text-sm"
                        placeholder="PHYS404"
                      />
                      {submitted && !form.code && (
                        <p className="text-red-500 text-[10px] font-bold ml-1">
                          Code is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#666] ml-1 tracking-widest">
                        Assigned Grade
                      </label>
                      <select
                        name="gradeLevel"
                        value={form.gradeLevel}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-xl p-3.5 font-bold outline-none text-emerald-950 appearance-none transition-all text-sm"
                      >
                        <option value="">Select Level</option>
                        {grades.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                      {submitted && !form.gradeLevel && (
                        <p className="text-red-500 text-[10px] font-bold ml-1">
                          Grade is required
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={goToStep2}
                        className="flex-1 py-3.5 bg-emerald-950 text-yellow-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={closeAddEdit}
                        className="px-5 py-3.5 font-black uppercase text-xs text-[#666] hover:text-emerald-950 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {formStep === 2 && (
                  <>
                    {/* Faculty multi-select */}
                    <div className="relative space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#666] ml-1 tracking-widest">
                        Faculty Selection
                      </label>
                      <div
                        onClick={() =>
                          setTeacherDropdownOpen(!teacherDropdownOpen)
                        }
                        className="w-full bg-[#66666608] border-2 border-transparent hover:border-emerald-900/30 focus-within:border-yellow-400 rounded-xl p-3.5 font-bold text-emerald-950 flex justify-between items-center cursor-pointer transition-all text-sm"
                      >
                        <span
                          className={
                            form.teachers.length === 0 ? "text-[#666]" : ""
                          }
                        >
                          {form.teachers.length === 0
                            ? "Assign teachers..."
                            : `${form.teachers.length} Staff Selected`}
                        </span>
                        <ChevronDown size={16} className="text-[#666]" />
                      </div>

                      {teacherDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#66666612] rounded-2xl z-[120] max-h-40 overflow-y-auto p-1.5">
                          {teachers.map((teacher) => {
                            const isSelected = form.teachers.includes(
                              teacher._id
                            );
                            return (
                              <div
                                key={teacher._id}
                                onClick={() => toggleTeacher(teacher._id)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all mb-0.5 ${
                                  isSelected
                                    ? "bg-emerald-900 text-yellow-400"
                                    : "hover:bg-[#66666608] text-emerald-800"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "border-yellow-400"
                                      : "border-[#666]"
                                  }`}
                                >
                                  {isSelected && <Check size={12} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">
                                  {teacher.firstName} {teacher.lastName}
                                </span>
                              </div>
                            );
                          })}
                          {teachers.length === 0 && (
                            <p className="text-xs text-[#666] italic p-2.5 text-center">
                              No teachers available
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#666] ml-1 tracking-widest">
                        Overview
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-xl p-3.5 font-bold outline-none text-emerald-950 resize-none transition-all placeholder:text-[#666] text-sm"
                        placeholder="Optional syllabus summary..."
                      />
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3 py-1">
                      <div
                        onClick={handleActiveToggle}
                        className={`relative w-11 h-6 rounded-full cursor-pointer transition-all ${
                          form.isActive ? "bg-emerald-900" : "bg-[#66666630]"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-yellow-400 rounded-full transition-transform ${
                            form.isActive ? "translate-x-5" : ""
                          }`}
                        />
                      </div>
                      <label className="text-[10px] font-black uppercase text-emerald-950 tracking-widest">
                        Mark as {form.isActive ? "Active" : "On Hold"}
                      </label>
                    </div>

                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="px-5 py-3.5 border-2 border-emerald-900/15 text-emerald-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#66666608] transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 py-3.5 bg-emerald-950 text-yellow-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all disabled:opacity-60"
                      >
                        {formLoading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : editingSubject ? (
                          <Check size={16} />
                        ) : (
                          <Plus size={16} />
                        )}
                        {editingSubject ? "Save Changes" : "Register"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      <AnimatePresence>
        {isDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteConfirm}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[130]"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-7 md:p-8 max-w-sm w-full text-center"
            >
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-black text-emerald-950 mb-2 tracking-tighter">
                Confirm Deletion
              </h3>
              <p className="text-emerald-800/50 font-medium mb-6 text-sm leading-relaxed italic">
                Warning: This will remove all records and resources associated
                with this subject permanently.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Erase Permanently
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  className="w-full py-3 text-[#666] font-black uppercase text-[10px] tracking-widest hover:text-emerald-950 transition-colors"
                >
                  Keep Subject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
