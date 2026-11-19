import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JoinClassButtonProps {
  classId?: any;
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
    <button onClick={handleJoin} disabled={isLoading} className="btn-primary btn-lg">
      {isLoading ? "Joining..." : "Join this class"}
    </button>
  );
};

export default JoinClassButton;
