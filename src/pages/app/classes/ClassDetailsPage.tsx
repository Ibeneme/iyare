import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DateInput";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import {
  fetchClassById,
  clearSelectedClass,
  updateClass,
  deleteClass,
  ClassFormInput,
} from "../../../store/features/classes/legacyAdminClasses.slice";
import Loader from "../../../components/common/Loader";
import ModalDropdown from "../../../components/common/Modal";
import { useToast } from "../../../contexts/ToastContext";
import { useUserActions } from "../../../hooks/useUsers";
import ClassDetailsComponent from "./ClassDetailsPanel";
import { FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import ResourceManager from "./ResourceManager";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownOption {
  _id: string;
  title?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

const generateExactDurationOptions = (): { value: string; label: string }[] => {
  const durationsInMinutes = [
    30, 45, 60, 80, 90, 105, 120, 140, 150, 165, 180, 210, 225, 240, 270, 300,
  ];
  return durationsInMinutes.map((minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let label = "";
    if (hours > 0) {
      label += `${hours}hr`;
      if (remainingMinutes > 0) {
        label += `:${remainingMinutes < 10 ? "0" : ""}${remainingMinutes}mins`;
      } else {
        label += "s";
      }
    } else {
      label += `${remainingMinutes}mins`;
    }
    if (minutes === 60) label = "1hr";
    if (minutes === 120) label = "2hrs";
    if (minutes === 180) label = "3hrs";
    if (minutes === 240) label = "4hrs";
    if (minutes === 300) label = "5hrs";
    return { value: String(minutes), label };
  });
};

const durationOptions = generateExactDurationOptions();

const ClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getAllUsersByType } = useUserActions();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  const [availableTeachers, setAvailableTeachers] = useState<DropdownOption[]>(
    []
  );
  const [availableCourses, setAvailableCourses] = useState<DropdownOption[]>(
    []
  );

  const [updateFormData, setUpdateFormData] = useState<ClassFormInput>({
    title: "",
    course: "",
    courseId: "",
    gradeId: "",
    departmentId: "",
    teacherId: "",
    date: "",
    time: "",
    duration: 0,
  });

  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        getAllUsersByType("teacher"),
        getAllUsersByType("course"),
      ]);
      if (teachersRes.success) setAvailableTeachers(teachersRes.data || []);
      if (coursesRes.success) setAvailableCourses(coursesRes.data || []);
    } catch {
      addToast("error", "Failed to load options.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [isUpdateModalOpen]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    dispatch(fetchClassById(id))
      .then((result) => {
        if (fetchClassById.fulfilled.match(result)) {
          const classData = result.payload?.data;
          setSelectedClass(classData);
          setUpdateFormData({
            title: classData?.title || "",
            course: classData?.courseId?._id || "",
            courseId: classData?.courseId?._id || "",
            gradeId: classData?.gradeId?._id || "",
            departmentId: classData?.departmentId?._id || "",
            teacherId: classData?.teacherId?._id || "",
            date: classData?.date
              ? new Date(classData.date).toISOString().split("T")[0]
              : "",
            time: classData?.time || "",
            duration: classData?.duration || 0,
          });
        } else {
          setError("Failed to fetch class.");
        }
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));

    return () => {
      dispatch(clearSelectedClass());
    };
  }, [dispatch, id]);

  const handleUpdateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value,
    }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const result = await dispatch(updateClass({ id, data: updateFormData }));
    if (updateClass.fulfilled.match(result)) {
      addToast("success", "Class updated!");
      setIsUpdateModalOpen(false);
      dispatch(fetchClassById(id)).then((res) => {
        if (fetchClassById.fulfilled.match(res))
          setSelectedClass(res.payload?.data);
      });
    } else {
      addToast("error", "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await dispatch(deleteClass(id));
    if (deleteClass.fulfilled.match(result)) {
      addToast("success", "Class deleted!");
      navigate(-1);
    } else {
      addToast("error", "Delete failed.");
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-center text-[var(--color-danger)] py-8">{error}</p>;
  if (!selectedClass)
    return <p className="text-center text-[var(--color-muted)] py-8">No class found.</p>;

  return (
    <div className="px-4 md:px-0">
      {/* Class Details */}
      <ClassDetailsComponent
        classData={selectedClass}
        handleOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        handleOpenDeleteModal={() => setIsDeleteModalOpen(true)}
      />

      {/* Resources */}
      <div className="py-10 mt-10">
        <div className="max-w-4xl mx-auto px-4">
          <ResourceManager classId={selectedClass?._id} />
        </div>
      </div>

      {/* Update Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <ModalDropdown onClose={() => setIsUpdateModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-[var(--color-card)] backdrop-blur-xl rounded-3xl mx-4 md:mx-auto border border-white/20 pt-8"
            >
              {/* Gradient Border Top */}
              <div className="hidden" />

              <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                Update Class
              </h2>
              <p className="text-sm text-[var(--color-muted)] mb-6">
                Make changes and save to update the class.
              </p>

              {isLoadingDropdowns ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  {/* Floating Label Input */}
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={updateFormData.title}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                      placeholder="Class Title"
                    />
                    <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-[var(--color-subtle)] peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-success)]">
                      Class Title
                    </label>
                  </div>

                  {/* Course */}
                  <div className="relative">
                    <Select
                      name="courseId"
                      value={updateFormData.courseId}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                    >
                      <option value="">-- Select Course --</option>
                      {availableCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title || c.name}
                        </option>
                      ))}
                    </Select>
                    <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all">
                      Course
                    </label>
                  </div>

                  {/* Teacher */}
                  <div className="relative">
                    <Select
                      name="teacherId"
                      value={updateFormData.teacherId}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                    >
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName} {t.name && `(${t.name})`}
                        </option>
                      ))}
                    </Select>
                    <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all">
                      Teacher
                    </label>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <DateInput
                        type="date"
                        name="date"
                        value={updateFormData.date}
                        onChange={handleUpdateChange}
                        required
                        className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                      />
                      <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all">
                        Date
                      </label>
                    </div>
                    <div className="relative">
                      <DateInput
                        type="time"
                        name="time"
                        value={updateFormData.time}
                        onChange={handleUpdateChange}
                        required
                        className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                      />
                      <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all">
                        Time
                      </label>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="relative">
                    <Select
                      name="duration"
                      value={updateFormData.duration}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-transparent transition"
                    >
                      <option value="">-- Select Duration --</option>
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    <label className="absolute left-4 -top-2.5 bg-[var(--color-card)] px-2 text-xs font-medium text-[var(--color-success)] transition-all">
                      Duration
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="px-6 py-3 text-sm font-medium text-[var(--color-muted)] bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-3 text-sm font-medium text-[var(--color-brand-fg)] bg-[var(--color-brand)] rounded-full hover:bg-[var(--color-brand-hover)] hover:to-emerald-700 transition"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </ModalDropdown>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <ModalDropdown onClose={() => setIsDeleteModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-[var(--color-card)] backdrop-blur-xl rounded-3xl mx-4 md:mx-auto border border-white/20 pt-8"
              >
              <div className="hidden" />

              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-[var(--color-danger-bg)] rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="w-10 h-10 text-[var(--color-danger)]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-3">
                Delete Class?
              </h2>
              <p className="text-sm text-[var(--color-muted)] mb-6">
                This action{" "}
                <span className="font-semibold text-[var(--color-danger)]">
                  cannot be undone
                </span>
                .
              </p>

              <div className="bg-[var(--color-danger-bg)] border border-red-200 rounded-xl p-4 mb-6">
                <p>
                  You are about to permanently remove this class. This action is
                  irreversible and all associated records, schedules, or student
                  assignments linked to this class will be permanently lost.
                  Please ensure this is intentional before proceeding. If you’re
                  unsure, click Cancel and review your options. Proceed only if
                  you are absolutely certain.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-3 text-sm font-medium text-[var(--color-muted)] bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(220, 38, 38, 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="px-6 py-3 text-sm font-medium text-white bg-[var(--color-danger)] rounded-full hover:brightness-95 transition flex items-center gap-2"
                >
                  <FaTrashAlt className="w-4 h-4" />
                  Delete Class
                </motion.button>
              </div>
            </motion.div>
          </ModalDropdown>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassDetails;
