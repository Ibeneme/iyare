import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  VolumeX,
  Smile,
} from "lucide-react";

interface Props {
  micEnabled: boolean;
  videoEnabled: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  isScreenSharing: boolean;
  sendReaction: (reaction: string) => void;
  raisedHands: Set<string>;
  userId: string;
  raiseHand: () => void;
  lowerHand: () => void;
  muteAll: () => void;
}

export default function ControlBar({
  micEnabled,
  videoEnabled,
  toggleMic,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  isScreenSharing,
  sendReaction,
  raisedHands,
  userId,
  raiseHand,
  lowerHand,
  muteAll,
}: Props) {
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string; x: number }[]
  >([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTimeout, setPickerTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerReaction = (emoji: string) => {
    const id = Date.now();
    const x = Math.random() * 70 + 15;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    sendReaction(emoji);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const reactions = ["👍", "❤️", "😂", "👏", "🎉", "🤯"];

  const openPicker = () => {
    setShowPicker(true);
    if (pickerTimeout) clearTimeout(pickerTimeout);

    const timeout = setTimeout(() => {
      setShowPicker(false);
    }, 10000); // auto-close after 10s

    setPickerTimeout(timeout);
  };

  const selectReaction = (emoji: string) => {
    triggerReaction(emoji);
    setShowPicker(false);
    if (pickerTimeout) clearTimeout(pickerTimeout);
  };

  return (
    <div className="fixed bottom-8 inset-x-0 z-10 pointer-events-none max-w-[1000px] mx-auto flex justify-center left-4 right-4">
      {/* Floating Reactions */}
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 100, opacity: 0, scale: 0.5 }}
            animate={{ y: -180, opacity: [1, 1, 0], scale: [1, 1.4, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute pointer-events-none select-none text-3xl"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Control Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pointer-events-auto bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl px-6 py-5 flex flex-wrap gap-4 justify-center shadow-2xl"
        style={{
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Mic */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMic}
          className={`relative p-4 rounded-2xl transition-all duration-300 ${
            micEnabled
              ? "bg-white/20 hover:bg-white/30"
              : "bg-red-500/80 hover:bg-red-600"
          }`}
        >
          {micEnabled ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
          {!micEnabled && (
            <span className="absolute inset-0 rounded-2xl animate-ping bg-red-500/50" />
          )}
        </motion.button>

        {/* Video */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleVideo}
          className={`relative p-4 rounded-2xl transition-all duration-300 ${
            videoEnabled
              ? "bg-white/20 hover:bg-white/30"
              : "bg-red-500/80 hover:bg-red-600"
          }`}
        >
          {videoEnabled ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
          {!videoEnabled && (
            <span className="absolute inset-0 rounded-2xl animate-ping bg-red-500/50" />
          )}
        </motion.button>

        {/* Screen Share */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition-all ${
            isScreenSharing
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-5 h-5" /> Stop Share
            </>
          ) : (
            <>
              <MonitorUp className="w-5 h-5" /> Share Screen
            </>
          )}
        </motion.button>

        {/* Reactions Picker Button */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openPicker}
            className="p-3 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm text-xl"
          >
            <Smile className="w-6 h-6 text-white" />
          </motion.button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full mb-2 flex gap-2 bg-gray-800/90 p-2 rounded-xl shadow-lg"
              >
                {reactions.map((emoji, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => selectReaction(emoji)}
                    className="text-2xl"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Raise Hand */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={raisedHands.has(userId || "") ? lowerHand : raiseHand}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all ${
            raisedHands.has(userId || "")
              ? "bg-yellow-500/80 hover:bg-yellow-600 text-white"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
        >
          <Hand className="w-5 h-5" />
          {raisedHands.has(userId || "") ? "Lower Hand" : "Raise Hand"}
        </motion.button>

        {/* Mute All */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={muteAll}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-medium text-white shadow-lg hover:shadow-rose-500/50 transition"
        >
          <VolumeX className="w-5 h-5" />
          Mute All
        </motion.button>
      </motion.div>
    </div>
  );
}