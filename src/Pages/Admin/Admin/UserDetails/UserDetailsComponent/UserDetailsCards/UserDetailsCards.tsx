import React, { useState } from "react";
import {
  FaEdit,
  FaArrowLeft,
  FaChevronRight,
  FaPaperPlane,
} from "react-icons/fa";
import { HiCheckBadge } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import UserTypeImages from "../../../../../../Components/Images/ImageAssets";

// === Types ===
type Entry = [string, string | boolean];
type Teacher = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  certifications?: string[];
  classes?: Array<{
    _id: string;
    title: string;
    date: string;
  }>;
};

type Course = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
};

type Child = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
};

type Grade = {
  _id: string;
  subject: string;
  score: string | number;
  comments?: string;
  dateAwarded?: string;
};

// === Utility Functions ===
const formatText = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

const getStyle = (type?: string) => {
  const t = (type || "").toLowerCase();
  switch (t) {
    case "student":
      return {
        bg: "bg-blue-50",
        border: "border-blue-400",
        text: "text-blue-600",
      };
    case "parent":
      return {
        bg: "bg-green-50",
        border: "border-green-500",
        text: "text-green-700",
      };
    case "admin":
    case "teacher":
      return {
        bg: "bg-orange-50",
        border: "border-orange-400",
        text: "text-orange-600",
      };
    case "course":
    case "department":
    case "grade":
      return {
        bg: "bg-purple-50",
        border: "border-purple-500",
        text: "text-purple-700",
      };
    default:
      return {
        bg: "bg-gray-100",
        border: "border-gray-400",
        text: "text-gray-600",
      };
  }
};

// === Avatar Component ===
const renderAvatar = (
  firstName?: string,
  lastName?: string,
  userType?: string,
  name?: string,
  title?: string
) => {
  let initials = "?";
  console.log(initials);
  if (firstName && lastName)
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  else if (firstName) initials = firstName.slice(0, 2).toUpperCase();
  else initials = (title || name || "").slice(0, 2).toUpperCase() || "?";

  const { bg, border, text } = getStyle(userType);

  return (
    <div
      className={`w-full h-36 ${bg} ${border} border-4 ${text} rounded-xl flex items-center justify-center text-3xl font-bold uppercase`}
    >
      {initials}
    </div>
  );
};

// === Back Button ===
export const BackButton = ({ onClick }: { onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 group"
      aria-label="Go back"
    >
      <FaArrowLeft
        className={`w-5 h-5 text-gray-700 transition-transform ${
          isHovered ? "translate-x-[-2px]" : ""
        }`}
      />
    </button>
  );
};

// === Main User Details Card ===
export const UserDetailsEntries = ({
  userType,
  entries,
  firstName,
  lastName,
  title,
  name,
  email,
  children,
  teacherDetails,
}: {
  userType?: string;
  entries: Entry[];
  firstName?: string;
  lastName?: string;
  name?: string;
  title?: string;
  email?: string;
  children?: React.ReactNode;
  teacherDetails?: Teacher[];
}) => {
  const navigate = useNavigate();
  const typeKey = userType?.toLowerCase();
  const { bg, text } = getStyle(userType);

  const bannerKey = ["course", "department", "grade"].includes(typeKey || "")
    ? "bgCourses"
    : ["teacher", "admin"].includes(typeKey || "")
    ? "bgFree"
    : typeKey === "parent"
    ? "bgStudent"
    : typeKey === "student"
    ? "bgParents"
    : null;

  const bannerImage = bannerKey
    ? UserTypeImages[bannerKey as keyof typeof UserTypeImages]
    : null;

  let initials = "",
    primaryDisplay = "";

  console.warn(initials);

  if (firstName && lastName) {
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
    primaryDisplay = `${formatText(firstName)} ${formatText(lastName)}`;
  } else if (name) {
    initials = name[0].toUpperCase();
    primaryDisplay = formatText(name);
  } else if (title) {
    initials = title[0].toUpperCase();
    primaryDisplay = formatText(title);
  } else {
    initials = userType?.[0].toUpperCase() || "?";
    primaryDisplay = userType ? `${formatText(userType)} User` : "User";
  }

  // === FIX: Only string values in lowerEntries ===
  const lowerEntries: Record<string, string> = Object.fromEntries(
    entries
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
      .map(([k, v]) => [k.toLowerCase(), v.trim()])
  );

  // === FIX: Explicit typing for map parameters ===
  const skills: string[] = (lowerEntries["skills"] || "")
    .split(",")
    .map((skill: string) => skill.trim())
    .filter(Boolean);

  const languages: string[] = (lowerEntries["languages"] || "")
    .split(",")
    .map((lang: string) => lang.trim())
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Banner + Avatar */}
      {bannerImage && (
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          <BackButton onClick={() => navigate(-1)} />
          <div className="absolute bottom-0 left-6 translate-y-1/2 w-36">
            {renderAvatar(firstName, lastName, userType, name, title)}
          </div>
        </div>
      )}

      <div className={`${bannerImage ? "pt-20" : "p-6"} px-6 pb-6`}>
        {/* Name & Title */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{primaryDisplay}</h1>
          {["admin", "course", "department", "grade"].includes(
            typeKey || ""
          ) && <HiCheckBadge className="w-6 h-6 text-green-500" />}
        </div>
        <p className="text-sm text-gray-500 capitalize mb-4">{typeKey}</p>

        {/* Email & Extra Info */}
        {email ? (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-medium text-gray-900">{email}</p>
              {(lowerEntries["gradetitle"] ||
                lowerEntries["certifications"] ||
                lowerEntries["schoolattended"] ||
                lowerEntries["status"]) && (
                <p className="text-xs text-gray-500 mt-1">
                  {lowerEntries["gradetitle"] &&
                    `Grade: ${formatText(lowerEntries["gradetitle"])} • `}
                  {lowerEntries["certifications"] &&
                    `Cert: ${formatText(lowerEntries["certifications"])} • `}
                  {lowerEntries["schoolattended"] &&
                    `School: ${formatText(lowerEntries["schoolattended"])} • `}
                  {lowerEntries["status"] &&
                    `Status: ${formatText(lowerEntries["status"])}`}
                </p>
              )}
            </div>
            <a
              href={`mailto:${email}`}
              className={`inline-flex items-center gap-2 px-4 py-2 ${bg} ${text} rounded-lg font-medium text-sm hover:opacity-90 transition`}
            >
              <FaPaperPlane className="w-4 h-4" />
              Send Mail
            </a>
          </div>
        ) : (
          <p className="text-gray-400 italic mb-4">No email provided</p>
        )}

        {/* Skills & Languages */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {languages.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {formatText(lang)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {formatText(skill)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Children (Action Buttons) */}
        {children && <div className="mt-6">{children}</div>}
      </div>

      {/* Teacher Cards */}
      {teacherDetails &&
        teacherDetails.map((teacher) => (
          <TeacherCard key={teacher._id} teacher={teacher} />
        ))}
    </div>
  );
};

// === Teacher Accordion Card ===
const TeacherCard = ({ teacher }: { teacher: Teacher }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleJoinClass = (classId: string) => {
    navigate(`/class-details/${classId}`);
  };

  return (
    <div className="border-t border-gray-200 mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <h3 className="font-semibold text-gray-900">
          {teacher.firstName} {teacher.lastName}
        </h3>
        <span className="text-xl font-bold text-gray-500">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-3">
          <p>
            <strong>Email:</strong> {teacher.email || "N/A"}
          </p>
          {teacher.certifications?.length ? (
            <p>
              <strong>Certifications:</strong>{" "}
              {teacher.certifications.join(", ")}
            </p>
          ) : null}
          {teacher.classes?.length ? (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Classes:</h4>
              {teacher.classes.map((cls) => (
                <div
                  key={cls._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                >
                  <div>
                    <p className="font-medium">{cls.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(cls.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinClass(cls._id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No classes listed.</p>
          )}
        </div>
      )}
    </div>
  );
};

// === Courses in Department ===
export const CoursesInDepartment = ({
  courses = [],
  onViewDetails,
}: {
  courses?: Course[];
  onViewDetails: (id: string) => void;
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Courses <span className="text-gray-500">({courses.length})</span>
      </h2>
      {courses.length === 0 ? (
        <p className="text-gray-500 italic">No courses available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course._id}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                {formatText(course.title || course.name || "Untitled")}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {course.description
                  ? course.description.length > 50
                    ? `${course.description.slice(0, 50)}...`
                    : course.description
                  : "No description"}
              </p>
              <button
                onClick={() => onViewDetails(course._id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                View Details <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === Children List ===
export const ChildrenList = ({
  children,
  onNavigate,
}: {
  children: Child[];
  onNavigate: (id: string) => void;
}) => {
  const { bg, text } = getStyle("student");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Children <span className="text-gray-500">({children.length})</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div
            key={child._id}
            onClick={() => onNavigate(child._id)}
            className="p-4 border border-gray-200 rounded-2xl hover:shadow-md transition cursor-pointer"
          >
            {renderAvatar(child.firstName, child.lastName, "student")}
            <h3 className="mt-3 font-semibold text-gray-900">
              {formatText(child.firstName)} {formatText(child.lastName)}
            </h3>
            <p className="text-sm text-gray-600">{child.email}</p>
            {child.phoneNumber && (
              <p className="text-xs text-gray-500 mt-1">
                Phone: {child.phoneNumber}
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(child._id);
              }}
              className={`mt-4 w-full py-2 ${bg} ${text} rounded-lg font-medium text-sm hover:opacity-90 transition`}
            >
              View Child <FaChevronRight className="inline ml-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// === Students in Grade ===
export const StudentsInGrade = ({
  students,
  onNavigate,
}: {
  students: Child[];
  onNavigate: (id: string) => void;
}) => {
  const { bg, text } = getStyle("student");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Students in Grade{" "}
        <span className="text-gray-500">({students.length})</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <div
            key={student._id}
            onClick={() => onNavigate(student._id)}
            className="p-4 border border-gray-200 rounded-2xl hover:shadow-md transition cursor-pointer"
          >
            {renderAvatar(student.firstName, student.lastName, "student")}
            <h3 className="mt-3 font-semibold text-gray-900">
              {formatText(student.firstName)} {formatText(student.lastName)}
            </h3>
            <p className="text-sm text-gray-600">{student.email}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(student._id);
              }}
              className={`mt-4 w-full py-2 ${bg} ${text} rounded-lg font-medium text-sm hover:opacity-90 transition`}
            >
              View Student <FaChevronRight className="inline ml-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// === Student Grades List ===
export const StudentGradesList = ({
  grades,
  onEditGrade,
  showEdit,
}: {
  grades: Grade[];
  onEditGrade: (grade: Grade) => void;
  showEdit: boolean;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      Grades <span className="text-gray-500">({grades.length})</span>
    </h2>
    <div className="space-y-4">
      {grades.map((grade) => (
        <div
          key={grade._id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
        >
          <div>
            <h3 className="font-semibold text-gray-900">
              {formatText(grade.subject)}
            </h3>
            <p className="text-sm text-gray-600">
              Score: <strong>{grade.score}</strong>
            </p>
            {grade.comments && (
              <p className="text-xs text-gray-500 mt-1">
                Comments: {formatText(grade.comments)}
              </p>
            )}
            {grade.dateAwarded && (
              <p className="text-xs text-gray-400">
                {new Date(grade.dateAwarded).toLocaleDateString()}
              </p>
            )}
          </div>
          {showEdit && (
            <button
              onClick={() => onEditGrade(grade)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
            >
              <FaEdit className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// === Export Default ===
export default {
  UserDetailsEntries,
  CoursesInDepartment,
  ChildrenList,
  StudentsInGrade,
  StudentGradesList,
};
