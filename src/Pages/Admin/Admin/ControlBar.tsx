import React, { useState, useEffect } from "react";
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
        2500
      );
    };
    socket.on("reaction", handleReaction);
    return () => {
      socket.off("reaction");
    };
  }, [socket, userId]);

  const sendReaction = (emoji: string) => {
    socket?.emit("reaction", { userId, username, reaction: emoji, roomId });
    const id = Date.now();
    setFloatingReactions((p) => [...p, { id, emoji, x: 50 }]);
    setTimeout(
      () => setFloatingReactions((p) => p.filter((r) => r.id !== id)),
      2500
    );
    setShowPicker(false);
  };

  return (
    <div className="fixed bottom-8 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Floating Emotions */}
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -400, opacity: [0, 1, 0], scale: [1, 2] }}
            className="absolute text-5xl"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center gap-2 shadow-2xl">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-2xl ${
            micEnabled && !isForceMutedByHost
              ? "bg-white/5 hover:bg-white/10"
              : "bg-red-500"
          }`}
        >
          {micEnabled && !isForceMutedByHost ? (
            <Mic size={20} />
          ) : (
            <MicOff size={20} />
          )}
        </button>
        <button
          onClick={isScreenSharing ? undefined : toggleVideo}
          disabled={isScreenSharing}
          className={`p-4 rounded-2xl ${
            videoEnabled && !isScreenSharing
              ? "bg-white/5 hover:bg-white/10"
              : "bg-red-500"
          } ${isScreenSharing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {isTeacher && (
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-4 rounded-2xl flex gap-2 items-center ${
              isScreenSharing ? "bg-green-600" : "bg-white/5"
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff size={20} />
            ) : (
              <MonitorUp size={20} />
            )}
            <span className="text-xs font-bold uppercase">Share</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-4 rounded-2xl bg-white/5"
          >
            <Smile size={20} />
          </button>
          {showPicker && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-emerald-950 p-2 rounded-2xl flex gap-2 border border-white/20">
              {reactions.map((e) => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={raisedHands.has(userId) ? lowerHand : raiseHand}
          className={`p-4 rounded-2xl flex gap-2 items-center ${
            raisedHands.has(userId) ? "bg-yellow-500 text-black" : "bg-white/5"
          }`}
        >
          <Hand size={20} />
        </button>

        {isTeacher && (
          <button
            onClick={() => {
              isAllMuted ? unmuteAll() : muteAll();
              setIsAllMuted(!isAllMuted);
            }}
            className={`px-6 py-4 rounded-2xl flex gap-2 items-center font-bold text-xs uppercase ${
              isAllMuted ? "bg-green-600" : "bg-red-600/80"
            }`}
          >
            {isAllMuted ? (
              <>
                <Volume2 size={18} /> Unmute All
              </>
            ) : (
              <>
                <VolumeX size={18} /> Mute All
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
export default ControlBar;
