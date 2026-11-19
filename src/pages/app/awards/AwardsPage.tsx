import Select from "../../../components/ui/Select";
import { getCookie } from "../../../utils/cookies";
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import {
  getAwards,
  createAward,
  updateAward,
  deleteAward,
} from "../../../store/features/awards/awards.slice";
import {
  fetchTeacherClasses,
  ClassData as ReduxClassData,
} from "../../../store/features/classes/legacyAdminClasses.slice";
import Loader from "../../../components/common/Loader";
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
      const storedUser = getCookie("user");
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
    <div className="page">
      <div className="space-y-6">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Awards</h1>
            <p className="page-subtitle max-w-2xl">
              Recognise outstanding performance, improvement and contribution.
            </p>
          </div>
          {isTeacher && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
              Create award
            </button>
          )}
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] text-[var(--color-danger)] rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Awards Grid */}
        {loading ? (
          <Loader />
        ) : awards.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[var(--color-muted)]">No awards yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {awards.map((award) => (
              <div
                key={award._id}
                className="bg-[var(--color-card)] card overflow-hidden"
              >
                {editingId === award._id ? (
                  <div className="p-5 space-y-3">
                    <input
                      type="text"
                      name="title"
                      value={editAward.title || ""}
                      onChange={(e) => handleChange(e, true)}
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="Award Title"
                    />
                    <textarea
                      name="description"
                      value={editAward.description || ""}
                      onChange={(e) => handleChange(e, true)}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl h-24 resize-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="Description"
                    />
                    <button
                      onClick={handleUpdate}
                      className="w-full py-2 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-full font-medium hover:brightness-95 transition-colors"
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
                      <h3 className="font-semibold text-[var(--color-primary)] mb-1">
                        {award.title}
                      </h3>
                      <p className="text-sm text-[var(--color-primary)] mb-2 line-clamp-2">
                        {award.description}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {award?.course?.title} • {award?.student?.name}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {(isTeacher || isAdmin) && (
                          <button
                            onClick={() => startEditing(award)}
                            className="flex-1 py-1.5 bg-[var(--color-success-bg)] text-[var(--color-success)] text-xs font-medium rounded-full hover:brightness-95 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => confirmDelete(award._id)}
                            className="flex-1 py-1.5 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs font-medium rounded-full hover:brightness-95 transition-colors"
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
            <div className="bg-[var(--color-card)] rounded-xl shadow-[var(--shadow-elevated)] w-full max-w-md max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-4">
                  Create New Award
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newAward.title || ""}
                      onChange={handleCreateFormChange}
                      placeholder="e.g. Best Student"
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">
                      Description ({newAward.description?.length || 0}/1000)
                    </label>
                    <textarea
                      name="description"
                      value={newAward.description || ""}
                      onChange={handleCreateFormChange}
                      maxLength={1000}
                      placeholder="Award Description"
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl h-24 resize-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">
                      Course
                    </label>
                    <Select
                      name="courseId"
                      value={courseData?._id || ""}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">Select Course</option>
                      {uniqueCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">
                      Student
                    </label>
                    <Select
                      name="studentId"
                      value={studentData?._id || ""}
                      onChange={handleCreateFormChange}
                      disabled={
                        !courseData || studentsForSelectedCourse.length === 0
                      }
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-[var(--color-surface-alt)]"
                    >
                      <option value="">Select Student</option>
                      {studentsForSelectedCourse.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-1">
                      Month
                    </label>
                    <Select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">Select Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 border border-green-700 text-[var(--color-success)] rounded-lg font-medium hover:bg-[var(--color-success-bg)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-2.5 bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-full font-medium hover:brightness-95 transition-colors"
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
            <div className="bg-[var(--color-card)] rounded-xl shadow-[var(--shadow-elevated)] p-6 max-w-sm w-full text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-danger-bg)] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--color-danger)]"
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
              <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
                Delete Award?
              </h3>
              <p className="text-[var(--color-primary)] mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAwardToDelete(null);
                  }}
                  className="flex-1 py-2.5 border border-[var(--color-card-border)] text-[var(--color-primary)] rounded-lg font-medium hover:bg-[var(--color-surface)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-full font-medium hover:brightness-95"
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
