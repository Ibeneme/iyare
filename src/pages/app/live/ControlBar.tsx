import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Smile,
  Hand,
  VolumeX,
  Volume2,
} from "lucide-react";
import { Socket } from "socket.io-client";

interface ControlBarProps {
  socket: Socket | null;
  micEnabled: boolean;
  videoEnabled: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  isScreenSharing: boolean;
  raisedHands: Set<string>;
  userId: string;
  raiseHand: () => void;
  lowerHand: () => void;
  muteAll: () => void;
  unmuteAll: () => void;
  username: string;
  roomId: string;
  isForceMutedByHost?: boolean;
  userType: any;
}

const reactions = ["👍", "❤️", "😂", "👏", "🎉", "🤯"];

const ControlBar: React.FC<ControlBarProps> = ({
  socket,
  micEnabled,
  videoEnabled,
  toggleMic,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  isScreenSharing,
  raisedHands,
  userId,
  raiseHand,
  lowerHand,
  muteAll,
  unmuteAll,
  username,
  roomId,
  isForceMutedByHost,
  userType,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<any[]>([]);
  const [isAllMuted, setIsAllMuted] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  const isTeacher =
    userType === "teacher" || userType === "admin" || userType === "student";

  useEffect(() => {
    if (!socket) return;
    const handleReaction = (data: any) => {
      if (data.userId === userId) return;
      const id = Date.now() + Math.random();
      setFloatingReactions((p) => [
        ...p,
        { id, emoji: data.reaction, x: Math.random() * 60 + 20 },
      ]);
      setTimeout(
        () => setFloatingReactions((p) => p.filter((r) => r.id !== id)),
        2500,
      );
    };
    socket.on("reaction", handleReaction);
    return () => {
      socket.off("reaction");
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!showPicker) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showPicker]);

  const sendReaction = (emoji: string) => {
    socket?.emit("reaction", { userId, username, reaction: emoji, roomId });
    const id = Date.now();
    setFloatingReactions((p) => [...p, { id, emoji, x: 50 }]);
    setTimeout(
      () => setFloatingReactions((p) => p.filter((r) => r.id !== id)),
      2500,
    );
    setShowPicker(false);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 inset-x-0 z-50 flex justify-center px-2 sm:px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      {/* Floating Emotions */}
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -320, opacity: [0, 1, 0], scale: [1, 1.75] }}
            className="absolute bottom-14 text-3xl sm:text-5xl select-none"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="pointer-events-auto max-w-full bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 sm:p-2 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xl text-white">
        {/* Mic Toggle */}
        <button
          type="button"
          onClick={toggleMic}
          aria-label={
            micEnabled && !isForceMutedByHost
              ? "Mute microphone"
              : "Unmute microphone"
          }
          className={`h-10 w-10 sm:h-12 sm:w-auto sm:min-w-12 sm:px-3.5 shrink-0 grid place-items-center rounded-full active:scale-95 transition-all ${
            micEnabled && !isForceMutedByHost
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {micEnabled && !isForceMutedByHost ? (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={isScreenSharing ? undefined : toggleVideo}
          disabled={isScreenSharing}
          aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
          className={`h-10 w-10 sm:h-12 sm:w-auto sm:min-w-12 sm:px-3.5 shrink-0 grid place-items-center rounded-full active:scale-95 transition-all ${
            videoEnabled && !isScreenSharing
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500 hover:bg-red-600"
          } ${isScreenSharing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {videoEnabled ? (
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Screen Share */}
        {isTeacher && (
          <button
            type="button"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
            className={`h-10 w-10 sm:h-12 sm:w-auto sm:min-w-12 px-2.5 sm:px-3.5 shrink-0 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 transition-all ${
              isScreenSharing
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="hidden md:inline text-xs font-semibold uppercase tracking-wide">
              {isScreenSharing ? "Stop" : "Share"}
            </span>
          </button>
        )}

        {/* Reactions Picker */}
        <div ref={pickerContainerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            aria-label="Send reaction"
            className="h-10 w-10 sm:h-12 sm:w-auto sm:min-w-12 sm:px-3.5 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {showPicker && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-max max-w-[calc(100vw-2rem)] bg-neutral-900/95 border border-white/10 px-2.5 py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-2xl overflow-x-auto">
              {reactions.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => sendReaction(e)}
                  className="text-xl sm:text-2xl p-1 hover:scale-125 active:scale-95 transition-transform shrink-0"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Raise Hand */}
        <button
          type="button"
          onClick={raisedHands.has(userId) ? lowerHand : raiseHand}
          aria-label={raisedHands.has(userId) ? "Lower hand" : "Raise hand"}
          className={`h-10 w-10 sm:h-12 sm:w-auto sm:min-w-12 sm:px-3.5 shrink-0 grid place-items-center rounded-full active:scale-95 transition-all ${
            raisedHands.has(userId)
              ? "bg-[#FFD000] text-neutral-900"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Mute / Unmute All */}
        {isTeacher && (
          <button
            type="button"
            onClick={() => {
              isAllMuted ? unmuteAll() : muteAll();
              setIsAllMuted(!isAllMuted);
            }}
            aria-label={
              isAllMuted ? "Unmute all participants" : "Mute all participants"
            }
            className={`h-10 sm:h-12 px-2.5 sm:px-4 shrink-0 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-[11px] sm:text-xs uppercase active:scale-95 transition-all ${
              isAllMuted
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isAllMuted ? (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Unmute All</span>
                <span className="sm:hidden">Unmute</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Mute All</span>
                <span className="sm:hidden">Mute</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ControlBar;
