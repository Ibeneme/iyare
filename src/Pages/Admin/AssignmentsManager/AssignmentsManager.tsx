import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getAllResources } from "../../../Redux/Resource/Resource";
import { AppDispatch } from "../../../Redux/store";
import { FaChevronDown } from "react-icons/fa";
import Loader from "../../../Components/Loader/Loader";
import "./AssignmentsManager.css";

// --- Types for API Response ---
export type ResourceData = {
  _id: string;
  classId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

interface ResourcesByClass {
  assignments: ResourceData[];
  notes: ResourceData[];
  announcements: ResourceData[];
}

interface ClassWithResources {
  _id: string;
  title: string;
  courseId: string;
  studentIds: string[];
  teacherId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  resources: ResourcesByClass;
  createdAt: string;
  updatedAt: string;
}

// Parent data interface (not changed)
interface ParentData {
  childId: string;
  classes: ClassWithResources[];
}

// --- Main Component ---
const AssignmentsManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [studentClasses, setStudentClasses] = useState<ClassWithResources[]>(
    []
  );
  const [teacherClasses, setTeacherClasses] = useState<ClassWithResources[]>(
    []
  );
  const [parentData, setParentData] = useState<ParentData[]>([]);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openClassId, setOpenClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({});

  const fetchAllResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = (await dispatch(getAllResources())) as any;
      console.log(result, "result");
      // Use a type guard to ensure the result matches ApiResponse
      if ("student" in result.payload && result.payload.student) {
        setStudentClasses(result.payload.data);
        setIsStudent(true);
      } else if ("parent" in result.payload && result.payload.parent) {
        setParentData(result.payload.data);
        setIsStudent(false);
      } else if ("teacher" in result.payload && result.payload.teacher) {
        setTeacherClasses(result.payload.data);
        setIsStudent(false); // still false because not student
      } else {
        throw new Error("Unexpected API response structure.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllResources();
  }, [dispatch]);

  const handleAccordionToggle = (classId: string) => {
    setOpenClassId((prevOpenClassId) =>
      prevOpenClassId === classId ? null : classId
    );
    // Set default tab to 'assignments' when a class is opened
    if (openClassId !== classId) {
      setActiveTab((prevTabs) => ({
        ...prevTabs,
        [classId]: "assignments",
      }));
    }
  };

  const handleTabChange = (classId: string, tab: string) => {
    setActiveTab((prevTabs) => ({
      ...prevTabs,
      [classId]: tab,
    }));
  };

  const renderResourceList = (
    resources: ResourceData[],
    resourceType: string
  ) => {
    if (resources.length === 0) {
      return (
        <li className="no-resources">
          <h3>No {resourceType} Available 📭</h3>
          <p>
            We couldn’t find any {resourceType?.toLowerCase()} for this class at
            the moment. Please check back later, as new resources are added
            regularly to support your learning experience.
          </p>
        </li>
      );
    }

    return resources.map((resource) => (
      <li key={resource._id} className="resource-card">
        <h4 className="resource-title">{resource.title}</h4>
        <p className="resource-description">{resource.description}</p>
      </li>
    ));
  };

  const renderResources = (classes: ClassWithResources[]) => {
    if (classes.length === 0) {
      return (
        <div className="empty-state">
          <h2 className="empty-header">No updates found yet 😌</h2>
          <p className="empty-description">No updates found yet</p>
        </div>
      );
    }

    return (
      <div className="accordion-list">
        {classes.map((classItem) => (
          <div key={classItem._id} className="accordion-item">
            <div
              className="accordion-header"
              onClick={() => handleAccordionToggle(classItem._id)}
            >
              <h3>{classItem.title}</h3>
              <FaChevronDown
                className={`accordion-arrow ${
                  openClassId === classItem._id ? "open" : ""
                }`}
              />
            </div>

            {openClassId === classItem._id && (
              <div className="resource-management-content">
                <div className="resource-management-tabs">
                  <button
                    className={`resource-management-tab ${
                      activeTab[classItem._id] === "assignments" ? "active" : ""
                    }`}
                    onClick={() =>
                      handleTabChange(classItem._id, "assignments")
                    }
                  >
                    Assignments
                  </button>
                  <button
                    className={`resource-management-tab ${
                      activeTab[classItem._id] === "notes" ? "active" : ""
                    }`}
                    onClick={() => handleTabChange(classItem._id, "notes")}
                  >
                    Notes
                  </button>
                  <button
                    className={`resource-management-tab ${
                      activeTab[classItem._id] === "announcements"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleTabChange(classItem._id, "announcements")
                    }
                  >
                    Announcements
                  </button>
                </div>
                <ul className="resource-management-list">
                  {activeTab[classItem._id] === "assignments" &&
                    renderResourceList(
                      classItem.resources.assignments,
                      "assignments"
                    )}
                  {activeTab[classItem._id] === "notes" &&
                    renderResourceList(classItem.resources.notes, "notes")}
                  {activeTab[classItem._id] === "announcements" &&
                    renderResourceList(
                      classItem.resources.announcements,
                      "announcements"
                    )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="assignments-manager-container">
      <h1 className="assignments-manager-title" style={{ fontWeight: 900 }}>
        Classes Updates
      </h1>
      <p className="assignments-manager-description">
        This page provides a comprehensive overview of all assignments, notes,
        and announcements, organized and grouped by their respective classes in
        a user-friendly accordion format.
      </p>

      {loading && (
        <p className="status-message loading-message">
          <Loader />
        </p>
      )}
      {error && <p className="status-message error-message">Error: {error}</p>}

      {!loading && !error && isStudent && renderResources(studentClasses)}
      {!loading &&
        !error &&
        teacherClasses.length > 0 &&
        renderResources(teacherClasses)}
      {!loading &&
        !error &&
        !isStudent &&
        parentData.length > 0 &&
        parentData.map((child) => (
          <div key={child.childId}>{renderResources(child.classes)}</div>
        ))}

      {!loading &&
        !error &&
        parentData.length === 0 &&
        teacherClasses.length === 0 &&
        !isStudent && (
          <div className="empty-state">
            <h2 className="empty-header">No updates found yet 😌</h2>
            <p className="empty-description">No updates found yet</p>
          </div>
        )}
    </div>
  );
};

export default AssignmentsManager;
