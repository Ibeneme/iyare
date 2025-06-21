import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux"; // Import Redux hooks
import { AppDispatch } from "../../../Redux/store"; // Adjust path to your Redux store
import {
  fetchClasses,
  createClass,
  ClassData as ReduxClassData, // Alias to avoid naming conflict
  ClassFormInput,
} from "../../../Redux/Admin/adminClasses"; // Import slice actions and types
import "./ClassesGrid.css";
import { useUserActions } from "../../../Hooks/useUsers";
import { useToast } from "../../../Context/ToastProvider";
import Loader from "../../../Components/Loader/Loader";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";

// Using the ClassData from Redux slice for consistency
type ClassData = ReduxClassData;

interface DropdownOption {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

// Remove mock data, we will fetch from Redux store
// const classes: ClassData[] = [...];

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
  const location = useLocation();
  const { addToast } = useToast();
  const { getAllUsersByType } = useUserActions();

  const dispatch = useDispatch<AppDispatch>();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
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

  const [newClassFormData, setNewClassFormData] = useState<ClassFormInput>({
    title: "",
    course: "", // Add course field
    courseId: "", // Add courseId field
    gradeId: "",
    departmentId: "",
    teacherId: "",
    date: "",
    time: "",
    duration: 0, // Initialize duration as number
  });

  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [gradesRes, departmentsRes, teachersRes, coursesRes] =
        await Promise.all([
          getAllUsersByType("grade"),
          getAllUsersByType("department"),
          getAllUsersByType("teacher"),
          getAllUsersByType("course"), // Fetch courses
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

      if (coursesRes.success)
        setAvailableCourses(coursesRes.data || []); // Set courses
      else addToast("error", coursesRes.error || "Failed to fetch courses.");
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      addToast("error", "Failed to load class creation options.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Fetch dropdown data (grades, departments, teachers, courses) when modal opens
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const navigateToClassDetails = (id: string) => {
    navigate(`/class-details/${id}`);
  };

  const getRandomBgColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = () => {
    setLoading(true);
    dispatch(fetchClasses())
      .then((result) => {
        if (fetchClasses.fulfilled.match(result)) {
          console.log(result.payload);
          // ✅ Narrow result.payload here
          //const payload = result.payload as { data: ClassData[] };
          setAllClasses(result.payload || []);
          setError(null);
        } else if (fetchClasses.rejected.match(result)) {
          // ✅ Narrow error payload here
          const errorPayload = result.payload as { message?: string };
          setError(errorPayload?.message || "Failed to fetch classes");
        }
      })
      .catch((err) => {
        console.error("Dispatch error:", err);
        setError("An unexpected error occurred");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClasses();
  }, [dispatch]);

  const filteredClasses =
    activeTab === "all"
      ? allClasses
      : allClasses.filter((classData: any) => classData.status === activeTab);

  const tabs = ["all", "ongoing", "upcoming", "finished", "canceled"];

  const handleOpenAddClassModal = () => {
    setIsAddClassModalOpen(true);
    setNewClassFormData({
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
      [name]: name === "duration" ? Number(value) : value, // Convert duration to number
    }));
  };

  const handleSaveNewClass = async () => {
    console.log(newClassFormData, "newClassFormData");
    if (
      !newClassFormData.title ||
      !newClassFormData.courseId || // Check for courseId
      !newClassFormData.departmentId ||
      !newClassFormData.teacherId ||
      !newClassFormData.gradeId ||
      !newClassFormData.date ||
      !newClassFormData.time ||
      !newClassFormData.duration

      //||
      // !newClassFormData.course // Check for course title
    ) {
      addToast("error", "Please fill all required fields.");
      return;
    }

    // Assign the course title from the selected courseId
    const selectedCourse = availableCourses.find(
      (c) => c._id === newClassFormData.courseId
    );
    const formDataWithCourseName = {
      ...newClassFormData,
      course: selectedCourse
        ? selectedCourse.title || selectedCourse.name || ""
        : newClassFormData.course,
    };

    const resultAction = await dispatch(createClass(formDataWithCourseName));

    if (createClass.fulfilled.match(resultAction)) {
      addToast("success", "Class added successfully!");
      setIsAddClassModalOpen(false);
    } else {
      addToast("error", resultAction.payload || "Failed to add class.");
    }
  };

  const isAllRoute = location.pathname.endsWith("/all");

  return (
    <div style={{ marginTop: 72 }}>
      <h1 className="classes-title">All Classes</h1>
      <br />
      <button className="add-class-button" onClick={handleOpenAddClassModal}>
        Add a Class
      </button>
      <br />
      <br />
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? "active" : ""} ${
              tab === "all" ? "all-tab-special" : ""
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        {isAllRoute && (
          <button
            className="add-class-button"
            onClick={handleOpenAddClassModal}
          >
            Add a Class
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>
      ) : filteredClasses.length > 0 ? (
        <div className="classes-grid">
          {filteredClasses.map((classData: any) => (
            <div
              key={classData._id}
              className="class-item clickable"
              onClick={() => navigateToClassDetails(classData._id)}
            >
              <div
                className="class-image-placeholder"
                style={{ backgroundColor: getRandomBgColor() }}
              >
                <h3>{classData.title}</h3>
              </div>
              <div className="class-info">
                <p>
                  Department:{" "}
                  {typeof classData.departmentId === "object"
                    ? classData.departmentId.title ||
                      classData.departmentId.name
                    : classData.departmentId}
                </p>
                <p>
                  Teacher:{" "}
                  {typeof classData.teacherId === "object"
                    ? `${classData.teacherId.firstName || ""} ${
                        classData.teacherId.lastName || ""
                      }`
                    : classData.teacherId}
                </p>
                <p className="class-date">
                  {`${classData.time} ${new Date(
                    classData.date || ""
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent onClick
                    navigateToClassDetails(classData._id);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "left", padding: "16px 0", color: "#999" }}>
          No classes found.{" "}
          {allClasses.length === 0 && "Click 'Add a Class' to get started!"}
        </p>
      )}

      {isAddClassModalOpen && (
        <ModalDropdown onClose={handleCloseAddClassModal}>
          <div
            className="add-class-modal-content"
            style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}
          >
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
              Add New Class
            </h2>

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
                          {course.title || course.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Grade:
                    <select
                      name="gradeId"
                      value={newClassFormData.gradeId}
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
                      <option value="">-- Select Grade --</option>
                      {availableGrades.map((grade) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.title || grade.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label className="admin0dashboard-label">
                    Department:
                    <select
                      name="departmentId"
                      value={newClassFormData.departmentId}
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
                      <option value="">-- Select Department --</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.title || dept.name}
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
                      <option value="">-- Select Teacher --</option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
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
