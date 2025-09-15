import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JoinClassButtonProps {
  classId: string;
  classTitle?: any;
}

const JoinClassButton: React.FC<JoinClassButtonProps> = ({
  classId,
  classTitle,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!classId) return;
    setIsLoading(true);

    try {
      // Replace this with your actual API call
      console.log("🔗 Joining class:", classId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("✅ Joined class successfully");
      navigate(`/join/${classId}/${encodeURIComponent(classTitle)}`);
    } catch (error) {
      console.error("❌ Error joining class:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "30px 0" }}>
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-8px);
            }
            60% {
              transform: translateY(-4px);
            }
          }
        `}
      </style>

      <button
        onClick={handleJoin}
        disabled={isLoading}
        style={{
          background: "var(--dark-green)",
          color: "var(--yellow)",
          padding: "14px 24px",
          border: "none",
          borderRadius: "6px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontWeight: 500,
          animation: "bounce 1.5s infinite",
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? "Joining..." : "Join this Class"}
      </button>
    </div>
  );
};

export default JoinClassButton;
