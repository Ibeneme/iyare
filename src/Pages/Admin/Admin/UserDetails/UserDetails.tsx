// src/pages/Admin/UserDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../Redux/store";
import { fetchUserById } from "../../../../Redux/Admin/adminUsers";
import axios from "axios";
import { BASE_URL } from "../../../../Redux/baseurl";
import Loader from "../../../../Components/Loader/Loader";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";

const GRADES_API = `${BASE_URL}/api/grades/grades`;

interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  superadmin?: boolean;
  isSuspended: boolean;
  userType: "admin" | "student" | "parent" | "teacher";
  parentDetails?: any;
  children?: any[];
  gradeIds?: string[];
  subjectIds?: string[];
  parentId?: string;
  isPaid?: boolean;
  isSubscribed?: boolean;
  lessonFee?: any[];
  gradeId?: string;
  subjects?: Subject[]; // <-- Change from string[] to Subject[]
  createdAt?: string;
  updatedAt?: string;
  phoneNumber?: string;
}
interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

const UserDetailsPage: React.FC = () => {
  const { userType, id } = useParams<{ userType: string; id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadUser = async () => {
      if (!id || !userType) {
        setError("Invalid URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const action = await dispatch(fetchUserById({ id, userType }));
        if (action.payload) {
          setUser(action.payload);
        } else {
          setError("User not found");
        }
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, userType, dispatch]);

  // Fetch subjects for teacher/student
  useEffect(() => {
    if (!user || !token || subjects.length > 0) return;

    const gradeIds: string[] = [];
    if (user.userType === "teacher" && user.gradeIds?.length) {
      gradeIds.push(...user.gradeIds);
    }
    if (user.userType === "student" && user.gradeId) {
      gradeIds.push(user.gradeId);
    }

    if (gradeIds.length === 0) return;

    const fetchedIds = new Set<string>();

    gradeIds.forEach(async (gradeId) => {
      if (!gradeId) return;
      try {
        const res = await axios.get(`${GRADES_API}/subjects/${gradeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newSubs: Subject[] = res.data.data || [];
        const unique = newSubs.filter((s) => {
          if (fetchedIds.has(s._id)) return false;
          fetchedIds.add(s._id);
          return true;
        });
        setSubjects((prev) => [...prev, ...unique]);
      } catch (err) {
        console.error("Failed to fetch subjects");
      }
    });
  }, [user, token]);

  if (loading) return <Loader />;

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {error || "The requested user could not be loaded."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const userTypeLabel = userType?.charAt(0).toUpperCase() + userType!.slice(1);

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subjects/${subjectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar with Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-3 text-gray-700 hover:text-gray-900 font-medium transition group"
          >
            <ArrowLeftIcon className="w-5 h-5 transition group-hover:-translate-x-1" />
            <span>Back to Users</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-lg text-gray-600 mt-2">
                {userTypeLabel} Account
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user?.userType === "student" && (
                <span
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wider ${
                    user.isSubscribed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.isSubscribed ? "PAID" : "UNPAID"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <svg
                  className="w-7 h-7 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base">
                {(user.firstName || user.lastName) && (
                  <>
                    {user.firstName && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          First Name
                        </dt>
                        <dd className="mt-1.5 text-gray-900 font-medium">
                          {user.firstName}
                        </dd>
                      </div>
                    )}
                    {user.lastName && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Last Name
                        </dt>
                        <dd className="mt-1.5 text-gray-900 font-medium">
                          {user.lastName}
                        </dd>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Email Address
                  </dt>
                  <dd className="mt-1.5 text-gray-900 font-semibold">
                    {user.email}
                  </dd>
                </div>
                {user.phoneNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Phone Number
                    </dt>
                    <dd className="mt-1.5 text-gray-900">{user.phoneNumber}</dd>
                  </div>
                )}
                {user.role && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      System Role
                    </dt>
                    <dd className="mt-1.5 text-indigo-600 font-semibold">
                      {user.superadmin
                        ? "Super Administrator"
                        : user.role.charAt(0).toUpperCase() +
                          user.role.slice(1)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Admin Privileges */}
            {user.userType === "admin" && (
              <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-indigo-900 mb-6">
                  Administrator Access
                </h3>
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <p className="text-sm text-indigo-700 font-medium">
                      Access Level
                    </p>
                    <p className="text-3xl font-bold text-indigo-900 mt-2">
                      {user.superadmin ? "Super Admin" : "Administrator"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-700 font-medium">
                      Status
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        user.isSuspended ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {user.isSuspended ? "Suspended" : "Active"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Parent Info */}
            {user.userType === "student" && user.parentDetails && (
              <section className="bg-rose-50 border border-rose-200 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-rose-900 mb-6 flex items-center gap-3">
                  <svg
                    className="w-7 h-7 text-rose-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Parent / Guardian
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-rose-700 font-medium">
                      Full Name
                    </p>
                    <p className="text-xl font-semibold text-rose-900">
                      {user.parentDetails.firstName}{" "}
                      {user.parentDetails.lastName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-rose-700">Email</p>
                      <p className="text-base text-rose-900 font-medium">
                        {user.parentDetails.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-rose-700">Phone</p>
                      <p className="text-base text-rose-900">
                        {user.parentDetails.phoneNumber || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Subjects */}
            {(user.userType === "teacher" || user.userType === "student") &&
              user.subjects &&
              user.subjects.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">
                    {user.userType === "teacher"
                      ? "Subjects Taught"
                      : "Enrolled Subjects"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user?.subjects?.map((subject) => (
                      <button
                        key={subject?._id}
                        onClick={() => handleSubjectClick(subject._id)}
                        className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-left flex justify-between items-start"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                            {subject.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {subject.code}
                          </p>
                          {subject.description && (
                            <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                              {subject.description}
                            </p>
                          )}
                        </div>
                        <svg
                          className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </section>
              )}

            {/* Children */}
            {user.userType === "parent" &&
              user.children &&
              user.children.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">
                    Children ({user.children.length})
                  </h3>
                  <div className="space-y-5">
                    {user.children.map((child: any) => (
                      <div
                        key={child._id}
                        className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {child.firstName} {child.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{child.email}</p>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            child.isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {child.isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Account Summary
              </h3>
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-2 font-mono text-xs text-gray-700 bg-gray-100 px-4 py-2.5 rounded-lg break-all">
                    {user._id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Member Since
                  </dt>
                  <dd className="mt-1.5 text-gray-900 font-medium">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "MMMM d, yyyy")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="mt-1.5 text-gray-900">
                    {user.updatedAt
                      ? format(new Date(user.updatedAt), "MMM d, yyyy • h:mm a")
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
