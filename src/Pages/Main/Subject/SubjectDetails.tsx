// src/pages/SubjectDetails.tsx
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  ToggleLeft,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Clock,
  User,
  FileText,
  Megaphone,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchSubjectById,
  deleteSubject,
} from "../../../Redux/Slices/subject.slice";
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../../Redux/Slices/class.slice";
import {
  fetchResources,
  addResource,
  updateResource,
  deleteResource,
  clearResources,
} from "../../../Redux/Slices/resources.slice";
import { useParams, useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";

// Raw subject directly from the backend (before normalisation)
interface RawSubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;

  // Populated references
  gradeLevel: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;

  grades: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;

  teachers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;

  children: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;

  classes: Array<{
    _id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    teacherId?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

type ResourceType = "assignment" | "note" | "announcement";

interface ClassForm {
  title: string;
  date: string;
  time: string;
  duration: number;
}

interface ResourceForm {
  title: string;
  description: string;
}

const resourceIcons = {
  assignment: ClipboardList,
  note: FileText,
  announcement: Megaphone,
};

const resourceColors = {
  assignment: "bg-blue-100 text-blue-700",
  note: "bg-purple-100 text-purple-700",
  announcement: "bg-orange-100 text-orange-700",
};

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  /* ---------- Subject ---------- */
  const [subject, setSubject] = useState<RawSubject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  /* ---------- Classes ---------- */
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [classForm, setClassForm] = useState<ClassForm>({
    title: "",
    date: "",
    time: "",
    duration: 60,
  });
  const [classSubmitted, setClassSubmitted] = useState(false);
  const [classSaving, setClassSaving] = useState(false);

  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  /* ---------- Resources ---------- */
  const [activeTab, setActiveTab] = useState<ResourceType>("assignment");
  const [resources, setResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isEditResourceOpen, setIsEditResourceOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceForm>({
    title: "",
    description: "",
  });
  const [resourceSubmitted, setResourceSubmitted] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);

  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [isDeleteResourceOpen, setIsDeleteResourceOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(false);

  /* ---------- Delete Subject ---------- */
  const [isDeleteSubjectOpen, setIsDeleteSubjectOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);

  /* ---------- Fetch Subject ---------- */
  useEffect(() => {
    if (!id) {
      setSubjectError("Invalid subject ID");
      setSubjectLoading(false);
      return;
    }

    setSubjectLoading(true);
    setSubjectError(null);

    dispatch(fetchSubjectById(id))
      .unwrap()
      .then((data: any) => {
        setSubject(data);
        setSubjectLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load subject";
        setSubjectError(msg);
        toast.error(msg);
        setSubjectLoading(false);
      });
  }, [id, dispatch]);

  /* ---------- Fetch Classes ---------- */
  useEffect(() => {
    if (!id) return;

    setClassesLoading(true);
    setClassesError(null);

    dispatch(fetchClasses(id))
      .unwrap()
      .then((data: any[]) => {
        setClasses(data);
        setClassesLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load classes";
        setClassesError(msg);
        toast.error(msg);
        setClassesLoading(false);
      });
  }, [id, dispatch]);

  /* ---------- Fetch Resources ---------- */
  useEffect(() => {
    if (!id) return;

    setResourcesLoading(true);
    setResourcesError(null);

    dispatch(fetchResources({ type: activeTab, subjectId: id }))
      .unwrap()
      .then((data: any[]) => {
        setResources(data);
        setResourcesLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load resources";
        setResourcesError(msg);
        toast.error(msg);
        setResourcesLoading(false);
      });

    return () => {
      dispatch(clearResources());
    };
  }, [id, activeTab, dispatch]);

  /* ---------- Handlers ---------- */
  //const openDeleteSubject = () => setIsDeleteSubjectOpen(true);

  const closeDeleteSubject = () => setIsDeleteSubjectOpen(false);
  const confirmDeleteSubject = async () => {
    if (!id) return;
    setDeletingSubject(true);
    try {
      await dispatch(deleteSubject(id)).unwrap();
      toast.success("Subject deleted");
      navigate("/subject-manager");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingSubject(false);
      closeDeleteSubject();
    }
  };

  /* ---------- Class Modals ---------- */
  const openAddClass = () => {
    setClassForm({ title: "", date: "", time: "", duration: 60 });
    setClassSubmitted(false);
    setIsAddClassOpen(true);
  };
  const closeAddClass = () => setIsAddClassOpen(false);

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    setClassForm({
      title: cls.title,
      date: cls.date.split("T")[0],
      time: cls.time,
      duration: cls.duration,
    });
    setClassSubmitted(false);
    setIsEditClassOpen(true);
  };
  const closeEditClass = () => {
    setEditingClass(null);
    setIsEditClassOpen(false);
  };

  const handleClassChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setClassForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveClass = async (e: FormEvent) => {
    e.preventDefault();
    setClassSubmitted(true);
    if (!classForm.title || !classForm.date || !classForm.time) return;

    setClassSaving(true);
    const payload = {
      title: classForm.title.trim(),
      date: classForm.date,
      time: classForm.time,
      duration: Number(classForm.duration),
    };

    try {
      if (editingClass) {
        const result = await dispatch(
          updateClass({ id: editingClass._id, data: payload })
        ).unwrap();
        setClasses((prev) =>
          prev.map((c) => (c._id === result._id ? result : c))
        );
        toast.success("Class updated!");
        closeEditClass();
      } else {
        const result = await dispatch(
          createClass({ ...payload, subjectId: id })
        ).unwrap();
        setClasses((prev) => [...prev, result]);
        toast.success("Class created!");
        closeAddClass();
      }
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setClassSaving(false);
    }
  };

  const openDeleteClass = (classId: string) => {
    setDeleteClassId(classId);
    setIsDeleteClassOpen(true);
  };
  const closeDeleteClass = () => {
    setDeleteClassId(null);
    setIsDeleteClassOpen(false);
  };
  const confirmDeleteClass = async () => {
    if (!deleteClassId) return;
    setDeletingClass(true);
    try {
      await dispatch(deleteClass(deleteClassId)).unwrap();
      setClasses((prev) => prev.filter((c) => c._id !== deleteClassId));
      toast.success("Class deleted");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingClass(false);
      closeDeleteClass();
    }
  };

  /* ---------- Resource Modals ---------- */
  const openAddResource = () => {
    setResourceForm({ title: "", description: "" });
    setResourceSubmitted(false);
    setIsAddResourceOpen(true);
  };
  const closeAddResource = () => setIsAddResourceOpen(false);

  const openEditResource = (res: any) => {
    setEditingResource(res);
    setResourceForm({ title: res.title, description: res.description || "" });
    setResourceSubmitted(false);
    setIsEditResourceOpen(true);
  };
  const closeEditResource = () => {
    setEditingResource(null);
    setIsEditResourceOpen(false);
  };

  const handleResourceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setResourceForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveResource = async (e: FormEvent) => {
    e.preventDefault();
    setResourceSubmitted(true);
    if (!resourceForm.title) return;

    setResourceSaving(true);
    const payload = {
      type: activeTab,
      subjectId: id!,
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || undefined,
    };

    try {
      if (editingResource) {
        const result = await dispatch(
          updateResource({ ...payload, _id: editingResource._id })
        ).unwrap();
        setResources((prev) =>
          prev.map((r) => (r._id === result._id ? result : r))
        );
        toast.success("Updated!");
        closeEditResource();
      } else {
        const result = await dispatch(addResource(payload)).unwrap();
        setResources((prev) => [result, ...prev]);
        toast.success("Created!");
        closeAddResource();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setResourceSaving(false);
    }
  };

  const openDeleteResource = (resId: string) => {
    setDeleteResourceId(resId);
    setIsDeleteResourceOpen(true);
  };
  const closeDeleteResource = () => {
    setDeleteResourceId(null);
    setIsDeleteResourceOpen(false);
  };
  const confirmDeleteResource = async () => {
    if (!deleteResourceId) return;
    setDeletingResource(true);
    try {
      await dispatch(
        deleteResource({ type: activeTab, _id: deleteResourceId })
      ).unwrap();
      setResources((prev) => prev.filter((r) => r._id !== deleteResourceId));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingResource(false);
      closeDeleteResource();
    }
  };

  /* ---------- Derived ---------- */
  const gradeTitle = subject?.gradeLevel?.[0]?.title ?? "—";
  const isActive = subject?.isActive;

  const type = getUserType();
  return (
    <>
      {/* Full Page Loader */}
      <AnimatePresence>
        {(subjectLoading || classesLoading || resourcesLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-6 z-50 p-4"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-gray-900 " />
              <p className="text-lg font-medium text-gray-700">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!subjectLoading && !classesLoading && !resourcesLoading && (
        <div className="min-h-screen bg-[#ffffff] p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-900  font-medium hover:text-gray-900 /70 transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Subjects
            </button>

            {/* Errors */}
            <AnimatePresence>
              {(subjectError || classesError || resourcesError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {subjectError || classesError || resourcesError}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm underline font-medium mt-2 hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subject Card */}
            {!subjectError && subject && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-md mb-8"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-4xl font-black text-gray-900  mb-2">
                      {subject.name}
                    </h1>
                    <p className="text-xl font-mono text-gray-900 /70">
                      {subject.code}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full font-bold text-sm ${
                      isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Description */}
                {subject.description && (
                  <div className="mb-8 p-5 bg-[#ffd000]/10 rounded-2xl border-2 border-[#ffd000]/30">
                    <p className="text-gray-900 /80 leading-relaxed">
                      {subject.description}
                    </p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#ffd000]/20 rounded-xl">
                      <GraduationCap className="w-6 h-6 text-gray-900 " />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 ">
                        Grade Level
                      </p>
                      <p className="text-lg">{gradeTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#ffd000]/20 rounded-xl">
                      <Users className="w-6 h-6 text-gray-900 " />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 ">
                        Teachers
                      </p>
                      <p className="text-lg">{subject.teachers.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#ffd000]/20 rounded-xl">
                      <BookOpen className="w-6 h-6 text-gray-900 " />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 ">
                        Students
                      </p>
                      <p className="text-lg">{subject.children.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#ffd000]/20 rounded-xl">
                      <ToggleLeft className="w-6 h-6 text-gray-900 " />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 ">Status</p>
                      <p className="text-lg">
                        {isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-900 /60 border-t-2 border-[#ffd000]/30 pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created:{" "}
                      {new Date(subject.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Updated:{" "}
                      {new Date(subject.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  {/* <button
                    onClick={() => navigate(`/subjects/edit/${id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ffd000] text-gray-900  rounded-xl font-bold hover:bg-[#ffd000]/90 transition"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Subject
                  </button> */}
                  {/* <button
                    onClick={openDeleteSubject}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Subject
                  </button> */}
                </div>
              </motion.div>
            )}

            {/* Classes Section */}
            <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-md mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 ">
                  Classes ({classes.length})
                </h2>
                {type === "admin" && (
                  <button
                    onClick={openAddClass}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900  text-yellow-400 rounded-xl font-bold hover:bg-gray-900 /90 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add Class
                  </button>
                )}
              </div>

              {classes.length === 0 ? (
                <p className="text-gray-900 /60 text-center py-8">
                  No classes scheduled for this subject yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <motion.div
                      key={cls._id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-[#ffd000]/5 rounded-xl border border-[#ffd000]/30"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 ">
                          {cls.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-900 /70 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(cls.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {cls.time} ({cls.duration} mins)
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {cls.teacherId?.firstName
                              ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                              : "No teacher"}
                          </span>
                        </div>
                      </div>

                      {type === "admin" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditClass(cls)}
                            className="text-gray-900  hover:text-[#ffd000]"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteClass(cls._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Resources Section */}
            <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 ">
                  Resources
                </h2>

                {type === "admin" && (
                  <button
                    onClick={openAddResource}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900  text-yellow-400 rounded-xl font-bold hover:bg-gray-900 /90 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add {activeTab}
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-[#ffd000]/30">
                {(["assignment", "note", "announcement"] as ResourceType[]).map(
                  (type) => {
                    const Icon = resourceIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-bold transition ${
                          activeTab === type
                            ? "bg-[#ffd000] text-gray-900 "
                            : "text-gray-900 /60 hover:text-gray-900 "
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                      </button>
                    );
                  }
                )}
              </div>

              {/* Resource List */}
              {resources.length === 0 ? (
                <p className="text-gray-900 /60 text-center py-8">
                  No {activeTab}s yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {resources.map((res) => {
                    const Icon = resourceIcons[activeTab];
                    return (
                      <motion.div
                        key={res._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white rounded-xl border-2 border-[#ffd000]/30 flex items-start justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${resourceColors[activeTab]}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 ">
                              {res.title}
                            </h4>
                            {res.description && (
                              <p className="text-sm text-gray-900 /70 mt-1">
                                {res.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-900 /50 mt-2">
                              {new Date(res.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditResource(res)}
                            className="text-gray-900  hover:text-[#ffd000]"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteResource(res._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}
      {/* Delete Subject */}
      <AnimatePresence>
        {isDeleteSubjectOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDeleteSubject}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl border-4 border-red-500 p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-black text-gray-900 ">
                  Delete Subject?
                </h3>
              </div>
              <p className="text-sm text-gray-900 /80 mb-6">
                This will <strong>permanently delete</strong> the subject and
                all its data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-70"
                >
                  {deletingSubject ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
                <button
                  onClick={closeDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Class */}
      <AnimatePresence>
        {(isAddClassOpen || isEditClassOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={isAddClassOpen ? closeAddClass : closeEditClass}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 ">
                  {isEditClassOpen ? "Edit Class" : "Add New Class"}
                </h2>
                <button
                  onClick={isAddClassOpen ? closeAddClass : closeEditClass}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Class Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={classForm.title}
                    onChange={handleClassChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                  />
                  {classSubmitted && !classForm.title && (
                    <p className="text-red-600 text-xs mt-1">Required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={classForm.date}
                    onChange={handleClassChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={classForm.time}
                    onChange={handleClassChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration"
                    value={classForm.duration}
                    onChange={handleClassChange}
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                  >
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={classSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900  text-yellow-400 rounded-xl font-bold hover:bg-gray-900 /90 transition disabled:opacity-70"
                  >
                    {classSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {isEditClassOpen ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={isAddClassOpen ? closeAddClass : closeEditClass}
                    className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Class */}
      <AnimatePresence>
        {isDeleteClassOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDeleteClass}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl border-4 border-red-500 p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-black text-gray-900 ">
                  Delete Class?
                </h3>
              </div>
              <p className="text-sm text-gray-900 /80 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteClass}
                  disabled={deletingClass}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-70"
                >
                  {deletingClass ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
                <button
                  onClick={closeDeleteClass}
                  disabled={deletingClass}
                  className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAddResourceOpen || isEditResourceOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={isAddResourceOpen ? closeAddResource : closeEditResource}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 ">
                  {isEditResourceOpen ? "Edit" : "Add"} {activeTab}
                </h2>
                <button
                  onClick={
                    isAddResourceOpen ? closeAddResource : closeEditResource
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveResource} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={resourceForm.title}
                    onChange={handleResourceChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none"
                  />
                  {resourceSubmitted && !resourceForm.title && (
                    <p className="text-red-600 text-xs mt-1">Required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900  mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={resourceForm.description}
                    onChange={handleResourceChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-[#ffd000]/50 rounded-xl focus:border-[#ffd000] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={resourceSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900  text-yellow-400 rounded-xl font-bold hover:bg-gray-900 /90 transition disabled:opacity-70"
                  >
                    {resourceSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {isEditResourceOpen ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={
                      isAddResourceOpen ? closeAddResource : closeEditResource
                    }
                    className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Resource */}
      <AnimatePresence>
        {isDeleteResourceOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDeleteResource}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl border-4 border-red-500 p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-black text-gray-900 ">
                  Delete {activeTab}?
                </h3>
              </div>
              <p className="text-sm text-gray-900 /80 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteResource}
                  disabled={deletingResource}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-70"
                >
                  {deletingResource ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
                <button
                  onClick={closeDeleteResource}
                  disabled={deletingResource}
                  className="flex-1 py-3 border-2 border-gray-400 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
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
