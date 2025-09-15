import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EnrolledCourses.css";
import { BASE_URL } from "../../Redux/baseurl";

interface Course {
  _id: string;
  title: string;
}

interface TeacherOrStudent {
  _id: string;
  name: string;
  email: string;
  courses: Course[];
  classes: any[];
  certifications?: string[];
}

interface ParentData {
  _id: string;
  children: TeacherOrStudent[];
}

interface DashboardData {
  teacher?: TeacherOrStudent;
  student?: TeacherOrStudent;
  parent?: ParentData;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const EnrolledCourses: React.FC = () => {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error("No auth token found");

        const response = await axios.get(
          `${BASE_URL}/api/admin-classes/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setData(response.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  const renderClasses = (classes: any[]) => {
    if (!classes || classes.length === 0) return <p>No classes found.</p>;
    return (
      <ul className="class-list">
        {classes.map((cls) => (
          <li key={cls._id} className={`class-item ${cls.status}`}>
            <strong>{cls.title}</strong> -{" "}
            {cls.courseId?.title || cls.courseId?.name}
            <div>
              Teacher:{" "}
              {cls.teacherId
                ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                : "N/A"}
            </div>
            <div>Date: {new Date(cls.date).toLocaleDateString()}</div>
            <div>Time: {cls.time}</div>
            <div>Status: {cls.status}</div>
          </li>
        ))}
      </ul>
    );
  };

  const renderCourses = (user: TeacherOrStudent) => (
    <div className="user-section">
      <h2>{user.name}'s Courses</h2>
      {user.courses && user.courses.length > 0 ? (
        <ul className="course-list">
          {user.courses.map((c) => (
            <li key={c._id}>{c.title}</li>
          ))}
        </ul>
      ) : (
        <p>No courses enrolled.</p>
      )}
      <h3>Classes</h3>
      {renderClasses(user.classes || [])}
    </div>
  );

  return (
    <div className="enrolled-courses-container">
      {data.teacher && renderCourses(data.teacher)}
      {data.student && renderCourses(data.student)}
      {data.parent && (
        <div className="parent-section">
          <h2>Children</h2>
          {data.parent.children.map((child) => renderCourses(child))}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
