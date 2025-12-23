// ControlBar.tsx — UPDATED WITH MUTE ALL + UNMUTE ALL TOGGLE
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
  unmuteAll: () => void; // ← NEW: Unmute All function
  username: string;
  roomId: string;
  isForceMutedByHost?: boolean;
  userType: any;
}

const reactions = ["👍", "❤️", "😂", "👏", "🎉", "🤯"];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

const ControlBar: React.FC<ControlBarProps> = ({
  socket,
  micEnabled,
  videoEnabled,
  toggleMic,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  isScreenSharing,
  raisedHands = new Set(),
  userId,
  raiseHand,
  lowerHand,
  muteAll,
  unmuteAll,
  username,
  roomId,
  isForceMutedByHost = false,
  userType,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);

  const isHost = /teacher|admin|host/i.test(username);
  const [isAllMuted, setIsAllMuted] = useState(false);

  const sendReaction = (emoji: string) => {
    if (!socket || !roomId || !userId) return;
    socket.emit("reaction", { userId, username, reaction: emoji, roomId });
    const id = `local-${Date.now()}`;
    const x = Math.random() * 60 + 20;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(
      () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
      2500
    );
    setShowPicker(false);
  };

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data: { userId: string; reaction: string }) => {
      if (data.userId === userId) return;
      const id = `remote-${Date.now()}-${Math.random()}`;
      const x = Math.random() * 60 + 20;
      setFloatingReactions((prev) => [
        ...prev,
        { id, emoji: data.reaction, x },
      ]);
      setTimeout(
        () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
        2500
      );
    };

    socket.on("reaction", handleReaction);
    return () => {
      socket.off("reaction", handleReaction);
    };
  }, [socket, userId]);

  const isHandRaised = raisedHands?.has ? raisedHands.has(userId) : false;

  const handleMuteToggleAll = () => {
    if (isAllMuted) {
      unmuteAll();
      setIsAllMuted(false);
    } else {
      muteAll();
      setIsAllMuted(true);
    }
  };

  return (
    <>
      {/* Floating Reactions */}
      <div className="fixed bottom-28 inset-x-0 z-20 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-3xl">
          <AnimatePresence>
            {floatingReactions.map((r) => (
              <motion.div
                key={r.id}
                initial={{ y: 100, opacity: 0, scale: 0.5 }}
                animate={{ y: -200, opacity: [1, 1, 0], scale: [1, 1.5, 2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                className="absolute text-5xl select-none pointer-events-none drop-shadow-2xl"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-8 inset-x-0 z-50 pointer-events-none flex justify-center px-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl px-6 py-4 flex flex-wrap gap-4 justify-center items-center shadow-2xl"
        >
          {/* Mic Button - Shows red if force muted */}
          <button
            onClick={toggleMic}
            className={`p-4 rounded-2xl transition ${
              micEnabled && !isForceMutedByHost ? "bg-white/10" : "bg-red-500"
            }`}
          >
            {micEnabled && !isForceMutedByHost ? (
              <Mic className="text-white" />
            ) : (
              <MicOff className="text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition ${
              videoEnabled ? "bg-white/10" : "bg-red-500"
            }`}
          >
            {videoEnabled ? (
              <Video className="text-white" />
            ) : (
              <VideoOff className="text-white" />
            )}
          </button>

          {userType === "teacher" ||
            (userType === "admin" && (
              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className={`px-5 py-3 rounded-2xl flex gap-2 items-center transition ${
                  isScreenSharing ? "bg-green-600" : "bg-white/10"
                }`}
              >
                {isScreenSharing ? <MonitorOff /> : <MonitorUp />}
                <span className="text-sm font-medium">
                  {isScreenSharing ? "Stop" : "Share"}
                </span>
              </button>
            ))}

          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="p-4 bg-white/10 rounded-2xl"
            >
              <Smile />
            </button>
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-3 bg-gray-900 p-4 rounded-2xl border border-white/10 shadow-xl"
                >
                  {reactions.map((e) => (
                    <button
                      key={e}
                      onClick={() => sendReaction(e)}
                      className="text-3xl hover:scale-150 transition transform"
                    >
                      {e}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={isHandRaised ? lowerHand : raiseHand}
            className={`px-5 py-3 rounded-2xl flex gap-2 items-center transition ${
              isHandRaised ? "bg-yellow-500 text-black" : "bg-white/10"
            }`}
          >
            <Hand className="w-5 h-5" />
            <span className="text-sm font-medium">Raise Hand</span>
          </button>

          {/* === MUTE ALL / UNMUTE ALL BUTTON - ONLY FOR HOST === */}
          {userType === "teacher" ||
            (userType === "admin" && (
              <button
                onClick={handleMuteToggleAll}
                className={`px-6 py-3 rounded-2xl flex gap-2 items-center font-medium transition ${
                  isAllMuted
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600/80 hover:bg-red-500"
                }`}
              >
                {isAllMuted ? (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>Unmute All</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-5 h-5" />
                    <span>Mute All</span>
                  </>
                )}
              </button>
            ))}

          {/* Optional: Show muted by host indicator for students */}
          {!isHost && isForceMutedByHost && (
            <div className="px-4 py-2 bg-red-900/50 rounded-2xl text-sm">
              🔇 Muted by teacher
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ControlBar;
