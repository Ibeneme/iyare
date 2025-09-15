import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import ModalDropdown from "../../../../../../Components/Modal/ModalDropdown";
import {
  UserDetails,
  Course,
  // Grade, // Keep commented out if not used
  // Teacher, // Keep commented out if not used
} from "../../UserDetailsTypes/userDetailsTypes";
import { fetchAllUsersByType } from "../../../../../../Redux/Admin/adminUsers";
import { AppDispatch } from "../../../../../../Redux/store";
import "./EditGeneralUserModal.css";
import useUserRole from "../../../../../../Hooks/useUserRole";
import axios from "axios";
import { BASE_URL } from "../../../../../../Redux/baseurl";
// import {
//   MdOutlineRadioButtonChecked,
//   MdOutlineRadioButtonUnchecked,
// } from "react-icons/md";

interface EditGeneralUserModalProps {
  userType: string;
  userData: UserDetails;
  onClose: () => void;
  onSave: (data: Partial<UserDetails>) => void;
}

const allSkills = ["Math", "Science", "Programming", "Art"];
const allLanguages = ["English", "French", "Spanish", "German"];
const allCertifications = ["B.Ed", "M.Ed", "PhD", "Diploma"];

export const EditGeneralUserModal: React.FC<EditGeneralUserModalProps> = ({
  userType,
  userData,
  onClose,
  onSave,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  //const [grades, setGrades] = useState<Grade[]>([]); // Keep commented out if not used
  //const [teachers, setTeachers] = useState<Teacher[]>([]); // Keep commented out if not used
  const [courses, setCourses] = useState<Course[]>([]);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/admin-classes/dashboard-teachers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data, "response.data.");
        setTeachers(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teachers");
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, [dispatch]);

  const { userRole, isSuperadmin } = useUserRole();

  useEffect(() => {
    if (userRole) {
      console.log("User role is:", userRole);
    }
  }, [userRole]);

  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    title: "",
    description: "",
    skills: [],
    languages: [],
    certifications: [],
    schoolAttended: "",
    gradeTitle: "",
    teacher: "",
    phoneNumber: "",
    courses: [],
    teachers: [],
  });

  useEffect(() => {
    if (userData) {
      const normalizedCourses =
        userData.courses?.map((c: any) => ({
          _id: c._id,
          name: c.name || c.title || "Untitled",
          email: c.email ?? null,
          phoneNumber: c.phoneNumber ?? null,
          userType: c.userType || "course",
          isSuspended: c.isSuspended || false,
          description: c.description,
        })) || [];
        
      const normalizedTeachers = userData.teacherDetails?.map((t: any) => ({
        _id: t._id,
        name: t.name || t.firstName + ' ' + t.lastName,
      })) || [];

      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        title: userData.title || userData.name || "",
        description: userData.description || "",
        skills: userData.skills || [],
        languages: userData.languages || [],
        certifications: userData.certifications || [],
        schoolAttended: userData.schoolAttended || "",
        gradeTitle: userData.gradeTitle || "",
        teacher: userData.teacher || "",
        phoneNumber: userData.phoneNumber || "",
        courses: normalizedCourses,
        teachers: normalizedTeachers,
      });
    }

    if (userType.toLowerCase() === "student") {
      dispatch(fetchAllUsersByType("grade"))
        .then(
          (res: any) => console.log(res)
          //setGrades(res.payload?.users || []) // Keep commented out if not used
        )
        .catch((err) => console.error("Grades fetch failed", err));

      dispatch(fetchAllUsersByType("teacher"))
        .then((res: any) => {
          console.log(res);
        })
        //setTeachers(res.payload?.users || [])) // Keep commented out if not used
        .catch((err) => console.error("Teachers fetch failed", err));

      dispatch(fetchAllUsersByType("course"))
        .then((res: any) => setCourses(res.payload?.users || []))
        .catch((err) => console.error("Courses fetch failed", err));
    }
  }, [userData, userType, dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleToggleMultiSelect = (
    key: "skills" | "languages" | "certifications",
    value: string
  ) => {
    const currentSet = new Set(formData[key] || []);
    currentSet.has(value) ? currentSet.delete(value) : currentSet.add(value);
    setFormData((prev: any) => ({ ...prev, [key]: Array.from(currentSet) }));
  };

  const handleToggleCourseSelect = (course: Course) => {
    const current = formData.courses || [];
    const exists = current.find((c: any) => c._id === course._id);
    const updated = exists
      ? current.filter((c: any) => c._id !== course._id)
      : [...current, course];
    setFormData((prev: any) => ({ ...prev, courses: updated }));
  };
  
  const handleToggleTeacherSelect = (teacher: any) => {
    const currentTeachers = formData.teachers || [];


    console.log(currentTeachers, 'currentTeachers')

    const exists = currentTeachers.find((t: any) => t._id === teacher._id);
    const updated = exists
      ? currentTeachers.filter((t: any) => t._id !== teacher._id)
      : [...currentTeachers, teacher];
    setFormData((prev: any) => ({ ...prev, teachers: updated }));
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      teacherIds: formData.teachers.map((t: any) => t._id) // Extract IDs for backend
    };
    onSave(payload);
  };

  const renderMultiSelect = (
    label: string,
    key: "skills" | "languages" | "certifications",
    options: string[]
  ) => (
    <div className="multi-select-section">
      <p className="multi-select-label">{label}:</p>
      <div className="multi-select-box">
        {options.map((item) => {
          const isSelected = formData[key]?.includes(item);
          return (
            <label key={item} className="multi-select-item">
              {/* <span className="icon-wrapper">
             {isSelected ? (
                  <MdOutlineRadioButtonChecked
                    style={{ color: "var(--dark-green)", paddingTop: 24 }}
                  />
                ) : (
                  <MdOutlineRadioButtonUnchecked
                    style={{ color: "var(--dark-green)", paddingTop: 24 }}
                  />
                )}
              </span> */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleMultiSelect(key, item)}
                style={{ display: "none" }}
              />
              <span className="multi-select-text">{item}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
  
  const sections: Record<string, React.ReactNode> = {
    nameFields: ["student", "parent", "admin", "teacher"].includes(
      userType.toLowerCase()
    ) && (
      <>
        <br />
        <label className="multi-select-label">
          First Name:
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <div style={{ marginTop: 16 }}></div>
        <label className="multi-select-label">
          Last Name:
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <div style={{ marginTop: 16 }}></div>
      </>
    ),

    parentFields: userType.toLowerCase() === "parent" && (
      <>
        <label className="multi-select-label">
          Phone Number:
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <br />
      </>
    ),

    teacherFields: userType.toLowerCase() === "teacher" && (
      <>
        {renderMultiSelect(
          "Certifications",
          "certifications",
          allCertifications
        )}
        <br />
        <label className="multi-select-label">
          School Attended:
          <input
            name="schoolAttended"
            value={formData.schoolAttended}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <br /> <br />
        {renderMultiSelect("Skills", "skills", allSkills)}
        <br /> <br />
        {renderMultiSelect("Languages", "languages", allLanguages)}
      </>
    ),

    studentFields: userType.toLowerCase() === "student" && (
      <>
        {/* <label className="multi-select-label">
          Grade:
          <select
            name="gradeTitle"
            value={formData.gradeTitle}
            onChange={handleInputChange}
          >
            <option value="">Select Grade</option>
            {grades.map((grade) => (
              <option key={grade._id} value={grade.name}>
                {grade.name}
              </option>
            ))}
          </select>
        </label> */}

        {userRole === "admin" && isSuperadmin && (
          <>
            <label className="multi-select-section">
              <p className="multi-select-label">Courses:</p>
              <div className="multi-select-box">
                {courses.map((course) => {
                  const isSelected = formData.courses?.some(
                    (c: any) => c._id === course._id
                  );

                  return (
                    <label key={course._id} className="multi-select-item">
                      {/* <span className="icon-wrapper">
               {isSelected ? (
                 <MdOutlineRadioButtonChecked
                   style={{ color: "var(--dark-green)", paddingTop: 24 }}
                 />
               ) : (
                 <MdOutlineRadioButtonUnchecked
                   style={{ color: "var(--dark-green)", paddingTop: 24 }}
                 />
               )}
             </span> */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCourseSelect(course)}
                        style={{ display: "none" }}
                      />
                      <span className="multi-select-text">{course.name}</span>
                    </label>
                  );
                })}
              </div>
            </label>
            <br />
          </>
        )}

        {renderMultiSelect("Skills", "skills", allSkills)}
        <br />
        {renderMultiSelect("Languages", "languages", allLanguages)}
      </>
    ),

    courseFields: userType.toLowerCase() === "course" && (
      <>
        <br />
        <label className="multi-select-label">
          Title:
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <label className="multi-select-section">
          <p className="multi-select-label">Assigned Teachers:</p>
          <div className="multi-select-box">
            {loading ? (
              <div className="loading-spinner">Loading teachers...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              teachers.map((teacher) => {
                const isAssigned = formData.teachers?.some(
                  (t: any) => t._id === teacher._id
                );
                return (
                  <label key={teacher._id} className="multi-select-item">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => handleToggleTeacherSelect(teacher)}
                      style={{ display: "none" }}
                    />
                    <span className="multi-select-text">{teacher.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </label>
        {["grade"].includes(userType.toLowerCase()) && (
          <label className="multi-select-label">
            Description:
            <textarea
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleInputChange}
              className="multi-select-label"
            />
          </label>
        )}
      </>
    ),
    
    gradeFields: userType.toLowerCase() === "grade" && (
      <>
        <br />
        <label className="multi-select-label">
          Title:
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="multi-select-label"
          />
        </label>
        <label className="multi-select-label">
            Description:
            <textarea
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleInputChange}
              className="multi-select-label"
            />
          </label>
      </>
    ),
  };

  const getModalDescription = (type: string): string => {
    switch (type.toLowerCase()) {
      case "student":
        return "Update the personal details and academic information for this student.";
      case "teacher":
        return "Modify the professional profile, skills, and certifications for this teacher.";
      case "parent":
        return "Adjust the contact details and family information for this parent.";
      case "admin":
        return "Edit administrative details for this user.";
      case "course":
        return "Update the name and description and assigned teachers of this course.";
      case "grade":
        return "Modify the title and description of this grade level.";
      default:
        return "Edit details for this user type.";
    }
  };

  return (
    <ModalDropdown onClose={onClose}>
      <div
        className="admin0dashboard-add-admin-modal"
        style={{ marginTop: 16, maxWidth: 450 }}
      >
        <h2>Edit {userType.charAt(0).toUpperCase() + userType.slice(1)}</h2>
        <p
          style={{
            fontSize: 12,
            backgroundColor: "#66666621",
            padding: 12,
            borderRadius: 12,
          }}
        >
          {getModalDescription(userType)}
        </p>{" "}
        {Object.values(sections).filter(Boolean)}
        <div className="user-modal__actions">
          <br />
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSubmit}>
            Save Changes
          </button>
        </div>
        <br />
      </div>
    </ModalDropdown>
  );
};
