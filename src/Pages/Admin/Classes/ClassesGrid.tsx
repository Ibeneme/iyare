import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchClasses,
  createClass,
  ClassData as ReduxClassData,
  ClassFormInput,
} from "../../../Redux/Admin/adminClasses";
import "./ClassesGrid.css";
import { useUserActions } from "../../../Hooks/useUsers";
import { useToast } from "../../../Context/ToastProvider";
import Loader from "../../../Components/Loader/Loader";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import ClassCardList from "./ClassCardList";
import ErrorDisplay from "../../../Components/Loader/ErrorDisplay";
import useUserRole from "../../../Hooks/useUserRole";

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

    return {
      value: String(minutes),
      label: label,
    };
  });
};
const durationOptions = generateExactDurationOptions();

const ClassesGrid: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getAllUsersByType } = useUserActions();
  const dispatch = useDispatch<AppDispatch>();

  const [activeTab, setActiveTab] = useState<string>("all");
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

  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        getAllUsersByType("teacher"),
        getAllUsersByType("course"),
      ]);

      if (teachersRes.success) {
        setAvailableTeachers(teachersRes.data || []);
      } else {
        addToast("error", "Failed to load teachers for class creation.");
      }

      if (coursesRes.success) {
        setAvailableCourses(coursesRes.data || []);
      } else {
        addToast("error", "Failed to load courses for class creation.");
      }
    } catch (error) {
      addToast(
        "error",
        "An unexpected error occurred loading class creation options."
      );
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const navigateToClassDetails = (id: string) => {
    navigate(`/class-details/${id}`);
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
          setAllClasses(
            result.payload && Array.isArray(result.payload)
              ? result.payload
              : []
          );
          setError(null);
        } else if (fetchClasses.rejected.match(result)) {
          const errorPayload = result.payload as {
            message?: string;
            error?: string;
          };
          const errorMessage =
            result.error?.message === "Failed to fetch"
              ? "Failed to fetch classes. Please check your internet connection."
              : errorPayload?.message ||
                errorPayload?.error ||
                "Failed to load classes due to a server error.";
          addToast("error", errorMessage);
          setError(errorMessage);
        }
      })
      .catch((err) => {
        const errorMessage =
          err.message === "Failed to fetch"
            ? "Network error: Could not connect to the server."
            : "An unexpected error occurred while loading classes.";
        setError(errorMessage);
        addToast("error", errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClasses();
  }, [dispatch]);

  const uniqueCourses = Array.from(
    new Set(allClasses.map((c) => c.courseId?._id))
  )
    .map((courseId) => {
      const course = allClasses.find((c) => c.courseId?._id === courseId);
      return course?.courseId;
    })
    .filter(Boolean) as DropdownOption[];

    const filteredClasses = allClasses
    .filter((classData) => {
      // Filter by status first
      if (activeTab === "all") {
        return true;
      }
      return classData.status === activeTab;
    })
    .filter((classData) => {
      // Then filter by course
      if (selectedCourseId === "all") {
        return true;
      }
      return classData.courseId?._id === selectedCourseId;
    });
  const tabs = ["all", "ongoing", "upcoming", "finished", "canceled"];
  const courseFilters = [
    { _id: "all", title: "All Courses" },
    ...uniqueCourses.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    ),
  ];

  const handleOpenAddClassModal = () => {
    setIsAddClassModalOpen(true);
    setNewClassFormData({
      title: "",
      course: "",
      courseId: "",
      teacherId: "",
      date: "",
      time: "",
      duration: 0,
    });
  };

  const handleCloseAddClassModal = () => {
    setIsAddClassModalOpen(false);
  };

  const handleAddClassChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewClassFormData((prevData: any) => ({
      ...prevData,
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
      addToast("error", "Please fill all required fields.");
      return;
    }

    const selectedCourse = availableCourses.find(
      (c) => c._id === newClassFormData.courseId
    );

    if (!selectedCourse) {
      addToast(
        "error",
        "Selected course is invalid. Please choose from the list."
      );
      return;
    }

    const formDataWithCourseName = {
      ...newClassFormData,
      course: selectedCourse.title || selectedCourse.name || "",
    };

    const resultAction = await dispatch(createClass(formDataWithCourseName));

    if (createClass.fulfilled.match(resultAction)) {
      addToast("success", "Class added successfully!");
      setIsAddClassModalOpen(false);
      loadClasses();
    } else {
      const errorMessage =
        (resultAction.payload as { message?: string })?.message ||
        "Failed to add class due to an unknown error.";
      addToast("error", errorMessage);
    }
  };

  const { userRole, isSuperadmin, user } = useUserRole();

  return (
    <div style={{ marginTop: 24 }}>
      <h1 className="classes-title" style={{ fontSize: 20 }}>
        Dear
        {user?.firstName && ` ${user.firstName}`}
        {user?.lastName && ` ${user.lastName}`}, Here's All Classes
      </h1>
      <span
        style={{
          backgroundColor: `var(--yellow)`,
          color: `var(--dark-green)`,
          padding: `4px 12px`,
          borderRadius: 24,
          marginTop: 4,
          fontSize: 12,
          border: `1px var(--dark-green) solid`,
          fontWeight: 600,
        }}
      >
        {userRole && userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </span>
      <p
        style={{
          fontSize: "13px",
          color: "#555",
          maxWidth: "500px",
          marginTop: "8px",
          marginBottom: "16px",
        }}
      >
        Below is a list of all scheduled classes. You can view, edit, or remove
        existing sessions, or add a new one by clicking the button below.
      </p>

      {userRole === "admin" && isSuperadmin && (
        <button
          className="add-class-button"
          onClick={handleOpenAddClassModal}
          style={{ fontSize: 14, marginTop: 0 }}
        >
          Add a Class
        </button>
      )}

      <br />
      <br />
      <div className="tabss-container">
        <p className="filter-label">Filter by Status:</p>
        <div className="tabss">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
              }}
              className={`tab-button ${activeTab === tab ? "active" : ""} ${
                tab === "all" ? "all-tab-special" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="tabss-container" style={{ marginTop: "16px" }}>
        <p className="filter-label">Filter by Course:</p>
        <div className="tabss">
          {courseFilters.map((course) => (
            <button
              key={course._id}
              onClick={() => {
                setSelectedCourseId(course._id);
              }}
              className={`tab-button ${
                selectedCourseId === course._id ||
                (selectedCourseId === "" && course._id === "all")
                  ? "active"
                  : ""
              }`}
            >
              {course.title}
            </button>
          ))}
        </div>
      </div>

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

      {isAddClassModalOpen && (
        <ModalDropdown onClose={handleCloseAddClassModal}>
          <div
            className="add-class-modal-content"
            style={{ padding: "0px", margin: "auto", maxWidth: 450 }}
          >
            <h2 style={{ marginBottom: "12px", fontSize: "1.2rem" }}>
              Add New Class
            </h2>
            <p
              style={{
                fontSize: "13px",
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: "#66666621",
                marginBottom: "20px",
                color: "#555",
              }}
            >
              Please fill in the details below to schedule a new class session.
              Ensure that all fields are completed correctly before submitting.
            </p>
            {isLoadingDropdowns ? (
              <Loader />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveNewClass();
                }}
              >
                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Class Title:
                    <input
                      type="text"
                      name="title"
                      value={newClassFormData.title}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Course:
                    <select
                      name="courseId"
                      value={newClassFormData.courseId}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="">-- Select Course --</option>
                      {availableCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title || course.name || "Untitled Course"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Teacher:
                    <select
                      name="teacherId"
                      value={newClassFormData.teacherId}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option key="default" value="">
                        -- Select Teacher --
                      </option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.firstName ||
                            teacher.name ||
                            "Unnamed Teacher"}{" "}
                          {teacher.lastName || ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  style={{ marginBottom: "15px", display: "flex", gap: "10px" }}
                >
                  <label className="admin0dashboard-label" style={{ flex: 1 }}>
                    Date:
                    <input
                      type="date"
                      name="date"
                      value={newClassFormData.date}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>
                  <label className="admin0dashboard-label" style={{ flex: 1 }}>
                    Time:
                    <input
                      type="time"
                      name="time"
                      value={newClassFormData.time}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Duration:
                    <select
                      name="duration"
                      value={newClassFormData.duration}
                      onChange={handleAddClassChange}
                      required
                      className="admin0dashboard-input"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
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

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseAddClassModal}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "none",
                      background: "#28a745",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Add Class
                  </button>
                </div>
              </form>
            )}
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default ClassesGrid;