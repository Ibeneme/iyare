import {
  FaEdit,
  FaArrowLeft,
  FaChevronRight,
  //FaCheckCircle,
} from "react-icons/fa";
import UserTypeImages from "../../../../../../Components/Images/ImageAssets";
import "./UserDetailSections.css";
import { FaPaperPlane, FaPhoneAlt } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiCheckBadge } from "react-icons/hi2";
import "./Accordion.css";
import { UserDetailsDuo } from "../../UserDetailsTypes/userDetailsTypes";
// Helper function to format text
const formatText = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// Helper function to get styles based on type
const getStyle = (type?: string) => {
  switch ((type || "").toLowerCase()) {
    case "student":
      return {
        backgroundColor: "#6EC5FF17",
        border: "1px solid #6EC5FF", // Commented out as in your provided code
        color: "#6EC5FF",
      };
    case "parent":
      return {
        backgroundColor: "#e7f6ea",
        // border: "4px solid #228B22", // Commented out as in your provided code
        color: "#228B22",
      };
    case "admin":
    case "teacher":
      return {
        backgroundColor: "#fff1e6",
        // border: "4px solid #ff6600", // Commented out as in your provided code
        color: "#ff6600",
      };
    case "course":
    case "department":
    case "grade":
      return {
        backgroundColor: "#f3e6ff",
        // border: "4px solid #830CFA", // Commented out as in your provided code
        color: "#830CFA",
      };
    default:
      return {
        backgroundColor: "#f0f0f0",
        // border: "4px solid #555", // Commented out as in your provided code
        color: "#555",
      };
  }
};

// Helper function to render avatar initials with dynamic styling
const renderAvatar = (
  firstName?: string,
  lastName?: string,
  userType?: string,
  name?: string,
  title?: string
) => {
  let initials = "?";
  const type = userType?.toLowerCase();

  if (firstName && lastName) {
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName) {
    initials = `${firstName.slice(0, 4)}`.toUpperCase();
  } else {
    const fallback = title || name || "";
    initials = fallback.slice(0, 2).toUpperCase();
  }

  const style = getStyle(type);

  return (
    <div
      className="initials-avatar-reused"
      style={{
        ...style,
        width: "100%",
        height: 150,
        fontSize: "28px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        textTransform: "uppercase",

        // background:
        //   userType === "student"
        //     ? "linear-gradient(to bottom right, #6b21a8, #ec4899)"
        //     : "",

        // border: userType === "student" ? "none" : "",
      }}
    >
      {initials}
    </div>
  );
};

// Back button component
export const BackButton = ({
  onClick,
  isHovered,
  setHovered,
  bg = "#fff",
  color = "#666",
}: {
  onClick: () => void;
  isHovered: boolean;
  setHovered: (value: boolean) => void;
  bg?: any;
  color?: any;
}) => (
  <div className="back-button-wrapper">
    <button
      onClick={onClick}
      className={`back-button ${isHovered ? "back-button-hover" : ""}`}
      aria-label="Go back"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: bg,
        border: "none",
        color: color,
        width: "fit-content",
      }}
    >
      <FaArrowLeft />
    </button>
  </div>
);

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
  entries: [string, string | boolean][];
  firstName?: string;
  lastName?: string;
  name?: string;
  title?: string;
  email?: any;
  children?: React.ReactNode;
  teacherDetails?: {
    _id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    userType: "teacher";
    isSuspended: boolean;
    firstName?: string;
    lastName?: string;
  }[];
}) => {
  const typeKey = userType?.toLowerCase();
  const [isBackHovered, setIsBackHovered] = useState(false);
  const navigate = useNavigate();

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

  let initials = "";
  let primaryDisplay = "";

  if (firstName && lastName) {
    initials = firstName[0].toUpperCase() + lastName[0].toUpperCase();
    primaryDisplay = `${formatText(firstName)} ${formatText(lastName)}`; // Applied formatText
  } else if (name) {
    initials = name[0].toUpperCase();
    primaryDisplay = formatText(name); // Applied formatText
  } else if (title) {
    initials = title[0].toUpperCase();
    primaryDisplay = formatText(title); // Applied formatText
  } else {
    initials = userType ? userType[0].toUpperCase() : "?";
    primaryDisplay = userType
      ? `${formatText(userType)} User` // Applied formatText
      : "User";
  }

  const getAvatarClass = (type?: string) => {
    switch ((type || "").toLowerCase()) {
      case "student":
        return "avatar-student";
      case "parent":
        return "avatar-parent";
      case "admin":
      case "teacher":
        return "avatar-admin-teacher";
      case "course":
      case "department":
      case "grade":
        return "avatar-course-department-grade";
      default:
        return "avatar-default";
    }
  };

  const getAvatarStyle = (type?: string) => {
    switch ((type || "").toLowerCase()) {
      case "student":
        return {
          backgroundColor: "#e6f0ff",
          border: "4px solid #6EC5FF",
          color: "#6EC5FF",
        };
      case "parent":
        return {
          backgroundColor: "#e7f6ea",
          border: "4px solid #228B22",
          color: "#228B22",
        };
      case "admin":
      case "teacher":
        return {
          backgroundColor: "#fff1e6",
          border: "4px solid #ff6600",
          color: "#ff6600",
        };
      case "course":
      case "department":
      case "grade":
        return {
          backgroundColor: "#f3e6ff",
          border: "4px solid #830CFA",
          color: "#830CFA",
        };
      default:
        return {
          backgroundColor: "#f0f0f0",
          border: "4px solid #555",
          color: "#555",
        };
    }
  };

  const avatarStyle = getAvatarStyle(typeKey);
  const avatarClass = getAvatarClass(typeKey);

  const lowerCaseEntries = Object.fromEntries(
    entries.map(([key, value]) => [key.toLowerCase(), value])
  );

  const skills =
    typeof lowerCaseEntries["skills"] === "string"
      ? lowerCaseEntries["skills"]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const languages =
    typeof lowerCaseEntries["languages"] === "string"
      ? lowerCaseEntries["languages"]
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  // Accordion component to handle expanding/collapsing sections
  const Accordion = ({ title, children, isOpen, onClick }: any) => {
    return (
      <div className="accordion-container">
        <div className="accordion-header" onClick={onClick}>
          <h3 className="accordion-title">{title}</h3>
          <span className={`accordion-icon ${isOpen ? "open" : ""}`}>
            &#9660;
          </span>
        </div>
        <div className={`accordion-content ${isOpen ? "open" : ""}`}>
          {children}
        </div>
      </div>
    );
  };

  const TeacherCard = ({ teacher }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    const handleJoinClass = (classId: any) => {
      // This is where your API call or enrollment logic goes
      console.log(`Joining class with ID: ${classId}`);
      navigate(`/class-details/${classId}`);
    
    };

    return (
      <div className="teacher-card">
        <div className="teacher-header" onClick={handleToggle}>
          <h3 className="teacher-name">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <span className="toggle-icon">{isOpen ? "−" : "+"}</span>
        </div>

        {/* Conditionally render the content based on the isOpen state */}
        {isOpen && (
          <div className="teacher-content">
            <p>
              <strong>Email:</strong> {teacher.email}
            </p>
            <p>
              <strong>Certifications:</strong>{" "}
              {teacher.certifications.join(", ")}
            </p>

            {/* Displaying classes if they exist */}
            {teacher.classes && teacher.classes.length > 0 ? (
              <div className="class-list">
                <h4 className="classes-heading">Classes:</h4>
                {teacher.classes.map((classData: any) => {
                  // Format the date here
                  const formattedDate = new Date(
                    classData.date
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <div key={classData._id} className="class-item">
                      <p>
                        <strong>Name:</strong> {classData.title}
                      </p>
                      <p>
                        <strong>Date:</strong> {formattedDate}
                      </p>
                      <button
                        onClick={() => handleJoinClass(classData._id)}
                        className="join-button"
                      >
                        Join Class
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-classes">No classes listed for this teacher.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Component to display classes inside an accordion
  const ClassesAccordion = ({ classes }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!classes || classes.length === 0) {
      return null;
    }

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    return (
      <Accordion
        title={`Classes (${classes.length})`}
        isOpen={isOpen}
        onClick={handleToggle}
      >
        <div className="classes-container">
          {classes.map((course: any) => (
            <div key={course._id} className="class-item">
              <div className="class-details">
                <h4>{course.title}</h4>
                <p>{course.description}</p>
              </div>
              <a href={`/join/${course._id}`} className="join-button">
                Join Now
              </a>
            </div>
          ))}
        </div>
      </Accordion>
    );
  };

  return (
    <div className="user-details-wrapper">
      <div className="user-details-wrapper-padded">
        {bannerImage && (
          <div className="user-banner-wrapper">
            <img
              src={bannerImage}
              alt={`${userType} banner`}
              className="user-banner-image"
            />
            <div className="back-button-container">
              <BackButton
                onClick={() => navigate(-1)}
                isHovered={isBackHovered}
                setHovered={setIsBackHovered}
                bg={avatarStyle.backgroundColor}
                color={avatarStyle.color}
              />
            </div>
            <div
              className={`initials-avatar ${avatarClass}`}
              style={avatarStyle}
            >
              {initials}
            </div>
          </div>
        )}

        <div className="user-details-wrapper-padded-spread">
          <div>
            <h1 className="user-details-title user-details-title-margin">
              {["admin", "course", "department", "grade"].includes(
                userType?.toLowerCase() || ""
              ) ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span>
                    {primaryDisplay} -{" "}
                    {(userType?.charAt(0).toUpperCase() as any) +
                      userType?.slice(1)}
                  </span>
                  <HiCheckBadge style={{ color: "#4CAF50", fontSize: 22 }} />
                </span>
              ) : (
                primaryDisplay
              )}
            </h1>
            {email && email.trim() !== "" ? (
              <div className="email-contact-container">
                <div>
                  <p className="email-text">{email}</p>
                  {(lowerCaseEntries["certifications"] ||
                    lowerCaseEntries["schoolattended"] ||
                    lowerCaseEntries["status"] ||
                    lowerCaseEntries["gradetitle"]) && (
                    <p className="email-extra-text">
                      {lowerCaseEntries["gradetitle"] &&
                        `Grade Title: ${formatText(
                          String(lowerCaseEntries["gradetitle"])
                        )} || `}
                      {lowerCaseEntries["certifications"] &&
                        `Certifications: ${formatText(
                          String(lowerCaseEntries["certifications"])
                        )} || `}
                      {lowerCaseEntries["schoolattended"] &&
                        `School Attended: ${formatText(
                          String(lowerCaseEntries["schoolattended"])
                        )} || `}
                      {lowerCaseEntries["status"] &&
                        `Status: ${formatText(
                          String(lowerCaseEntries["status"])
                        )}`}
                    </p>
                  )}
                </div>
                <a
                  href={`mailto:${email}`}
                  className="mail-button"
                  style={{
                    backgroundColor: avatarStyle.color,
                    color: avatarStyle.backgroundColor,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className="mail-icon-wrapper"
                    style={{
                      backgroundColor: "#ffffff",
                      color: avatarStyle.color,
                    }}
                  >
                    <FaPaperPlane className="mail-icon" />
                  </span>{" "}
                  Send a Mail
                </a>
              </div>
            ) : (
              <p className="email-placeholder">No email provided</p>
            )}
          </div>

          <div>
            {userType === "admin" ||
            userType === "course" ||
            userType === "grade" ||
            userType === "department" ? (
              ""
            ) : (
              <>
                <div className="languages-section">
                  <h4 className="languages-skills-heading">Languages</h4>
                  {languages.length > 0 ? (
                    <div className="languages-skills-container">
                      {languages.map((lang, i) => (
                        <span key={i} className="language-skill-tag">
                          {formatText(lang)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="languages-skills-placeholder">
                      No languages added.
                    </p>
                  )}
                </div>

                <div className="skills-section">
                  <h4 className="languages-skills-heading">Skills</h4>
                  {skills.length > 0 ? (
                    <div className="languages-skills-container">
                      {skills.map((skill, i) => (
                        <span key={i} className="language-skill-tag">
                          {formatText(skill)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="languages-skills-placeholder">
                      No skills added yet.
                    </p>
                  )}
                </div>
              </>
            )}

            {children && (
              <div className="user-details-children-wrapper">{children}</div>
            )}
          </div>
        </div>
      </div>
<br />
      {teacherDetails &&
        teacherDetails.map((teacher: any) => <TeacherCard teacher={teacher} />)}
    </div>
  );
};

// Courses in Department component
export const CoursesInDepartment = ({
  courses = [],
  onViewDetails,
  userType,
}: any) => {
  // const buttonStyle = getStyle(userType);

  return (
    <div className="department-courses">
      <h2 className="section-heading">
        Courses <span className="course-count">({courses.length})</span>
      </h2>

      {courses.length === 0 ? (
        <p className="empty-message">
          No courses available for this {userType}.
        </p>
      ) : (
        <div className="courses-grid">
          {courses.map((course: any) => (
            <div className="course-card" key={course._id}>
              <div className="course-card-body">
                <h3 className="course-title">
                  {formatText(course.title || course.name || "Untitled Course")}
                </h3>

                <p className="course-description">
                  {course.description
                    ? course.description.length > 50
                      ? `${formatText(course.description.slice(0, 50))}...`
                      : formatText(course.description)
                    : "No description available"}
                </p>

                <button
                  className="view-details-button"
                  onClick={() => onViewDetails(course._id)}
                  style={{ backgroundColor: "#66666616", color: "#666" }}
                >
                  View Details
                  <span>
                    <FaChevronRight className="view-details-icon" />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Parent Details Card component
export const ParentDetailsCard = ({
  parent,
  onNavigate,
  onViewDetails,
  userType,
}: any) => {
  const buttonStyle = getStyle(userType);

  return (
    <div className="parent-details" onClick={() => onNavigate(parent._id)}>
      <h2 className="section-heading">Parent or Guardian Details</h2>
      <div className="parent-card">
        {renderAvatar(parent.firstName, parent.lastName, userType)}
        <h3>
          {formatText(parent.firstName)} {formatText(parent.lastName)}{" "}
          {/* Applied formatText */}
        </h3>
        <p className="parent-email">{parent.email}</p>
        {parent.phoneNumber && (
          <p className="parent-phone">{parent.phoneNumber}</p>
        )}
        <p className="parent-status">
          {parent.isSuspended ? "Suspended" : "Active"}
        </p>
        <div className="parent-actions">
          <button
            className="view-details-button"
            onClick={() => onViewDetails(parent._id)}
            style={{
              backgroundColor: buttonStyle.backgroundColor,
              color: buttonStyle.color,
            }}
          >
            View Details
            <span>
              <FaChevronRight className="view-details-icon" />
            </span>
          </button>

          {parent.email && (
            <a
              href={`mailto:${parent.email}`}
              className="parent-action-button"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: buttonStyle.backgroundColor,
                color: buttonStyle.color,
              }}
            >
              <FaPaperPlane className="parent-action-icon" />
            </a>
          )}

          {parent.phoneNumber && (
            <a
              href={`tel:${parent.phoneNumber}`}
              className="parent-action-button"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: buttonStyle.backgroundColor,
                color: buttonStyle.color,
              }}
            >
              <FaPhoneAlt className="parent-action-icon" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Children List component
export const ChildrenList = ({
  children,
  onNavigate,
  //onViewDetails,
  userType,
}: any) => {
  const buttonStyle = getStyle(userType); // Assuming children are always 'student' type

  return (
    <div className="children-list">
      <h2 className="section-heading">Children ({children.length})</h2>
      <div className="children-flex-grid">
        {children.map((child: any) => (
          <div
            className="child-card"
            key={child._id}
            onClick={() => onNavigate(child._id)}
            style={{
              borderRadius: 24,
            }}
          >
            {renderAvatar(child.firstName, child.lastName, userType)}
            <h3 style={{ paddingTop: 8, fontSize: 15 }}>
              {formatText(child.firstName)} {formatText(child.lastName)}
            </h3>
            <p style={{ fontSize: 12 }} className="child-email">
              {child.email}
            </p>
            {child.phoneNumber && (
              <p className="child-phone">
                <strong>Phone:</strong> {child.phoneNumber}
              </p>
            )}
            <button
              className="view-details-button-child"
              onClick={(e) => {
                e.stopPropagation(); // prevents triggering the parent card click
                onNavigate(child._id);
              }}
              style={{
                backgroundColor: buttonStyle.backgroundColor,
                color: buttonStyle.color,
                marginTop: 24,
              }}
            >
              View Child or Ward
              <span>
                <FaChevronRight className="view-details-icon" />
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface StudentsInGradeProps {
  students: any[];
  onNavigate: (id: string) => void;
  userType: string;
}

export const StudentsInGrade = ({
  students,
  onNavigate,
  userType,
}: StudentsInGradeProps) => {
  const buttonStyle = getStyle(userType);

  return (
    <div className="students-in-grade">
      <h2 className="section-heading">
        Students in this Grade ({students.length})
      </h2>

      <div className="children-flex-grid">
        {students.map((child: any) => (
          <div
            className="child-card"
            key={child._id}
            onClick={() => onNavigate(child._id)}
          >
            {renderAvatar(child.firstName, child.lastName, userType)}
            <h3>
              {formatText(child.firstName)} {formatText(child.lastName)}
            </h3>
            <p className="child-email">{child.email}</p>
            {child.phoneNumber && (
              <p className="child-phone">
                <strong>Phone:</strong> {child.phoneNumber}
              </p>
            )}
            <button
              className="view-details-button-child"
              onClick={(e) => {
                e.stopPropagation(); // prevents triggering the parent card click
                onNavigate(child._id);
              }}
              style={{
                backgroundColor: buttonStyle.backgroundColor,
                color: buttonStyle.color,
              }}
            >
              View Child or Ward
              <span>
                <FaChevronRight className="view-details-icon" />
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Student Grades List component
export const StudentGradesList = ({ grades, onEditGrade, showEdit }: any) => (
  <div className="student-grades">
    <h2 className="section-heading">
      Grades for this Student ({grades.length})
    </h2>

    <div className="grades-list">
      {grades.map((grade: any) => (
        <div className="grade-item" key={grade._id}>
          <div>
            <h3 className="grade-subject">{formatText(grade.subject)}</h3>{" "}
            {/* Applied formatText */}
            <p className="grade-score">
              Score: <strong>{grade.score}</strong>
            </p>
            {grade.comments && (
              <p className="grade-comments">
                Comments: {formatText(grade.comments)}
              </p> // Applied formatText
            )}
            {grade.dateAwarded && (
              <p className="grade-date">
                Date Awarded: {new Date(grade.dateAwarded).toLocaleDateString()}
              </p>
            )}
          </div>
          {showEdit && (
            <button
              onClick={() => onEditGrade(grade)}
              className="edit-grade-btn"
            >
              <FaEdit /> Edit
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Default export
export default {
  CoursesInDepartment,
  ParentDetailsCard,
  ChildrenList,
  StudentsInGrade,
  StudentGradesList,
};
