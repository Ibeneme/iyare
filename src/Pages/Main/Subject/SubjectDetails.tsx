import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
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

interface RawSubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
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

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [subject, setSubject] = useState<RawSubject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

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

  const [isDeleteSubjectOpen, setIsDeleteSubjectOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);

  console.log(resourceSubmitted, classSubmitted);
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

  const type = getUserType();
  const gradeTitle = subject?.gradeLevel?.[0]?.title ?? "—";
  const isActive = subject?.isActive;

  return (
    <div className="min-h-screen bg-[#f8faf7] p-4 md:p-8">
      {/* Loading Overlay */}
      <AnimatePresence>
        {(subjectLoading || classesLoading || resourcesLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-emerald-900 animate-spin" />
            <p className="text-emerald-900 font-black uppercase tracking-widest text-xs">
              Synchronizing Curriculum...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-800 hover:text-emerald-600 transition-all mb-6 font-bold group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to List
        </button>

        {/* Errors */}
        <AnimatePresence>
          {(subjectError || classesError || resourcesError) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50 border border-red-100 p-4 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-red-700 font-bold">
                <AlertCircle />
                <p>{subjectError || classesError || resourcesError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject Header Card */}
        {!subjectError && subject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white mb-8"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-yellow-400 text-emerald-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-yellow-400/20">
                    {subject.code}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border ${
                      isActive
                        ? "bg-emerald-800/50 text-emerald-300 border-emerald-700"
                        : "bg-red-900/50 text-red-300 border-red-800"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                  {subject.name}
                </h1>
                <p className="text-emerald-100/70 font-medium max-w-2xl leading-relaxed text-lg italic">
                  {subject.description || "No course overview provided."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <StatCard
                  icon={<GraduationCap />}
                  label="Grade"
                  value={gradeTitle}
                />
                <StatCard
                  icon={<Users />}
                  label="Staff"
                  value={String(subject.teachers.length)}
                />
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 pt-8 border-t border-white/10 text-emerald-200/50 font-bold text-xs uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar size={14} /> Created:{" "}
                {new Date(subject.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} /> Updated:{" "}
                {new Date(subject.updatedAt).toLocaleDateString()}
              </div>
              {type === "admin" && (
                <button
                  onClick={() => setIsDeleteSubjectOpen(true)}
                  className="ml-auto text-red-400 hover:text-red-200 transition-colors flex items-center gap-2 group"
                >
                  <Trash2
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />{" "}
                  Permanent Delete
                </button>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Classes Section */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-emerald-50">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-emerald-950 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
                    <Clock size={24} />
                  </div>
                  Course Schedule{" "}
                  <span className="text-emerald-300 ml-2">
                    ({classes.length})
                  </span>
                </h2>
                {type === "admin" && (
                  <button
                    onClick={openAddClass}
                    className="bg-emerald-900 text-yellow-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10"
                  >
                    <Plus size={18} /> New Session
                  </button>
                )}
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={48} />}
                  message="No classes scheduled for this subject yet."
                />
              ) : (
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <motion.div
                      key={cls._id}
                      layout
                      className="group bg-[#fcfdfc] hover:bg-white border border-emerald-50 hover:border-yellow-400 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:shadow-xl hover:shadow-emerald-900/5"
                    >
                      <div className="flex items-center gap-6 w-full">
                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-emerald-900 shadow-sm border border-emerald-100 group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-all">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-emerald-950 text-xl mb-2">
                            {cls.title}
                          </h4>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg">
                              <Calendar size={12} />{" "}
                              {new Date(cls.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg">
                              <Clock size={12} /> {cls.time} ({cls.duration}m)
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg">
                              <User size={12} />{" "}
                              {cls.teacherId
                                ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                                : "Pending Staff"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {type === "admin" && (
                        <div className="flex gap-2 w-full md:w-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditClass(cls)}
                            className="flex-1 md:flex-none p-4 bg-white text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-900 hover:text-yellow-400 transition-all shadow-sm"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteClass(cls._id)}
                            className="flex-1 md:flex-none p-4 bg-white text-red-500 rounded-2xl border border-emerald-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Resources Section */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-emerald-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <h2 className="text-2xl font-black text-emerald-950 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
                    <ClipboardList size={24} />
                  </div>
                  Academic Portal
                </h2>
                <div className="flex bg-emerald-50 p-1.5 rounded-[1.8rem] border border-emerald-100 overflow-x-auto no-scrollbar">
                  {(
                    ["assignment", "note", "announcement"] as ResourceType[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                        activeTab === t
                          ? "bg-emerald-900 text-yellow-400 shadow-xl shadow-emerald-900/20"
                          : "text-emerald-800/60 hover:text-emerald-900"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {type === "admin" && (
                <button
                  onClick={openAddResource}
                  className="w-full mb-8 py-5 border-2 border-dashed border-emerald-100 rounded-[2rem] text-emerald-800/40 font-black uppercase tracking-widest text-xs hover:border-yellow-400 hover:text-emerald-900 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus
                    size={18}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  Add New {activeTab}
                </button>
              )}

              {resources.length === 0 ? (
                <EmptyState
                  icon={<FileText size={48} />}
                  message={`The ${activeTab} gallery is currently empty.`}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {resources.map((res) => {
                    const Icon = resourceIcons[activeTab];
                    return (
                      <motion.div
                        key={res._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group p-6 bg-[#fcfdfc] border border-emerald-50 rounded-[2.2rem] hover:border-yellow-400 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-white rounded-2xl text-emerald-900 shadow-sm border border-emerald-100 group-hover:bg-yellow-400 transition-colors">
                            <Icon size={24} />
                          </div>
                          <div className="text-[10px] font-black text-emerald-300 uppercase tracking-tighter text-right">
                            <p className="text-emerald-950/20 mb-1">
                              Uploaded On
                            </p>
                            {new Date(res.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <h4 className="font-black text-emerald-950 text-xl mb-3">
                          {res.title}
                        </h4>
                        <p className="text-sm text-emerald-800/60 font-medium leading-relaxed mb-6 line-clamp-3">
                          {res.description ||
                            "No specific details or instructions provided."}
                        </p>

                        {type === "admin" && (
                          <div className="flex gap-4 pt-6 border-t border-emerald-50">
                            <button
                              onClick={() => openEditResource(res)}
                              className="text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-950 transition-colors"
                            >
                              Edit Entry
                            </button>
                            <button
                              onClick={() => openDeleteResource(res._id)}
                              className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <aside className="bg-emerald-950 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden h-fit">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-400/5 rounded-full -mb-20 -mr-20" />
              <h3 className="text-xl font-black mb-10 text-yellow-400 flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
                Curriculum Stats
              </h3>

              <div className="space-y-8">
                <SideStat
                  label="Total Students"
                  value={String(subject?.children?.length || 0)}
                  icon={<Users size={16} />}
                />
                <SideStat
                  label="Faculty Members"
                  value={String(subject?.teachers?.length || 0)}
                  icon={<GraduationCap size={16} />}
                />
                <SideStat
                  label="Subject Reference"
                  value={subject?.code || "N/A"}
                  icon={<ToggleLeft size={16} />}
                  mono
                />

                <div className="pt-8 border-t border-white/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">
                    Subject Status
                  </p>
                  <p className="text-2xl font-black text-emerald-50">
                    {isActive ? "Active Course" : "On Hold"}
                  </p>
                </div>
              </div>
            </aside>

            <div className="bg-yellow-400 rounded-[3rem] p-10 text-emerald-950 shadow-xl shadow-yellow-400/10">
              <div className="p-4 bg-emerald-950 rounded-2xl text-yellow-400 w-fit mb-6">
                <Megaphone size={24} />
              </div>
              <h4 className="font-black text-2xl mb-3 tracking-tighter">
                Staff Broadcast
              </h4>
              <p className="text-emerald-900/60 font-bold leading-relaxed mb-8">
                Need to update the curriculum? Add announcements or lecture
                notes to keep your students informed.
              </p>
              {type === "admin" && (
                <button
                  onClick={openAddResource}
                  className="w-full bg-emerald-950 text-yellow-400 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-950/20"
                >
                  Quick Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Delete Subject Modal */}
        {isDeleteSubjectOpen && (
          <Modal onClose={closeDeleteSubject}>
            <div className="text-center">
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-4 tracking-tighter">
                Terminate Subject?
              </h3>
              <p className="text-emerald-800/60 font-medium mb-10 leading-relaxed px-4">
                This will{" "}
                <strong className="text-red-600">permanently erase</strong> the
                subject and all associated resources. This action cannot be
                reversed.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={confirmDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingSubject ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}{" "}
                  Confirm Delete
                </button>
                <button
                  onClick={closeDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add/Edit Class Modal */}
        {(isAddClassOpen || isEditClassOpen) && (
          <Modal onClose={isAddClassOpen ? closeAddClass : closeEditClass}>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">
                {isEditClassOpen ? "Edit Session" : "Schedule Class"}
              </h2>
              <button
                onClick={isAddClassOpen ? closeAddClass : closeEditClass}
                className="text-emerald-300 hover:text-emerald-950"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-6">
              <InputGroup
                label="Class Title"
                name="title"
                value={classForm.title}
                onChange={handleClassChange}
                required
                placeholder="e.g. Advanced Vector Math"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label="Date"
                  name="date"
                  type="date"
                  value={classForm.date}
                  onChange={handleClassChange}
                  required
                />
                <InputGroup
                  label="Start Time"
                  name="time"
                  type="time"
                  value={classForm.time}
                  onChange={handleClassChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40">
                  Duration
                </label>
                <select
                  name="duration"
                  value={classForm.duration}
                  onChange={handleClassChange}
                  className="w-full bg-emerald-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none transition-all appearance-none text-emerald-950"
                >
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={classSaving}
                className="w-full bg-emerald-900 text-yellow-400 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 mt-4"
              >
                {classSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}{" "}
                {isEditClassOpen ? "Update Schedule" : "Confirm Schedule"}
              </button>
            </form>
          </Modal>
        )}

        {/* Add/Edit Resource Modal */}
        {(isAddResourceOpen || isEditResourceOpen) && (
          <Modal
            onClose={isAddResourceOpen ? closeAddResource : closeEditResource}
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-emerald-950 tracking-tighter capitalize">
                {isEditResourceOpen ? "Update" : "Add"} {activeTab}
              </h2>
              <button
                onClick={
                  isAddResourceOpen ? closeAddResource : closeEditResource
                }
                className="text-emerald-300 hover:text-emerald-950"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveResource} className="space-y-6">
              <InputGroup
                label="Resource Title"
                name="title"
                value={resourceForm.title}
                onChange={handleResourceChange}
                required
                placeholder="e.g. Lecture Notes #04"
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={resourceForm.description}
                  onChange={handleResourceChange}
                  rows={4}
                  className="w-full bg-emerald-50 border-2 border-transparent focus:border-yellow-400 rounded-3xl p-5 font-bold outline-none transition-all placeholder:text-emerald-900/20"
                  placeholder="Provide context or instructions..."
                />
              </div>
              <button
                type="submit"
                disabled={resourceSaving}
                className="w-full bg-emerald-950 text-yellow-400 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/20 mt-4"
              >
                {resourceSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}{" "}
                {isEditResourceOpen ? "Save Changes" : `Post ${activeTab}`}
              </button>
            </form>
          </Modal>
        )}

        {/* Delete Class Confirmation */}
        {isDeleteClassOpen && (
          <Modal onClose={closeDeleteClass}>
            <div className="text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-3 tracking-tighter">
                Remove Session?
              </h3>
              <p className="text-emerald-800/60 font-medium mb-10">
                This will remove this class from the student calendar.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={confirmDeleteClass}
                  disabled={deletingClass}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50"
                >
                  {deletingClass ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
                <button
                  onClick={closeDeleteClass}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-4 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Resource Confirmation */}
        {isDeleteResourceOpen && (
          <Modal onClose={closeDeleteResource}>
            <div className="text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-3 tracking-tighter capitalize">
                Delete {activeTab}?
              </h3>
              <p className="text-emerald-800/60 font-medium mb-10 leading-relaxed italic">
                "Once deleted, students can no longer access this file."
              </p>
              <div className="flex gap-4">
                <button
                  onClick={confirmDeleteResource}
                  disabled={deletingResource}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs"
                >
                  {deletingResource ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : (
                    "Delete Now"
                  )}
                </button>
                <button
                  onClick={closeDeleteResource}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-4 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for cleaner code
const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] min-w-[140px] shadow-sm">
    <div className="flex items-center gap-2 text-yellow-400 mb-2 font-black text-[10px] uppercase tracking-widest opacity-80">
      {icon} {label}
    </div>
    <div className="text-2xl font-black tracking-tight">{value}</div>
  </div>
);

const SideStat = ({ label, value, icon, mono }: any) => (
  <div className="group">
    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
      {icon} {label}
    </p>
    <p
      className={`font-black ${
        mono
          ? "font-mono text-yellow-400 bg-emerald-900/40 p-3 rounded-xl inline-block text-sm border border-white/5"
          : "text-3xl text-emerald-50"
      }`}
    >
      {value}
    </p>
  </div>
);

const EmptyState = ({ icon, message }: any) => (
  <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-emerald-50 rounded-[3rem] text-center px-6">
    <div className="text-emerald-100 mb-6">{icon}</div>
    <p className="text-emerald-800/30 font-bold max-w-[240px] leading-relaxed italic text-lg">
      {message}
    </p>
  </div>
);

const Modal = ({ children, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-white rounded-[3.5rem] p-10 md:p-14 w-full max-w-xl shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

const InputGroup = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40 ml-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-emerald-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 font-bold outline-none transition-all placeholder:text-emerald-900/10 text-emerald-950"
    />
  </div>
);
