import React from "react";
import { ClassData } from "../../../Redux/Admin/adminClasses";
import Loader from "../../../Components/Loader/Loader";
import { FaChevronRight } from "react-icons/fa";
import ErrorDisplay from "../../../Components/Loader/ErrorDisplay";

interface ClassCardListProps {
  classes: ClassData[] | string;
  loading: boolean;
  error: string | null;
  allClassesCount?: number;
  navigateToClassDetails: (id: string) => void;
}

const getRandomBgColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 85%)`;
};

const ClassCardList: React.FC<ClassCardListProps> = ({
  classes,
  loading,
  error,
  allClassesCount,
  navigateToClassDetails,
}) => {
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorDisplay errorMessage={error} />;
  }

  if (!Array.isArray(classes)) {
    return (
      <p style={{ textAlign: "center", color: "red", padding: "16px 0" }}>
        Invalid data format for classes.
      </p>
    );
  }

  if (classes.length === 0) {
    return (
      <p style={{ textAlign: "left", padding: "16px 0", color: "#999" }}>
        No classes found.{" "}
        {allClassesCount === 0 && "Click 'Add a Class' to get started!"}
      </p>
    );
  }

  return (
    <div className="classes-grid">
      {classes?.map((classData: any) => (
        <div
          key={classData._id}
          className="class-item clickable"
          onClick={() => navigateToClassDetails(classData._id)}
        >
          <div
            className="class-image-placeholder"
            style={{ backgroundColor: getRandomBgColor() }}
          >
            <h3>{classData?.title}</h3>
          </div>
          <div className="class-info">
            <p style={{ fontSize: 16, fontWeight: 700, color: "#121212" }}>
              Course:{" "}
              {typeof classData.course === "object"
                ? classData.course.title || classData.course.name
                : classData.title}
            </p>

            <p className="class-date">
              {`${classData.time} ${new Date(
                classData.date || ""
              ).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToClassDetails(classData._id);
              }}
              style={{ padding: 16, borderRadius: 48, fontSize: 14 }}
            >
              View Detail
              <span>
                <FaChevronRight className="view-details-icon" />
              </span>
            </button>

            {/* <button
            className="view-details-button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToClassDetails(classData._id);
            }}
            style={{ backgroundColor: "#66666616", color: "#666" }}
          >
            View Details
            <span>
              <FaChevronRight className="view-details-icon" />
            </span>
          </button> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassCardList;
