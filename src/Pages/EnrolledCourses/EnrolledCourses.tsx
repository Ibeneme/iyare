// src/components/EnrolledCourses.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../Redux/baseurl";
import { Calendar, Clock, User, BookOpen, AlertCircle } from "lucide-react";

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

// Skeleton Loader
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
  </div>
);

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

  // Render Classes
  const renderClasses = (classes: any[]) => {
    if (!classes || classes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No classes scheduled.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => {
          const statusColor =
            cls.status === "completed"
              ? "bg-green-100 text-green-800 border-green-300"
              : cls.status === "cancelled"
              ? "bg-red-100 text-red-800 border-red-300"
              : "bg-green-50 text-green-700 border-green-300";

          return (
            <div
              key={cls._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900 truncate flex-1">
                  {cls.title}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColor}`}
                >
                  {cls.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  {cls.courseId?.title ||
                    cls.courseId?.name ||
                    "Unknown Course"}
                </p>

                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  {cls.teacherId
                    ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                    : "Teacher N/A"}
                </p>

                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  {new Date(cls.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-700" />
                  {cls.time || "Time TBD"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Courses + Classes
  const renderUserSection = (user: TeacherOrStudent, role: string) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-600 capitalize">{role}</p>
        </div>
      </div>

      {/* Courses */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          Enrolled Courses
        </h3>
        {user.courses && user.courses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.courses.map((c) => (
              <span
                key={c._id}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
              >
                {c.title}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No courses enrolled.</p>
        )}
      </div>

      {/* Classes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Upcoming Classes
        </h3>
        {renderClasses(user.classes || [])}
      </div>
    </div>
  );

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            My Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            View your courses, classes, and progress
          </p>
        </div>

        <div className="space-y-8">
          {/* Teacher */}
          {data.teacher && renderUserSection(data.teacher, "Teacher")}

          {/* Student */}
          {data.student && renderUserSection(data.student, "Student")}

          {/* Parent */}
          {data.parent && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <User className="w-7 h-7 text-green-600" />
                My Children
              </h2>
              {data.parent.children.map((child) => (
                <div key={child._id}>{renderUserSection(child, "Child")}</div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!data.teacher && !data.student && !data.parent && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No data available
            </h3>
            <p className="text-gray-500">
              It looks like you don't have any courses or classes yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrolledCourses;
