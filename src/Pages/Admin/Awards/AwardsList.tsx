import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  getAwards,
  Award,
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

// Define a type for a student in the enrolledStudents array
interface EnrolledStudent {
  _id: string;
  name: string;
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

  // Helper function to fetch awards. Using useCallback to prevent re-creation
  // on every render and avoid an infinite loop in useEffect.
  const fetchAwards = useCallback(() => {
    setLoading(true);
    dispatch(getAwards())
      .unwrap()
      .then((data) => {
        setAwards(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch awards.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  // Fetch awards on initial component mount and whenever fetchAwards is called
  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  // Fetch teacher's classes and get teacher ID and name
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.warn("⚠️ No user found in localStorage.");
        return;
      }
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser?.userType === "teacher") {
        setIsTeacher(true);
        setIsAdmin(false);
        const { _id, name, email } = parsedUser;
        setTeacherData({ _id, name, email });
        if (!_id) {
          console.warn("⚠️ No teacherId found in stored user.");
          return;
        }
        dispatch(fetchTeacherClasses(_id))
          .unwrap()
          .then((payload) => {
            setTeacherClasses(payload);
          })
          .catch((err) => {
            console.error("❌ Error fetching teacher classes:", err);
          });
      } else if (parsedUser?.userType === "admin") {
        setIsAdmin(true);
        setIsTeacher(false);
      } else {
        setIsTeacher(false);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("💥 Failed to parse user from localStorage:", err);
      setIsTeacher(false);
      setIsAdmin(false);
    }
  }, [dispatch]);

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // Truncate description to 1000 characters
    if (name === "description" && value.length > 1000) {
      setNewAward((prev) => ({ ...prev, [name]: value.substring(0, 1000) }));
    } else {
      setNewAward((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "courseId") {
      const selectedCourse = uniqueCourses.find(
        (course) => course._id === value
      );
      if (selectedCourse) {
        setCourseData({ _id: selectedCourse._id, title: selectedCourse.title });
        const classesForCourse = teacherClasses.filter(
          (cls) => cls.courseId?._id === value
        );
        const uniqueStudents = new Map<string, EnrolledStudent>();
        classesForCourse.forEach((cls) => {
          cls.enrolledStudents.forEach((student) => {
            if (!uniqueStudents.has(student._id)) {
              uniqueStudents.set(student._id, {
                _id: student._id,
                name: student.name,
              });
            }
          });
        });
        setStudentsForSelectedCourse(Array.from(uniqueStudents.values()));
        setStudentData(null); // Reset student selection
      }
    } else if (name === "studentId") {
      const selectedStudent = studentsForSelectedCourse.find(
        (student) => student._id === value
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
    // Truncate description to 1000 characters
    if (name === "description" && value.length > 1000) {
      const truncatedValue = value.substring(0, 1000);
      if (isEdit) {
        setEditAward({ ...editAward, [name]: truncatedValue });
      } else {
        setNewAward({ ...newAward, [name]: truncatedValue });
      }
    } else {
      if (isEdit) {
        setEditAward({ ...editAward, [name]: value });
      } else {
        setNewAward({ ...newAward, [name]: value });
      }
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
      console.error("Title, month, course, and student are required!");
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
        setIsCreateModalOpen(false);
        setCourseData(null);
        setStudentData(null);
        fetchAwards(); // Reload awards on successful creation
      })
      .catch((err: any) => {
        console.error("Failed to create award:", err.message);
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
    const updatedData = { id: editingId, data: editAward };

    dispatch(updateAward(updatedData as any))
      .unwrap()
      .then(() => {
        setEditingId(null);
        setEditAward({});
        fetchAwards(); // Reload awards on successful update
      })
      .catch((err: any) => {
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
        fetchAwards(); // Reload awards on successful deletion
      })
      .catch((err: any) => {
        setError(err.message || "Failed to delete award.");
      })
      .finally(() => {
        setLoading(false);
        setIsDeleteModalOpen(false);
        setAwardToDelete(null);
      });
  };

  // Get unique courses from the fetched teacher classes
  const uniqueCourses = Array.from(
    new Map(
      teacherClasses.map((cls) => [cls.courseId?._id, cls.courseId])
    ).values()
  ).filter(Boolean);

  return (
    <div
      style={{  background: "transparent", minHeight: "100vh" }}
    >
      <h2 style={{ color: "#004d00", marginBottom: "2px", fontWeight: 900 }}>
        Student Awards
      </h2>
      <p
        style={{
          color: "#333",
          marginBottom: "24px",
          fontSize: "12px",
          lineHeight: "1.6",
          maxWidth: 600,
        }}
      >
        Recognize and celebrate student achievements by creating and managing
        awards for outstanding performance, improvement, and contributions.
      </p>

      {isTeacher && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            marginBottom: "20px",
            padding: "10px 18px",
            background: "#ffd000",
            color: "#004d00",
            border: "0.6px solid #004d00",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Create Award
        </button>
      )}

      {loading && <Loader />}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* Create Award Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 999999,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "10px",
              width: "420px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              maxHeight: 500,
              overflowY: "auto",
            }}
          >
            <h3 style={{ marginBottom: "16px", color: "#004d00" }}>
              Create New Award
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <label>
                Title
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Best Student"
                  value={newAward.title || ""}
                  onChange={handleCreateFormChange}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                />
              </label>

              <label>
                Description ({newAward.description?.length || 0}/1000)
                <textarea
                  name="description"
                  placeholder="Award Description"
                  value={newAward.description || ""}
                  onChange={handleCreateFormChange}
                  maxLength={1000}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "13px",
                    minHeight: "80px",
                  }}
                />
              </label>

              <label>
                Course
                <select
                  name="courseId"
                  value={courseData?._id || ""}
                  onChange={handleCreateFormChange}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="">Select Course</option>
                  {uniqueCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Student
                <select
                  name="studentId"
                  value={studentData?._id || ""}
                  onChange={handleCreateFormChange}
                  disabled={
                    !courseData || studentsForSelectedCourse.length === 0
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="">Select Student</option>
                  {studentsForSelectedCourse.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Month
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
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
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  border: "0.6px solid #004d00",
                  color: "#004d00",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: "8px 14px",
                  background: "#004d00",
                  border: "0.6px solid #004d00",
                  color: "#fff",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 999999,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "10px",
              width: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#aa0000", marginBottom: "4px" }}>
              Confirm Delete
            </h3>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>
              Are you sure you want to delete this award? This action cannot be
              undone.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setAwardToDelete(null);
                }}
                style={{
                  padding: "13px 14px",
                  background: "transparent",
                  border: "0.6px solid #004d00",
                  color: "#004d00",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "48%",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "13px 14px",
                  background: "#ff4444",
                  border: "0.6px solid #aa0000",
                  color: "#fff",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "48%",
                  fontSize: 13,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Awards List */}
      <div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {awards?.map((award) => (
            <li
              key={award._id}
              style={{
                marginBottom: "16px",
                //padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "16px",
                backgroundColor: "#fff",
              }}
            >
              {editingId === award._id ? (
                <>
                  <input
                    type="text"
                    name="title"
                    value={editAward.title || ""}
                    onChange={(e) => handleChange(e, true)}
                    style={{
                      display: "block",
                      margin: "6px 0",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                  <textarea
                    name="description"
                    value={editAward.description || ""}
                    onChange={(e) => handleChange(e, true)}
                    maxLength={1000}
                    style={{
                      display: "block",
                      margin: "6px 0",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                  <button
                    onClick={handleUpdate}
                    style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "#004d00",
                      border: "0px solid #004d00",
                      color: "#fff",
                      borderRadius: "32px",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Save
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 0 }}>
                  <div>
                    <img
                      src={bgAwards}
                      alt="Student Awards"
                      style={{
                        width: 48,
                        height: "100%",
                        objectFit: "cover", // This is the key property
                        borderRadius:`16px 0px 16px 0px`
                      }}
                    />
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ margin: "0 0 8px", color: "#004d00" }}>
                      {award.title}
                    </h3>
                    <p style={{ margin: "0 0 4px", fontSize: 13 }}>
                      {award.description}
                    </p>
                    <small style={{ fontSize: 13 }}>
                      {`Course: ${award.course?.title} | Student: ${award.student?.name} | Teacher: ${award.teacher?.name}`}
                    </small>
                    <br />
                    <div
                      style={{ marginTop: "8px", display: "flex", gap: "10px" }}
                    >
                      {(isTeacher || isAdmin) && (
                        <button
                          onClick={() => startEditing(award)}
                          style={{
                            padding: "6px 12px",
                            background: "#004d0014",
                            border: "0px solid #004d00",
                            color: "#004d00",
                            borderRadius: "32px",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          Edit
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => confirmDelete(award._id)}
                          style={{
                            padding: "6px 12px",
                            background: "#ffdddd",
                            border: "0px solid #aa0000",
                            color: "#aa0000",
                            borderRadius: "32px",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AwardsList;
