// src/Pages/Main/Subject/SubjectsManager.tsx
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
        // subjectsFromApi type is probably slice's Subject type
        const normalized: Subject[] = subjectsFromApi.map((s) => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          description: s.description,
          gradeLevelTitle: s.gradeLevelTitle ?? "—",
          gradeLevelId: s.gradeLevelId ?? "", // <-- add this
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
  }, [editingSubject]);

  /* ---------- Handlers ---------- */
  const openAddEdit = (subject?: Subject) => {
    setEditingSubject(subject ?? null);
    setIsAddEditOpen(true);
  };

  const closeAddEdit = () => {
    setIsAddEditOpen(false);
    setEditingSubject(null);
    setSubmitted(false);
    setFormLoading(false);
    setTeacherDropdownOpen(false);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name || !form.code || !form.gradeLevel) return;

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
        <div className="min-h-screen bg-[#f8faf7] p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="space-y-4">
                <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <BookOpen className="w-6 h-6 text-emerald-950" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-emerald-950 tracking-tighter">
                  Academic Subjects
                </h1>
                <p className="text-emerald-800/60 font-medium text-lg max-w-2xl italic">
                  Manage your curriculum, track faculty assignments, and monitor
                  student enrollment across all departments.
                </p>
              </div>
              {type === "admin" && (
                <button
                  onClick={() => openAddEdit()}
                  className="bg-emerald-900 text-yellow-400 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/10 group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
                  New Subject
                </button>
              )}
            </div>
            <div className="flex flex-col lg:flex-row gap-4 mb-12 bg-white p-4 rounded-[2.5rem] shadow-sm border border-[#66666612]">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search by name, code, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-4 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold transition-all placeholder:text-[#666]"
                />
              </div>
              <div className="relative flex-1 lg:max-w-xs">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="pl-12 pr-10 py-4 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold appearance-none transition-all text-emerald-950"
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
                  className="px-6 py-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-3xl transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredSubjects.map((subject) => (
                  <motion.div
                    key={subject._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => openDetails(subject)}
                    className="group bg-white rounded-[2.8rem] border border-[#66666612] p-8 cursor-pointer hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-yellow-400 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#66666612] rounded-bl-[3rem] -mr-8 -mt-8 group-hover:bg-yellow-400 transition-colors duration-500" />
                    <div className="relative z-10 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">
                          {subject.code}
                        </span>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            subject.isActive
                              ? "bg-[#66666612] text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              subject.isActive
                                ? "bg-[#66666612]0 animate-pulse"
                                : "bg-red-500"
                            }`}
                          />
                          {subject.isActive ? "Live" : "Hold"}
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-emerald-950 leading-tight group-hover:text-emerald-900 transition-colors">
                        {subject.name}
                      </h3>
                    </div>
                    <p className="text-sm text-emerald-800/60 font-medium mb-8 line-clamp-2 italic leading-relaxed">
                      {subject.description ||
                        "No course description has been drafted for this subject."}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-8 pt-6 ">
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
                          {subject.teachers.length} Staff |{" "}
                          {subject.children.length} Std
                        </p>
                      </div>
                    </div>
                    {type === "admin" && (
                      <div className="flex gap-3 relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddEdit(subject);
                          }}
                          className="flex-1 py-3 bg-[#66666612] text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 hover:text-yellow-400 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(subject._id);
                          }}
                          className="px-4 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {!filteredSubjects.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full w-32 h-32 mx-auto" />
                  <BookOpen className="w-24 h-24 text-green relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-emerald-950 mb-3 tracking-tighter">
                  {search || selectedGrade
                    ? "No Matches Found"
                    : "Curriculum Empty"}
                </h2>
                <p className="text-emerald-800/40 font-bold max-w-sm italic mb-8">
                  {getEmptyMessage()}
                </p>
                {type === "admin" && (
                  <button
                    onClick={() => openAddEdit()}
                    className="bg-emerald-950 text-yellow-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20"
                  >
                    Add Your First Subject
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {isDetailsOpen && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[110]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3.5rem] p-10 md:p-14 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#66666612] rounded-full -mr-20 -mt-20" />
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <span className="px-3 py-1 bg-yellow-400 text-emerald-950 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-sm">
                    {selectedSubject.code}
                  </span>
                  <h2 className="text-4xl font-black text-emerald-950 tracking-tighter">
                    {selectedSubject.name}
                  </h2>
                </div>
                <button
                  onClick={closeDetails}
                  className="p-3 hover:bg-[#66666612] rounded-2xl transition-colors text-[#666]"
                >
                  <X />
                </button>
              </div>
              <div className="space-y-8 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-3">
                    Course Overview
                  </p>
                  <p className="text-emerald-800/70 font-medium leading-relaxed italic text-lg">
                    {selectedSubject.description ||
                      "Detailed syllabus information is currently pending upload."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#66666612]">
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1">
                      Academic Level
                    </p>
                    <p className="text-xl font-black text-emerald-950 uppercase">
                      {selectedSubject.gradeLevelTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1">
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
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1">
                      Faculty Count
                    </p>
                    <p className="text-xl font-black text-emerald-950">
                      {selectedSubject.teachers.length} Members
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1">
                      Student Capacity
                    </p>
                    <p className="text-xl font-black text-emerald-950">
                      {selectedSubject.children.length} Enrolled
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      closeDetails();
                      navigate(`/subjects/${selectedSubject._id}`);
                    }}
                    className="flex-1 py-5 bg-emerald-950 text-yellow-400 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all"
                  >
                    <Eye size={18} /> Manage Course
                  </button>
                  {type === "admin" && (
                    <button
                      onClick={() => {
                        closeDetails();
                        openAddEdit(selectedSubject);
                      }}
                      className="px-8 py-5 border-2 border-green text-emerald-900 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-[#66666612] transition-all"
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
      <AnimatePresence>
        {isAddEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddEdit}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[110]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3.5rem] p-10 md:p-12 max-w-lg w-full shadow-2xl max-h-[80%] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">
                  {editingSubject ? "Modify Subject" : "New Department Entry"}
                </h2>
                <button
                  onClick={closeAddEdit}
                  className="text-[#666] hover:text-emerald-950 transition-colors"
                >
                  <X />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#666] ml-1">
                    Subject Title
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none text-emerald-950 transition-all"
                    placeholder="e.g. Theoretical Physics"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#666] ml-1">
                    Unique Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none text-emerald-950 font-mono uppercase transition-all"
                    placeholder="PHYS404"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#666] ml-1">
                    Assigned Grade
                  </label>
                  <select
                    name="gradeLevel"
                    value={form.gradeLevel}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none text-emerald-950 appearance-none transition-all"
                  >
                    <option value="">Select Level</option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#666] ml-1">
                    Faculty Selection
                  </label>
                  <div
                    onClick={() => setTeacherDropdownOpen(!teacherDropdownOpen)}
                    className="w-full bg-[#66666608] border-2 border-transparent hover:border-green rounded-2xl p-4 font-bold text-emerald-950 flex justify-between items-center cursor-pointer transition-all"
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
                    <ChevronDown size={16} />
                  </div>
                  {teacherDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#66666612] rounded-3xl shadow-2xl z-[120] max-h-48 overflow-y-auto p-2">
                      {teachers.map((teacher) => {
                        const isSelected = form.teachers.includes(teacher._id);
                        return (
                          <div
                            key={teacher._id}
                            onClick={() => toggleTeacher(teacher._id)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                              isSelected
                                ? "bg-emerald-900 text-yellow-400"
                                : "hover:bg-[#66666612] text-emerald-800"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
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
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#666] ml-1">
                    Overview
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-[#66666608] border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none text-emerald-950 resize-none transition-all"
                    placeholder="Optional syllabus summary..."
                  />
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div
                    onClick={handleActiveToggle}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-all ${
                      form.isActive ? "bg-emerald-900" : "bg-green"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-yellow-400 rounded-full transition-transform ${
                        form.isActive ? "translate-x-6" : ""
                      }`}
                    />
                  </div>
                  <label className="text-[10px] font-black uppercase text-emerald-950 tracking-widest">
                    Mark as {form.isActive ? "Active" : "On Hold"}
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-5 bg-emerald-950 text-yellow-400 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : editingSubject ? (
                      <Check size={18} />
                    ) : (
                      <Plus size={18} />
                    )}{" "}
                    {editingSubject ? "Confirm Changes" : "Register Subject"}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddEdit}
                    className="px-8 py-5 font-black uppercase text-xs text-[#666] hover:text-emerald-950 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3.5rem] p-10 md:p-12 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-3 tracking-tighter">
                Confirm Deletion
              </h3>
              <p className="text-emerald-800/50 font-medium mb-10 text-sm leading-relaxed italic">
                "Warning: This will remove all records and resources associated
                with this subject permanently."
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}{" "}
                  Erase Permanently
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  className="w-full py-4 text-[#666] font-black uppercase text-[10px] tracking-widest hover:text-emerald-950 transition-colors"
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
