import { getCookie } from "../../../utils/cookies";
// src/components/EnrolledCourses.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
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
  return getCookie("token");
};

// Skeleton Loader
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-[var(--color-surface-alt)] rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-[var(--color-surface-alt)] rounded w-full mb-2"></div>
    <div className="h-4 bg-[var(--color-surface-alt)] rounded w-5/6 mb-2"></div>
    <div className="h-4 bg-[var(--color-surface-alt)] rounded w-4/6"></div>
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
        <div className="text-center py-8 text-[var(--color-muted)]">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-[var(--color-subtle)]" />
          <p>No classes scheduled.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => {
          const statusColor =
            cls.status === "completed"
              ? "bg-[var(--color-success-bg)] text-[var(--color-success)] border-green-300"
              : cls.status === "cancelled"
              ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-red-300"
              : "bg-[var(--color-success-bg)] text-[var(--color-success)] border-green-300";

          return (
            <div
              key={cls._id}
              className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-card-border)] p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-[var(--color-primary)] truncate flex-1">
                  {cls.title}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColor}`}
                >
                  {cls.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-[var(--color-muted)]">
                <p className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--color-success)]" />
                  {cls.courseId?.title ||
                    cls.courseId?.name ||
                    "Unknown Course"}
                </p>

                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-muted)]" />
                  {cls.teacherId
                    ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                    : "Teacher N/A"}
                </p>

                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-success)]" />
                  {new Date(cls.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-success)]" />
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
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-full flex items-center justify-center text-white font-bold text-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-primary)]">{user.name}</h2>
          <p className="text-sm text-[var(--color-muted)] capitalize">{role}</p>
        </div>
      </div>

      {/* Courses */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--color-success)]" />
          Enrolled Courses
        </h3>
        {user.courses && user.courses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.courses.map((c) => (
              <span
                key={c._id}
                className="px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-success)] text-sm font-medium rounded-full"
              >
                {c.title}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-muted)] italic">No courses enrolled.</p>
        )}
      </div>

      {/* Classes */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--color-success)]" />
          Upcoming Classes
        </h3>
        {renderClasses(user.classes || [])}
      </div>
    </div>
  );

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-10 bg-[var(--color-surface-alt)] rounded w-64 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--color-card)] backdrop-blur-sm rounded-2xl p-6 shadow-sm shadow-[var(--shadow-card)]"
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
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
        <div className="bg-[var(--color-card)] rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-[var(--color-danger)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-[var(--color-muted)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[var(--color-danger)] text-white text-white rounded-full hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)]">
            My Dashboard
          </h1>
          <p className="mt-2 text-lg text-[var(--color-muted)]">
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
              <h2 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-3">
                <User className="w-7 h-7 text-[var(--color-success)]" />
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
            <div className="w-24 h-24 bg-[var(--color-surface-alt)] rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-[var(--color-subtle)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-muted)] mb-2">
              No data available
            </h3>
            <p className="text-[var(--color-muted)]">
              It looks like you don't have any courses or classes yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrolledCourses;
