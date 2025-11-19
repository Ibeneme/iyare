// UserModals.tsx
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import ModalDropdown from "../../../../../../Components/Modal/ModalDropdown";
import {
  Grade,
  ConfirmModalType,
  UserDetails,
  Course,
} from "../../UserDetailsTypes/userDetailsTypes";
import { fetchAllUsersByType } from "../../../../../../Redux/Admin/adminUsers";
import { AppDispatch } from "../../../../../../Redux/store";
import { BASE_URL } from "../../../../../../Redux/baseurl";
import useUserRole from "../../../../../../Hooks/useUserRole";

import suspendImage from "../../../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../../../assets/images/admin/removeImage.png";

// === CONSTANTS ===
const allSkills = ["Math", "Science", "Programming", "Art"];
const allLanguages = ["English", "French", "Spanish", "German"];
const allCertifications = ["B.Ed", "M.Ed", "PhD", "Diploma"];

// === 1. CONFIRMATION MODAL ===
interface ConfirmationModalProps {
  confirmModal: ConfirmModalType;
  userType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  confirmModal,
  userType,
  onConfirm,
  onCancel,
}) => {
  const actionLabel =
    confirmModal.type === "suspend"
      ? "suspend"
      : confirmModal.type === "unsuspend"
      ? "unsuspend"
      : "delete";

  const imageSrc = confirmModal.type === "remove" ? removeImage : suspendImage;

  return (
    <ModalDropdown onClose={onCancel}>
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl  text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          {confirmModal.type === "suspend"
            ? "Confirm Suspension"
            : confirmModal.type === "unsuspend"
            ? "Confirm Unsuspension"
            : "Confirm Deletion"}
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to <strong>{actionLabel}</strong> this{" "}
          <span className="font-medium">{userType}</span>?
        </p>

        <img
          src={imageSrc}
          alt="Confirm action"
          className="w-28 h-28 mx-auto mb-5 object-contain"
        />

        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
          >
            Yes, {actionLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};

// === 2. EDIT GRADE MODAL ===
interface EditGradeModalProps {
  userType: string;
  data: { title: string; description: string };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditGradeModal: React.FC<EditGradeModalProps> = ({
  userType,
  data,
  onChange,
  onClose,
  onSave,
}) => {
  return (
    <ModalDropdown onClose={onClose}>
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl ">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Edit {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            type="text"
            name="title"
            value={data.title}
            onChange={onChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            name="description"
            value={data.description}
            onChange={onChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};

// === 3. EDIT STUDENT GRADE MODAL ===
interface EditStudentGradeModalProps {
  user: UserDetails;
  allGrades: Grade[];
  selectedGrade: Grade | null;
  onSelect: (grade: Grade | null) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditStudentGradeModal: React.FC<EditStudentGradeModalProps> = ({
  user,
  allGrades,
  selectedGrade,
  onSelect,
  onClose,
  onSave,
}) => {
  return (
    <ModalDropdown onClose={onClose}>
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl ">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Edit Grade for {user.firstName} {user.lastName}
        </h2>

        <label className="block mb-6">
          <span className="text-sm font-medium text-gray-700">
            Current Grade: <strong>{user.gradeTitle}</strong>
          </span>
          <select
            value={selectedGrade?._id || ""}
            onChange={(e) => {
              const id = e.target.value;
              const grade = allGrades.find((g) => g._id === id) || null;
              onSelect(grade);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Select Grade --</option>
            {allGrades.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!selectedGrade}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};

// === 4. EDIT GENERAL USER MODAL ===
interface EditGeneralUserModalProps {
  userType: string;
  userData: UserDetails;
  onClose: () => void;
  onSave: (data: Partial<UserDetails>) => void;
}

export const EditGeneralUserModal: React.FC<EditGeneralUserModalProps> = ({
  userType,
  userData,
  onClose,
  onSave,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userRole, isSuperadmin } = useUserRole();

  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load teachers for course edit
  useEffect(() => {
    const loadTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${BASE_URL}/api/admin-classes/dashboard-teachers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeachers(data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teachers");
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  // Initialize form
  useEffect(() => {
    if (!userData) return;

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

    const normalizedTeachers =
      userData.teacherDetails?.map((t: any) => ({
        _id: t._id,
        name: t.name || `${t.firstName} ${t.lastName}`,
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
  }, [userData]);

  // Load courses for student
  useEffect(() => {
    if (userType.toLowerCase() === "student") {
      dispatch(fetchAllUsersByType("course"))
        .then((res: any) => setCourses(res.payload?.users || []))
        .catch(console.error);
    }
  }, [userType, dispatch]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const toggleArray = (
    key: "skills" | "languages" | "certifications",
    value: string
  ) => {
    setFormData((prev: any) => {
      const set = new Set(prev[key] || []);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [key]: Array.from(set) };
    });
  };

  const toggleCourse = (course: Course) => {
    setFormData((prev: any) => {
      const arr = prev.courses || [];
      const exists = arr.some((c: any) => c._id === course._id);
      return {
        ...prev,
        courses: exists
          ? arr.filter((c: any) => c._id !== course._id)
          : [...arr, course],
      };
    });
  };

  const toggleTeacher = (teacher: any) => {
    setFormData((prev: any) => {
      const arr = prev.teachers || [];
      const exists = arr.some((t: any) => t._id === teacher._id);
      return {
        ...prev,
        teachers: exists
          ? arr.filter((t: any) => t._id !== teacher._id)
          : [...arr, teacher],
      };
    });
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      teacherIds: formData.teachers.map((t: any) => t._id),
    };
    onSave(payload);
  };

  // Reusable Multi-Select
  const MultiSelect = ({
    label,
    field,
    options,
  }: {
    label: string;
    field: "skills" | "languages" | "certifications";
    options: string[];
  }) => (
    <div className="mb-5">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}:</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const checked = formData[field]?.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center p-2 rounded-md cursor-pointer transition ${
                checked
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-400"
                  : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleArray(field, opt)}
                className="sr-only"
              />
              <span className="ml-2 text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // Conditional Sections
  const sections: Record<string, React.ReactNode> = {
    nameFields: ["student", "parent", "admin", "teacher"].includes(
      userType.toLowerCase()
    ) && (
      <>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">First Name</span>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Last Name</span>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
      </>
    ),

    parentFields: userType.toLowerCase() === "parent" && (
      <label className="block mb-4">
        <span className="text-sm font-medium text-gray-700">Phone Number</span>
        <input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </label>
    ),

    teacherFields: userType.toLowerCase() === "teacher" && (
      <>
        <MultiSelect
          label="Certifications"
          field="certifications"
          options={allCertifications}
        />
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">
            School Attended
          </span>
          <input
            name="schoolAttended"
            value={formData.schoolAttended}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
        <MultiSelect label="Skills" field="skills" options={allSkills} />
        <MultiSelect
          label="Languages"
          field="languages"
          options={allLanguages}
        />
      </>
    ),

    studentFields: userType.toLowerCase() === "student" && (
      <>
        {userRole === "admin" && isSuperadmin && (
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Courses:</p>
            <div className="grid grid-cols-2 gap-2">
              {courses.map((course) => {
                const isSelected = formData.courses?.some(
                  (c: any) => c._id === course._id
                );
                return (
                  <label
                    key={course._id}
                    className={`flex items-center p-2 rounded-md cursor-pointer transition ${
                      isSelected
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-400"
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourse(course)}
                      className="sr-only"
                    />
                    <span className="ml-2 text-sm">{course.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        <MultiSelect label="Skills" field="skills" options={allSkills} />
        <MultiSelect
          label="Languages"
          field="languages"
          options={allLanguages}
        />
      </>
    ),

    courseFields: userType.toLowerCase() === "course" && (
      <>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Assigned Teachers:
          </p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading teachers...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {teachers.map((teacher) => {
                const isAssigned = formData.teachers?.some(
                  (t: any) => t._id === teacher._id
                );
                return (
                  <label
                    key={teacher._id}
                    className={`flex items-center p-2 rounded-md cursor-pointer transition ${
                      isAssigned
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-400"
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => toggleTeacher(teacher)}
                      className="sr-only"
                    />
                    <span className="ml-2 text-sm">{teacher.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
      </>
    ),

    gradeFields: userType.toLowerCase() === "grade" && (
      <>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
      </>
    ),
  };

  const getModalDescription = (type: string): string => {
    const map: Record<string, string> = {
      student:
        "Update personal details and academic information for this student.",
      teacher: "Modify professional profile, skills, and certifications.",
      parent: "Adjust contact details and family information.",
      admin: "Edit administrative details.",
      course: "Update name, description, and assigned teachers.",
      grade: "Modify title and description of this grade level.",
    };
    return map[type.toLowerCase()] || "Edit details for this user.";
  };

  return (
    <ModalDropdown onClose={onClose}>
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl ">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Edit {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </h2>

        <p className="text-xs text-gray-600 bg-gray-100 p-3 rounded-lg mb-5">
          {getModalDescription(userType)}
        </p>

        <div className="space-y-1">
          {Object.values(sections).filter(Boolean)}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};
