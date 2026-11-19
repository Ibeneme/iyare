import { PATHS } from "../../../routes/paths";
import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DateInput";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import {
  fetchClasses,
  createClass,
  ClassData as ReduxClassData,
  ClassFormInput,
} from "../../../store/features/classes/legacyAdminClasses.slice";
import { useUserActions } from "../../../hooks/useUsers";
import { useToast } from "../../../contexts/ToastContext";
import Loader from "../../../components/common/Loader";
import ModalDropdown from "../../../components/common/Modal";
import ClassCardList from "./ClassCardList";
import ErrorDisplay from "../../../components/common/ErrorDisplay";
import useUserRole from "../../../hooks/useUserRole";
import { motion, AnimatePresence } from "framer-motion";

type ClassData = ReduxClassData;

interface DropdownOption {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
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

const ClassesGrid: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getAllUsersByType } = useUserActions();
  const dispatch = useDispatch<AppDispatch>();

  const [activeTab, setActiveTab] = useState("all");
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<DropdownOption[]>(
    []
  );
  const [availableCourses, setAvailableCourses] = useState<DropdownOption[]>(
    []
  );
  const [newClassFormData, setNewClassFormData] = useState<ClassFormInput>({
    title: "",
    course: "",
    courseId: "",
    teacherId: "",
    date: "",
    time: "",
    duration: 0,
  });

  const [selectedCourseId, setSelectedCourseId] = useState("all");

  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        getAllUsersByType("teacher"),
        getAllUsersByType("course"),
      ]);

      if (teachersRes.success) setAvailableTeachers(teachersRes.data || []);
      else addToast("error", "Failed to load teachers.");

      if (coursesRes.success) setAvailableCourses(coursesRes.data || []);
      else addToast("error", "Failed to load courses.");
    } catch {
      addToast("error", "Failed to load dropdown options.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const navigateToClassDetails = (id: string) => {
    navigate(`/app/classes/${id}`);
  };

  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = () => {
    setLoading(true);
    setError(null);
    dispatch(fetchClasses())
      .then((result) => {
        if (fetchClasses.fulfilled.match(result)) {
          setAllClasses(Array.isArray(result.payload) ? result.payload : []);
        } else {
          const msg = "Failed to load classes.";
          addToast("error", msg);
          setError(msg);
        }
      })
      .catch(() => {
        const msg = "Network error.";
        addToast("error", msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClasses();
  }, [dispatch]);

  const uniqueCourses = Array.from(
    new Set(allClasses.map((c) => c.courseId?._id))
  )
    .map((id) => allClasses.find((c) => c.courseId?._id === id)?.courseId)
    .filter(Boolean) as DropdownOption[];

  const filteredClasses = allClasses
    .filter((c) => activeTab === "all" || c.status === activeTab)
    .filter(
      (c) => selectedCourseId === "all" || c.courseId?._id === selectedCourseId
    );

  const tabs = ["all", "ongoing", "upcoming", "finished", "canceled"];
  const courseFilters = [
    { _id: "all", title: "All Courses" },
    ...uniqueCourses.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    ),
  ];


  const handleCloseAddClassModal = () => setIsAddClassModalOpen(false);

  const handleAddClassChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>
  ) => {
    const { name, value } = e.target;
    setNewClassFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value,
    }));
  };

  const handleSaveNewClass = async () => {
    if (
      !newClassFormData.title ||
      !newClassFormData.courseId ||
      !newClassFormData.teacherId ||
      !newClassFormData.date ||
      !newClassFormData.time ||
      !newClassFormData.duration
    ) {
      addToast("error", "Please fill all fields.");
      return;
    }

    const selectedCourse = availableCourses.find(
      (c) => c._id === newClassFormData.courseId
    );
    if (!selectedCourse) {
      addToast("error", "Invalid course selected.");
      return;
    }

    const result = await dispatch(
      createClass({
        ...newClassFormData,
        course: selectedCourse.title || selectedCourse.name || "",
      })
    );

    if (createClass.fulfilled.match(result)) {
      addToast("success", "Class added!");
      setIsAddClassModalOpen(false);
      loadClasses();
    } else {
      addToast("error", result.payload || "Failed to add class.");
    }
  };

  const { userRole, isSuperadmin, user } = useUserRole();

  return (
    <div className="mt-8 p-4 md:p-8">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-[var(--color-primary)]"
      >
        Dear
        {user?.firstName && ` ${user.firstName}`}
        {user?.lastName && ` ${user.lastName}`}, Here's All Classes
      </motion.h1>

      <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] bg-yellow-300 rounded-full border border-emerald-900">
        {userRole && userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </span>

      <p className="mt-2 text-sm text-[var(--color-muted)] max-w-lg">
        Below is a list of all scheduled classes. You can view, edit, or remove
        existing sessions, or add a new one.
      </p>

      {/* Add Class Button */}
      {userRole === "admin" && isSuperadmin && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(PATHS.classNew)}
          className="mt-4 px-5 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-full hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          Add a Class
        </motion.button>
      )}

      {/* Tabs: Status Filter */}
      <div className="mt-6">
        <p className="text-sm font-medium text-[var(--color-muted)] mb-2">
          Filter by Status:
        </p>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
 activeTab === tab
 ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
              } ${tab === "all" ? "font-semibold" : ""}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Course Filter */}
      <div className="mt-4">
        <p className="text-sm font-medium text-[var(--color-muted)] mb-2">
          Filter by Course:
        </p>
        <div className="flex flex-wrap gap-2">
          {courseFilters.map((course) => (
            <motion.button
              key={course._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCourseId(course._id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
 selectedCourseId === course._id
 ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
              }`}
            >
              {course.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorDisplay errorMessage={error} onRetry={loadClasses} />
        ) : (
          <ClassCardList
            classes={filteredClasses}
            loading={loading}
            error={null}
            allClassesCount={allClasses.length}
            navigateToClassDetails={navigateToClassDetails}
          />
        )}
      </div>

      {/* Add Class Modal */}
      <AnimatePresence>
        {isAddClassModalOpen && (
          <ModalDropdown onClose={handleCloseAddClassModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[var(--color-card)] rounded-2xl p-6 max-w-md w-full mx-auto"
            >
              <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-3">
                Add New Class
              </h2>
              <p className="text-sm text-[var(--color-muted)] bg-[var(--color-surface)] p-3 rounded-lg mb-5">
                Fill in the details to schedule a new class session.
              </p>

              {isLoadingDropdowns ? (
                <Loader />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveNewClass();
                  }}
                  className="space-y-4"
                >
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                      Class Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newClassFormData.title}
                      onChange={handleAddClassChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                    />
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                      Course
                    </label>
                    <Select
                      name="courseId"
                      value={newClassFormData.courseId}
                      onChange={handleAddClassChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                    >
                      <option value="">-- Select Course --</option>
                      {availableCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title || course.name || "Untitled"}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                      Teacher
                    </label>
                    <Select
                      name="teacherId"
                      value={newClassFormData.teacherId}
                      onChange={handleAddClassChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                    >
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.firstName || teacher.name || "Unnamed"}{" "}
                          {teacher.lastName || ""}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        Date
                      </label>
                      <DateInput
                        type="date"
                        name="date"
                        value={newClassFormData.date}
                        onChange={handleAddClassChange}
                        required
                        className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        Time
                      </label>
                      <DateInput
                        type="time"
                        name="time"
                        value={newClassFormData.time}
                        onChange={handleAddClassChange}
                        required
                        className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                      Duration
                    </label>
                    <Select
                      name="duration"
                      value={newClassFormData.duration}
                      onChange={handleAddClassChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-card-border)] focus:border-[var(--color-primary)] outline-none transition"
                    >
                      <option value="">-- Select Duration --</option>
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleCloseAddClassModal}
                      className="px-5 py-2 text-sm font-medium text-[var(--color-muted)] bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-alt)] transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-5 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-full hover:bg-[var(--color-brand-hover)] transition"
                    >
                      Add Class
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </ModalDropdown>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassesGrid;
