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
  Edit2,
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

type RawSubject = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel: Array<{ _id: string; title?: string }>;
  isActive: boolean;
  teachers: Array<{ _id: string; firstName: string; lastName: string }>;
  children: any[];
  classes: any[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

type Subject = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevelTitle: string;
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
    setLoading(true);
    setError(null);
    dispatch(fetchSubjects())
      .unwrap()
      .then((raw: RawSubject[]) => {
        const filtered = raw.filter(
          (s) =>
            !s.description?.includes("React.useMemo") &&
            !s.description?.includes("filteredSubjects")
        );

        const normalised: Subject[] = filtered.map((s) => ({
          ...s,
          gradeLevelTitle: s.gradeLevel?.[0]?.title ?? "—",
          gradeLevelId: s.gradeLevel?.[0]?._id ?? "",
        }));

        setSubjects(normalised);
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
      {/* Full-Page Loader */}

      {(loading || loadingGrades || loadingTeachers) && (
        <div className="flex py-48 flex-col min-h-[100%] items-center justify-center bg-white/70 backdrop-blur-sm z-50">
          <Loader2 className="w-14 h-14 animate-spin text-green-700" />
          <p className="mt-4 text-green-700 text-[14px] font-semibold">Loading...</p>
        </div>
      )}

      {/* Main UI */}
      {!loading && !loadingGrades && !loadingTeachers && (
        <div className="min-h-screen bg-[#ffffff] p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 mt-12">
              <div className="bg-yellow-200 rounded-full p-4 mb-4 inline-flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-yellow-900" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                Subjects
              </h1>
              <p className="text-gray-900/70 text-sm md:text-base max-w-3xl">
                Manage all academic subjects and assign multiple teachers.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-gray-900/50" />
                <input
                  type="text"
                  placeholder="Search by name, code, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none text-sm"
                />
              </div>

              <div className="relative flex-1 lg:max-w-xs">
                <Filter className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-gray-900/50" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="pl-10 pr-8 py-2.5 w-full border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none text-sm appearance-none bg-white"
                >
                  <option value="">All Grades</option>
                  {grades.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-[38%] -translate-y-[38%] pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-900/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                {(search || selectedGrade) && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2.5 border-2 border-[#ffd000]/50 text-gray-900 rounded-xl font-medium hover:bg-[#ffd000]/10 transition text-sm"
                  >
                    Clear Filters
                  </button>
                )}

                {type === "admin" && (
                  <button
                    onClick={() => openAddEdit()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-yellow-400 rounded-xl font-bold hover:bg-gray-900/90 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add Subject
                  </button>
                )}
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSubjects.map((subject) => (
                  <motion.div
                    key={subject._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border-2 border-[#ffd000]/30 p-5 cursor-pointer hover:border-[#ffd000] transition-all"
                    onClick={() => openDetails(subject)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-900/70 font-mono">
                          {subject.code}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                          subject.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {subject.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-900/80 mb-2 line-clamp-2">
                      {subject.description || "No description"}
                    </p>

                    <div className="text-xs text-gray-900/60 mb-4 space-y-1">
                      <p>Grade: {subject.gradeLevelTitle}</p>
                      <p>
                        Teachers: {subject.teachers.length} | Students:{" "}
                        {subject.children.length}
                      </p>
                    </div>

                    {type === "admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddEdit(subject);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#ffd000] text-gray-900 rounded-lg font-bold hover:bg-[#ffd000]/90 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(subject._id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {!filteredSubjects.length && (
              <motion.div className="flex flex-col items-center justify-center py-24 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#ffd000]/20 blur-3xl rounded-full w-32 h-32 mx-auto" />
                    <BookOpen className="w-24 h-24 text-gray-900 relative z-10" />
                  </div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-[#ffd000] bg-clip-text text-transparent">
                  {search || selectedGrade
                    ? "No Results Found"
                    : "No Subjects Yet"}
                </h2>
                <p className="text-gray-900/70 text-lg max-w-md">
                  {getEmptyMessage()}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDetails}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">
                    {selectedSubject.name}
                  </h2>
                  <p className="text-lg font-mono text-gray-900/70 mt-1">
                    {selectedSubject.code}
                  </p>
                </div>
                <button
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-gray-900/80">
                <div>
                  <p className="text-sm font-bold">Description</p>
                  <p className="mt-1">
                    {selectedSubject.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">Grade Level</p>
                  <p className="mt-1">{selectedSubject.gradeLevelTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-bold">Status</p>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-bold rounded-full mt-1 ${
                      selectedSubject.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {selectedSubject.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold">Teachers</p>
                    <p className="mt-1">{selectedSubject.teachers.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Students</p>
                    <p className="mt-1">{selectedSubject.children.length}</p>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      closeDetails();
                      navigate(`/subjects/${selectedSubject._id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-yellow-400 rounded-xl font-bold hover:bg-gray-900/90"
                  >
                    <Eye className="w-5 h-5" />
                    View Full Details
                  </button>
                  {type === "admin" && (
                    <button
                      onClick={() => {
                        closeDetails();
                        openAddEdit(selectedSubject);
                      }}
                      className="flex-1 py-3 border-2 border-[#ffd000] text-gray-900 rounded-xl font-bold hover:bg-[#ffd000]/10"
                    >
                      Edit Subject
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isAddEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeAddEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingSubject ? "Edit Subject" : "Add New Subject"}
                </h2>
                <button
                  onClick={closeAddEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                    placeholder="e.g. Mathematics"
                  />
                  {submitted && !form.name && (
                    <p className="text-red-600 text-xs mt-1">Required</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none font-mono"
                    placeholder="e.g. MATH101"
                  />
                  {submitted && !form.code && (
                    <p className="text-red-600 text-xs mt-1">Required</p>
                  )}
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gradeLevel"
                    value={form.gradeLevel}
                    onChange={handleChange}
                    required
                    disabled={loadingGrades}
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="">
                      {loadingGrades
                        ? "Loading grades..."
                        : grades.length === 0
                        ? "No grades available"
                        : "Select Grade Level"}
                    </option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                  {submitted && !form.gradeLevel && (
                    <p className="text-red-600 text-xs mt-1">Required</p>
                  )}
                </div>

                {/* Teachers Multi-Select */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Assign Teachers
                  </label>
                  <div className="relative">
                    {/* Trigger Button */}
                    <div
                      onClick={() =>
                        setTeacherDropdownOpen(!teacherDropdownOpen)
                      }
                      className="w-full px-4 py-3 border-2 border-[#ffd000]/50 rounded-xl cursor-pointer flex justify-between items-center bg-white hover:border-[#ffd000] transition-all duration-200"
                    >
                      <span
                        className={`text-sm font-medium ${
                          form.teachers.length === 0
                            ? "text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {form.teachers.length === 0
                          ? "Select teachers..."
                          : `${form.teachers.length} teacher${
                              form.teachers.length > 1 ? "s" : ""
                            } selected`}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                          teacherDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Dropdown Panel */}
                    {teacherDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#ffd000] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                        {teachers.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm font-medium">
                            No teachers available
                          </div>
                        ) : (
                          <div className="p-2">
                            {teachers.map((teacher) => {
                              const isSelected = form.teachers.includes(
                                teacher._id
                              );
                              return (
                                <label
                                  key={teacher._id}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-150 ${
                                    isSelected
                                      ? "bg-[#ffd000] text-gray-900 font-semibold shadow-sm"
                                      : "hover:bg-gray-50 text-gray-800"
                                  }`}
                                  onClick={() => toggleTeacher(teacher._id)}
                                >
                                  {/* Custom Radio Circle */}
                                  <div className="relative">
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isSelected
                                          ? "border-[#ffd000] bg-[#ffd000]"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Teacher Name */}
                                  <span className="text-sm font-medium select-none">
                                    {teacher.firstName} {teacher.lastName}
                                  </span>

                                  {/* Optional Check Icon */}
                                  {isSelected && (
                                    <Check className="w-4 h-4 ml-auto text-gray-900" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-4">
                  <div
                    onClick={handleActiveToggle}
                    className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${
                      form.isActive ? "bg-gray-900" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <label className="text-sm font-medium text-gray-900">
                    Subject is {form.isActive ? "active" : "inactive"}
                  </label>
                </div>

                {/* Buttons */}
                <p className="text-[#ff0000]"> {error}</p>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-yellow-400 rounded-xl font-bold hover:bg-gray-900/90 disabled:opacity-70"
                  >
                    {formLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : editingSubject ? (
                      <>
                        <Check className="w-5 h-5" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddEdit}
                    className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {isDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDeleteConfirm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-red-500 p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-black text-gray-900">
                  Delete Subject?
                </h3>
              </div>
              <p className="text-sm text-gray-900/80 mb-6">
                This action <strong>cannot be undone</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-70"
                >
                  {deleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
