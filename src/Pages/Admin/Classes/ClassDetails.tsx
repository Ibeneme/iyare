import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchClassById,
  clearSelectedClass,
  updateClass,
  deleteClass,
  ClassFormInput,
} from "../../../Redux/Admin/adminClasses";
import Loader from "../../../Components/Loader/Loader";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import { useToast } from "../../../Context/ToastProvider";
import { useUserActions } from "../../../Hooks/useUsers";
import ClassDetailsComponent from "./ClassDetailsComponent";
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
  if (error) return <p className="text-center text-red-600 py-8">{error}</p>;
  if (!selectedClass)
    return <p className="text-center text-gray-500 py-8">No class found.</p>;

  return (
    <div className="px-4 md:px-0">
      {/* Class Details */}
      <ClassDetailsComponent
        classData={selectedClass}
        handleOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        handleOpenDeleteModal={() => setIsDeleteModalOpen(true)}
      />

      {/* Resources */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-10 mt-10 rounded-2xl">
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
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl mx-4 md:mx-auto border border-white/20 pt-8"
            >
              {/* Gradient Border Top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-3xl" />

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Update Class
              </h2>
              <p className="text-sm text-gray-600 mb-6">
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
                      className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Class Title"
                    />
                    <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-600">
                      Class Title
                    </label>
                  </div>

                  {/* Course */}
                  <div className="relative">
                    <select
                      name="courseId"
                      value={updateFormData.courseId}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    >
                      <option value="">-- Select Course --</option>
                      {availableCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title || c.name}
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all">
                      Course
                    </label>
                  </div>

                  {/* Teacher */}
                  <div className="relative">
                    <select
                      name="teacherId"
                      value={updateFormData.teacherId}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    >
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName} {t.name && `(${t.name})`}
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all">
                      Teacher
                    </label>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={updateFormData.date}
                        onChange={handleUpdateChange}
                        required
                        className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all">
                        Date
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="time"
                        name="time"
                        value={updateFormData.time}
                        onChange={handleUpdateChange}
                        required
                        className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all">
                        Time
                      </label>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="relative">
                    <select
                      name="duration"
                      value={updateFormData.duration}
                      onChange={handleUpdateChange}
                      required
                      className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    >
                      <option value="">-- Select Duration --</option>
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all">
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
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
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
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg"
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
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl mx-4 md:mx-auto border border-white/20 pt-8"
              >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-t-3xl" />

              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Delete Class?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                This action{" "}
                <span className="font-semibold text-red-600">
                  cannot be undone
                </span>
                .
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
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
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
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
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg flex items-center gap-2"
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
