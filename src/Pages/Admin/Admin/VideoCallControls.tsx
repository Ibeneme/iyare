import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  MessageSquare,
  PhoneOff,
  Settings,
  MoreVertical,
} from "lucide-react";

// Define the shape of the props this component will receive
interface VideoCallControlsProps {
  onEndCall: () => void;
  onToggleMic: (isMuted: boolean) => void;
  onToggleVideo: (isOff: boolean) => void;
  onToggleScreenshare: () => void;
  // You would expand this with more handlers as your application grows
}

const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  onEndCall,
  onToggleMic,
  onToggleVideo,
  onToggleScreenshare,
}) => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreensharing, setIsScreensharing] = useState(false);

  // --- Handlers ---

  const handleMicToggle = () => {
    const newState = !isMicMuted;
    setIsMicMuted(newState);
    onToggleMic(newState); // Pass the new state up to the parent/WebRTC logic
  };

  const handleVideoToggle = () => {
    const newState = !isVideoOff;
    setIsVideoOff(newState);
    onToggleVideo(newState); // Pass the new state up
  };

  const handleScreenshareToggle = () => {
    setIsScreensharing(!isScreensharing);
    onToggleScreenshare();
  };

  // --- Control Button Component ---

  interface ControlButtonProps {
    Icon: React.ElementType;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    isDanger?: boolean;
    className?: string;
  }

  const ControlButton: React.FC<ControlButtonProps> = ({
    Icon,
    label,
    onClick,
    isActive = false,
    isDanger = false,
    className = "",
  }) => {
    let bgColorClass = "bg-gray-700 hover:bg-gray-600";
    let iconColorClass = "text-white";

    if (isDanger) {
      bgColorClass = "bg-red-500 hover:bg-red-600";
      iconColorClass = "text-white";
    } else if (isActive) {
      // Toggled ON/Active state (e.g., mic/video is OFF, but button is ON)
      bgColorClass = "bg-red-500 hover:bg-red-600";
      iconColorClass = "text-white";
    }

    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center p-3 rounded-full transition-colors duration-200 ${bgColorClass} ${className}`}
        title={label}
      >
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </button>
    );
  };

  return (
    // Main Container: Fixed at the bottom, centered, with dark background
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-sm z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left Section: Time/Info */}
        <div className="text-white text-lg font-medium">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          <span className="text-gray-400 ml-2"> | Room ID: ...</span>
        </div>

        {/* Center Section: Main Controls */}
        <div className="flex space-x-3">
          {/* Mic Toggle */}
          <ControlButton
            Icon={isMicMuted ? MicOff : Mic}
            label={isMicMuted ? "Unmute" : "Mute"}
            onClick={handleMicToggle}
            isActive={isMicMuted}
          />

          {/* Video Toggle */}
          <ControlButton
            Icon={isVideoOff ? VideoOff : Video}
            label={isVideoOff ? "Turn on camera" : "Turn off camera"}
            onClick={handleVideoToggle}
            isActive={isVideoOff}
          />

          {/* Screen Share */}
          <ControlButton
            Icon={ScreenShare}
            label={isScreensharing ? "Stop sharing" : "Present now"}
            onClick={handleScreenshareToggle}
            isActive={isScreensharing}
          />

          {/* Hang Up (Danger/Red Button) */}
          <ControlButton
            Icon={PhoneOff}
            label="End call"
            onClick={onEndCall}
            isDanger={true}
          />
        </div>

        {/* Right Section: Sidebar Controls (Chat, Participants, Settings) */}
        <div className="flex space-x-3">
          <ControlButton
            Icon={Users}
            label="Participants"
            onClick={() => console.log("Show Participants")}
            className="hidden sm:flex" // Hide on small screens for a cleaner look
          />
          <ControlButton
            Icon={MessageSquare}
            label="Chat"
            onClick={() => console.log("Show Chat")}
            className="hidden sm:flex"
          />
          <ControlButton
            Icon={Settings}
            label="Settings"
            onClick={() => console.log("Show Settings")}
          />
          <ControlButton
            Icon={MoreVertical}
            label="More options"
            onClick={() => console.log("Show More Menu")}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallControls;
