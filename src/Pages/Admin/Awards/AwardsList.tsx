import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  getAwards,
  createAward,
  updateAward,
  deleteAward,
} from "../../../Redux/Awards/awardSlice";
import {
  fetchTeacherClasses,
  ClassData as ReduxClassData,
} from "../../../Redux/Admin/adminClasses";
import Loader from "../../../Components/Loader/Loader";
import bgAwards from "../../../assets/images/admin/awards/bgAwards.png";

interface EnrolledStudent {
  _id: string;
  name: string;
}

interface Award {
  _id: string;
  title?: any;
  description?: string;
  courseId?: string;
  studentId?: string;
  course?: {
    title: string;
  };
  student?: {
    name?: any;
  };
}
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AwardsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [awards, setAwards] = useState<Award[]>([]);
  const [newAward, setNewAward] = useState<Partial<Award>>({});
  const [month, setMonth] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAward, setEditAward] = useState<Partial<Award>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [awardToDelete, setAwardToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ReduxClassData[]>([]);
  const [studentsForSelectedCourse, setStudentsForSelectedCourse] = useState<
    EnrolledStudent[]
  >([]);
  const [teacherData, setTeacherData] = useState<{
    _id: string;
    name: string;
    email: string;
  } | null>(null);
  const [courseData, setCourseData] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [studentData, setStudentData] = useState<{
    _id: string;
    name: string;
  } | null>(null);

  const fetchAwards = useCallback(() => {
    setLoading(true);
    dispatch(getAwards())
      .unwrap()
      .then((data) => {
        setAwards(data as any);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch awards.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser?.userType === "teacher") {
        setIsTeacher(true);
        setIsAdmin(false);
        const { _id, name, email } = parsedUser;
        setTeacherData({ _id, name, email });
        if (_id) {
          dispatch(fetchTeacherClasses(_id))
            .unwrap()
            .then(setTeacherClasses)
            .catch(console.error);
        }
      } else if (parsedUser?.userType === "admin") {
        setIsAdmin(true);
        setIsTeacher(false);
      }
    } catch (err) {
      console.error("Failed to parse user:", err);
    }
  }, [dispatch]);

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 1000) {
      setNewAward((prev) => ({ ...prev, [name]: value.substring(0, 1000) }));
    } else {
      setNewAward((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "courseId") {
      const selectedCourse = uniqueCourses.find((c) => c._id === value);
      if (selectedCourse) {
        setCourseData({
          _id: selectedCourse._id,
          title: selectedCourse.title || "",
        });
        const classesForCourse = teacherClasses.filter(
          (cls) => cls.courseId?._id === value
        );
        const uniqueStudents = new Map<string, EnrolledStudent>();
        classesForCourse.forEach((cls) => {
          cls.enrolledStudents?.forEach(
            (student: { _id: string; name: string }) => {
              if (!uniqueStudents.has(student._id)) {
                uniqueStudents.set(student._id, {
                  _id: student._id,
                  name: student.name,
                });
              }
            }
          );
        });
        setStudentsForSelectedCourse(Array.from(uniqueStudents.values()));
        setStudentData(null);
      }
    } else if (name === "studentId") {
      const selectedStudent = studentsForSelectedCourse.find(
        (s) => s._id === value
      );
      if (selectedStudent) {
        setStudentData({
          _id: selectedStudent._id,
          name: selectedStudent.name,
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isEdit = false
  ) => {
    const { name, value } = e.target;
    const truncated =
      name === "description" && value.length > 1000
        ? value.substring(0, 1000)
        : value;
    if (isEdit) {
      setEditAward((prev) => ({ ...prev, [name]: truncated }));
    } else {
      setNewAward((prev) => ({ ...prev, [name]: truncated }));
    }
  };

  const handleCreate = () => {
    if (
      !newAward.title ||
      !month ||
      !courseData ||
      !studentData ||
      !teacherData
    ) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    const awardData = {
      ...newAward,
      title: `${newAward.title} of ${month}`,
      courseId: courseData._id,
      studentId: studentData._id,
      teacherId: teacherData._id,
      awardMonth: month,
    };

    dispatch(createAward(awardData as any))
      .unwrap()
      .then(() => {
        setNewAward({});
        setMonth("");
        setCourseData(null);
        setStudentData(null);
        setIsCreateModalOpen(false);
        fetchAwards();
      })
      .catch((err) => {
        setError(err.message || "Failed to create award.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const startEditing = (award: Award) => {
    setEditingId(award._id);
    setEditAward(award);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    setLoading(true);
    dispatch(updateAward({ id: editingId, data: editAward } as any))
      .unwrap()
      .then(() => {
        setEditingId(null);
        setEditAward({});
        fetchAwards();
      })
      .catch((err) => {
        setError(err.message || "Failed to update award.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const confirmDelete = (id: string) => {
    setAwardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!awardToDelete) return;
    setLoading(true);
    dispatch(deleteAward(awardToDelete))
      .unwrap()
      .then(() => {
        setIsDeleteModalOpen(false);
        setAwardToDelete(null);
        fetchAwards();
      })
      .catch((err) => {
        setError(err.message || "Failed to delete award.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const uniqueCourses = Array.from(
    new Map(
      teacherClasses.map((cls) => [cls.courseId?._id, cls.courseId])
    ).values()
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-green-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-900"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            Student Awards
          </h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Recognize and celebrate student achievements by creating and
            managing awards for outstanding performance, improvement, and
            contributions.
          </p>
        </div>

        {/* Create Button */}
        {isTeacher && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mb-6 inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-5 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-sm"
          >
            Create Award
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Awards Grid */}
        {loading ? (
          <Loader />
        ) : awards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">No awards yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {awards.map((award) => (
              <div
                key={award._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {editingId === award._id ? (
                  <div className="p-5 space-y-3">
                    <input
                      type="text"
                      name="title"
                      value={editAward.title || ""}
                      onChange={(e) => handleChange(e, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      placeholder="Award Title"
                    />
                    <textarea
                      name="description"
                      value={editAward.description || ""}
                      onChange={(e) => handleChange(e, true)}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-green-700"
                      placeholder="Description"
                    />
                    <button
                      onClick={handleUpdate}
                      className="w-full py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-16 h-full">
                      <img
                        src={bgAwards}
                        alt="Award"
                        className="w-full h-full object-cover rounded-l-2xl"
                      />
                    </div>
                    <div className="flex-1 p-5">
                      <h3 className="font-bold text-green-900 mb-1">
                        {award.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {award.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {award?.course?.title} • {award?.student?.name}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {(isTeacher || isAdmin) && (
                          <button
                            onClick={() => startEditing(award)}
                            className="flex-1 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => confirmDelete(award._id)}
                            className="flex-1 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-full hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">
                  Create New Award
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newAward.title || ""}
                      onChange={handleCreateFormChange}
                      placeholder="e.g. Best Student"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description ({newAward.description?.length || 0}/1000)
                    </label>
                    <textarea
                      name="description"
                      value={newAward.description || ""}
                      onChange={handleCreateFormChange}
                      maxLength={1000}
                      placeholder="Award Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-green-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <select
                      name="courseId"
                      value={courseData?._id || ""}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700"
                    >
                      <option value="">Select Course</option>
                      {uniqueCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student
                    </label>
                    <select
                      name="studentId"
                      value={studentData?._id || ""}
                      onChange={handleCreateFormChange}
                      disabled={
                        !courseData || studentsForSelectedCourse.length === 0
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 disabled:bg-gray-100"
                    >
                      <option value="">Select Student</option>
                      {studentsForSelectedCourse.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700"
                    >
                      <option value="">Select Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 border border-green-700 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Award?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAwardToDelete(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AwardsList;
