import React from "react";
import { ClassData } from "../../../Redux/Admin/adminClasses";
import Loader from "../../../Components/Loader/Loader";
import { FaChevronRight } from "react-icons/fa";
import ErrorDisplay from "../../../Components/Loader/ErrorDisplay";
import { motion } from "framer-motion";

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
  if (loading) return <Loader />;

  if (error) return <ErrorDisplay errorMessage={error} />;

  if (!Array.isArray(classes)) {
    return (
      <p className="text-center text-red-600 py-4">
        Invalid data format for classes.
      </p>
    );
  }

  if (classes.length === 0) {
    return (
      <p className="text-left text-gray-500 py-4">
        No classes found.{" "}
        {allClassesCount === 0 && "Click 'Add a Class' to get started!"}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {classes.map((classData: any) => (
        <motion.div
          key={classData._id}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateToClassDetails(classData._id)}
          className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer transition-all duration-200"
        >
          {/* Image Placeholder */}
          <div
            className="h-32 flex items-center justify-center p-4 text-center"
            style={{ backgroundColor: getRandomBgColor() }}
          >
            <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
              {classData?.title}
            </h3>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            <p className="text-base font-bold text-gray-900">
              Course:{" "}
              {typeof classData.course === "object"
                ? classData.course.title || classData.course.name
                : classData.title}
            </p>

            <p className="text-sm text-gray-600">
              {`${classData.time} ${new Date(
                classData.date || ""
              ).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`}
            </p>

            {/* View Details Button */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigateToClassDetails(classData._id);
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
            >
              View Detail
              <FaChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ClassCardList;
