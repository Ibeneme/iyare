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
import ClassDetailsComponent from "./ClassDetailsComponent";
//import { FaEdit, FaTrash } from "react-icons/fa";
import { FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import WarningNotice from "./WarningNotice";
import ResourceManager from "./ResourceManager";

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

  // const [availableGrades, setAvailableGrades] = useState<DropdownOption[]>([]);
  // const [availableDepartments, setAvailableDepartments] = useState<
  //   DropdownOption[]
  // >([]);
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
        // getAllUsersByType("grade"),
        // getAllUsersByType("department"),
        getAllUsersByType("teacher"),
        getAllUsersByType("course"),
      ]);

      //if (gradesRes.success)
      //setAvailableGrades(gradesRes.data || []);
      // addToast("error", gradesRes.error || "Failed to fetch grades.");
      //else if (departmentsRes.success)
      // setAvailableDepartments(departmentsRes.data || []);

      console.log(teachersRes, "teachersRes");
      if (teachersRes.success) setAvailableTeachers(teachersRes.data || []);
      //else addToast("error", teachersRes.error || "Failed to fetch teachers.");

      if (coursesRes.success) setAvailableCourses(coursesRes.data || []);
      // else addToast("error", coursesRes.error || "Failed to fetch courses.");
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      addToast("error", "Failed to load class creation options.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    // if (isUpdateModalOpen) {
    //   fetchDropdownData();
    // }
    fetchDropdownData();
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

  return (
    <div className="">
      <ClassDetailsComponent
        classData={selectedClass}
        handleOpenDeleteModal={handleOpenDeleteModal}
        handleOpenUpdateModal={handleOpenUpdateModal}
        //formatDateTime={formatDateTime}
      />

      {/* <div className="class-details-container">
        <div className="class-details-buttons-centered" style={{ gap: 12 }}>
          <button onClick={handleOpenUpdateModal} className="gray-button">
            <FaEdit style={{ marginRight: "8px" }} />
            Update Class
          </button>
          <button onClick={handleOpenDeleteModal} className="gray-button">
            <FaTrash style={{ marginRight: "8px" }} />
            Delete Class
          </button>
        </div>
      </div> */}




      <div style={{backgroundColor:'#f4f4f4'}}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <ResourceManager classId={selectedClass?._id} />
        </div>
      </div>
      {isUpdateModalOpen && (
        <ModalDropdown onClose={handleCloseUpdateModal}>
          <div
            className="add-class-modal-content"
            style={{
              maxWidth: "520px",
              margin: "auto",
              background: "#fff",
              borderRadius: "12px",
            }}
          >
            <h2
              style={{
                marginBottom: "10px",
                fontSize: "1.3rem",
                fontWeight: 600,
              }}
            >
              Update Class
            </h2>

            <p
              style={{
                fontSize: 13,
                paddingBottom: 12,
                color: "#555",
                padding: 12,
                backgroundColor: "#66666621",
                borderRadius: 16,
              }}
            >
              Modify the details of this class as needed. You can change the
              title, course, associated teacher, schedule, and more. Once you're
              done, save your updates to apply the changes.
            </p>

            {isLoadingDropdowns ? (
              <Loader />
            ) : (
              <form onSubmit={handleUpdateSubmit}>
                {/* Class Title */}
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
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
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
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
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
                {/* <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Grade:
                    <select
                      name="gradeId"
                      value={updateFormData.gradeId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
                    >
                      <option value="">-- Select Grade --</option>
                      {availableGrades.map((grade) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.title || grade.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div> */}

                {/* Department */}
                {/* <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Department:
                    <select
                      name="departmentId"
                      value={updateFormData.departmentId}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
                    >
                      <option value="">-- Select Department --</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.title || dept.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div> */}

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
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
                    >
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher?.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Date & Time */}
                <div
                  style={{
                    marginBottom: "15px",
                    display: "flex",
                    gap: "10px",
                  }}
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
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
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
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
                    />
                  </label>
                </div>

                {/* Duration */}
                <div style={{ marginBottom: "20px" }}>
                  <label className="admin0dashboard-label">
                    Duration:
                    <select
                      name="duration"
                      value={updateFormData.duration}
                      onChange={handleUpdateChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
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

                {/* Buttons */}
                <div
                  className="modal-buttons"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseUpdateModal}
                    className="cancel-button"
                    style={{
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    style={{
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
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
          <div>
            <FaExclamationTriangle
              style={{ color: "#dc2626", fontSize: "64px" }}
            />

            <div
              style={{
                display: "flex",

                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  textAlign: "left",
                }}
              >
                Confirm Deletion
              </h2>
            </div>

            <p
              style={{
                fontSize: "14px",
                color: "#374151",
                marginBottom: "24px",
              }}
            >
              Are you sure you want to delete this class? This action cannot be
              undone.
            </p>

            <WarningNotice
              message={`You are about to permanently remove this class. 

This action is irreversible and all associated records, schedules, or student assignments linked to this class will be permanently lost. 

Please ensure this is intentional before proceeding.

If you’re unsure, click Cancel and review your options. Proceed only if you are absolutely certain.`}
            />
            <div
              style={{
                display: "flex",

                gap: "12px",
                flexWrap: "wrap",
                marginTop: 24,
              }}
            >
              <button
                onClick={handleCloseDeleteModal}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaTrashAlt />
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
