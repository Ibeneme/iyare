import React from "react";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";

interface WarningNoticeProps {
  message?: string;
}

const defaultMessage = `
Dear Students, please be reminded that punctuality and preparedness are essential for your academic success.

Always review your class schedule regularly, check for any updates or changes, and ensure you join your classes on time.

Come prepared with all necessary materials and take responsibility for your learning by reviewing past lessons and participating actively in discussions.

Remember, consistency, respect for your instructors and peers, and unwavering dedication will contribute greatly to your overall performance.

Let's continue building a culture of excellence together.
`;

const WarningNotice: React.FC<WarningNoticeProps> = ({ message }) => {
  const finalMessage = message || defaultMessage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-50 border border-yellow-200"
    >
      {/* Glowing Light Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex gap-4 items-start">
        {/* Animated Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex-shrink-0 w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center"
        >
          <FaExclamationTriangle className="w-6 h-6 text-yellow-700" />
        </motion.div>

        {/* Text */}
        <p className="text-sm md:text-base text-amber-900 leading-relaxed whitespace-pre-line">
          {finalMessage}
        </p>
      </div>

      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 opacity-50" />
    </motion.div>
  );
};

export default WarningNotice;
