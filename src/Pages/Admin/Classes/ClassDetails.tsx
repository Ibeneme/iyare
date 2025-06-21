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
import "./ClassDetails.css";

interface DropdownOption {
  _id: string;
  title?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatDateTime = (dateStr: string, timeStr: string): string => {
  try {
    const dateObj = new Date(dateStr);

    // Set time if available
    if (timeStr && timeStr.includes(":")) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        dateObj.setHours(hours);
        dateObj.setMinutes(minutes);
      }
    }

    const day = dateObj.getDate();
    const suffix = getOrdinalSuffix(day);

    const weekday = dateObj.toLocaleDateString("en-GB", { weekday: "long" });
    const monthYear = dateObj.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const time = dateObj.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "GMT",
    });

    return `${weekday} ${day}${suffix} ${monthYear}, ${time} GMT`;
  } catch (err) {
    console.error("formatDateTime error:", err);
    return "Invalid date";
  }
};

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

    return {
      value: String(minutes),
      label: label,
    };
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

  const [availableGrades, setAvailableGrades] = useState<DropdownOption[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<
    DropdownOption[]
  >([]);
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
      const [gradesRes, departmentsRes, teachersRes, coursesRes] =
        await Promise.all([
          getAllUsersByType("grade"),
          getAllUsersByType("department"),
          getAllUsersByType("teacher"),
          getAllUsersByType("course"),
        ]);

      if (gradesRes.success) setAvailableGrades(gradesRes.data || []);
      else addToast("error", gradesRes.error || "Failed to fetch grades.");

      if (departmentsRes.success)
        setAvailableDepartments(departmentsRes.data || []);
      else
        addToast(
          "error",
          departmentsRes.error || "Failed to fetch departments."
        );

      if (teachersRes.success) setAvailableTeachers(teachersRes.data || []);
      else addToast("error", teachersRes.error || "Failed to fetch teachers.");

      if (coursesRes.success) setAvailableCourses(coursesRes.data || []);
      else addToast("error", coursesRes.error || "Failed to fetch courses.");
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      addToast("error", "Failed to load class creation options.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    if (isUpdateModalOpen) {
      fetchDropdownData();
    }
  }, [isUpdateModalOpen]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      dispatch(fetchClassById(id))
        .then((result) => {
          console.log(result);
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
            setError(null);
          } else if (fetchClassById.rejected.match(result)) {
            const err = result.payload as { message?: string };
            setError(err?.message || "Failed to fetch class details.");
          }
        })
        .catch((err) => {
          console.error("Unexpected error:", err);
          setError("Something went wrong while loading the class details.");
        })
        .finally(() => setLoading(false));
    }

    return () => {
      dispatch(clearSelectedClass());
      setSelectedClass(null);
      setError(null);
      setLoading(false);
    };
  }, [dispatch, id]);

  const handleOpenUpdateModal = () => setIsUpdateModalOpen(true);
  const handleCloseUpdateModal = () => setIsUpdateModalOpen(false);

  const handleOpenDeleteModal = () => setIsDeleteModalOpen(true);
  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

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
      addToast("success", "Class updated successfully!");
      handleCloseUpdateModal();
      // Refetch class details to show updated data
      dispatch(fetchClassById(id)).then((resultAction) => {
        if (fetchClassById.fulfilled.match(resultAction)) {
          setSelectedClass(resultAction.payload?.data);
        }
      });
    } else {
      addToast("error", "Failed to update class.");
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const result = await dispatch(deleteClass(id));
    if (deleteClass.fulfilled.match(result)) {
      addToast("success", "Class deleted successfully!");
      navigate(-1);
    } else {
      addToast("error", "Failed to delete class.");
      handleCloseDeleteModal();
    }
  };

  if (loading) return <Loader />;
  if (error)
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!selectedClass)
    return <p style={{ textAlign: "center" }}>No class data found.</p>;

  const {
    title,
    date,
    time,
    duration,
    courseId,
    departmentId,
    teacherId,
    gradeId,
    status,
  } = selectedClass;

  return (
    <div className="class-details-container">
      <h1 className="class-details-title">{title}</h1>
      <p className="class-details-item">
        <strong>Status:</strong> {status}
      </p>
      <p className="class-details-item">
        <p className="class-details-item">
          <strong>Date:</strong> {formatDateTime(date, time)}
        </p>
      </p>
      <p className="class-details-item">
        <strong>Duration:</strong> {duration} mins
      </p>
      <p className="class-details-item">
        <strong>Course:</strong> {courseId?.title || courseId?.name}
      </p>
      <p className="class-details-item">
        <strong>Grade:</strong> {gradeId?.title || gradeId?.name}
      </p>
      <p className="class-details-item">
        <strong>Department:</strong> {departmentId?.title || departmentId?.name}
      </p>
      <p className="class-details-item">
        <strong>Teacher:</strong> {teacherId?.firstName} {teacherId?.lastName}
      </p>

      <div className="class-details-buttons">
        <button onClick={handleOpenUpdateModal} className="update-button">
          Update Class
        </button>
        <button onClick={handleOpenDeleteModal} className="delete-button">
          Delete Class
        </button>
      </div>

      {isUpdateModalOpen && (
        <ModalDropdown onClose={handleCloseUpdateModal}>
          <div
            className="add-class-modal-content"
            style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}
          >
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
              Update Class
            </h2>
            {isLoadingDropdowns ? (
              <Loader />
            ) : (
              <form onSubmit={handleUpdateSubmit}>
                {/* Form fields are similar to the Add Class modal, but pre-filled */}
                {/* Title */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Class Title:
                    <input
                      type="text"
                      name="title"
                      value={updateFormData.title}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    />
                  </label>
                </div>
                {/* Course */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Course:
                    <select
                      name="courseId"
                      value={updateFormData.courseId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    >
                      <option value="">-- Select Course --</option>
                      {availableCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title || course.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {/* Grade */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Grade:
                    <select
                      name="gradeId"
                      value={updateFormData.gradeId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    >
                      <option value="">-- Select Grade --</option>
                      {availableGrades.map((grade) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.title || grade.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {/* Department */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Department:
                    <select
                      name="departmentId"
                      value={updateFormData.departmentId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    >
                      <option value="">-- Select Department --</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.title || dept.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {/* Teacher */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Teacher:
                    <select
                      name="teacherId"
                      value={updateFormData.teacherId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    >
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {/* Date and Time */}
                <div
                  style={{ marginBottom: "15px", display: "flex", gap: "10px" }}
                >
                  <label className="admin0dashboard-label" style={{ flex: 1 }}>
                    Date:
                    <input
                      type="date"
                      name="date"
                      value={updateFormData.date}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    />
                  </label>
                  <label className="admin0dashboard-label" style={{ flex: 1 }}>
                    Time:
                    <input
                      type="time"
                      name="time"
                      value={updateFormData.time}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    />
                  </label>
                </div>
                {/* Duration */}
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Duration:
                    <select
                      name="duration"
                      value={updateFormData.duration}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                    >
                      <option value="">-- Select Duration --</option>
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={handleCloseUpdateModal}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </ModalDropdown>
      )}

      {isDeleteModalOpen && (
        <ModalDropdown onClose={handleCloseDeleteModal}>
          <div className="delete-modal-content">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this class?</p>
            <div className="modal-buttons">
              <button
                onClick={handleCloseDeleteModal}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="delete-confirm-button">
                Delete
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default ClassDetails;
