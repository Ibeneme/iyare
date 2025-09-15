import React from "react";
import "./WarningNotice.css";
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
    <div className="warning-container">
      <div
        className="warning-banner"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          marginBottom: 0,
        }}
      >
        <FaExclamationTriangle className="warning-icon" />

        <p
          className="warning-text ps-4"
          style={{ whiteSpace: "pre-line", marginTop: -0 }}
        >
          {finalMessage}
        </p>
      </div>
    </div>
  );
};

export default WarningNotice;
