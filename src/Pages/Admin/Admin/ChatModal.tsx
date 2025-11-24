import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  isMe?: boolean; // optional
  image?: string; // optional
}

interface Props {
  username: string; // your own username
  chatMessages: ChatMessage[];
  sendChatMessage: () => void;
  chatInput: string;
  setChatInput: (val: string) => void;
}

// Custom Tailwind classes for the Dark Green/Yellow theme
const DARK_GREEN_BG = "bg-[#071F0C]"; // Custom very dark green
const MESSAGE_BG_OTHER = "bg-green-900"; // Darker background for other's messages
const MESSAGE_BG_ME = "bg-gradient-to-r from-yellow-600 to-yellow-500"; // Yellow gradient for my messages
const ACCENT_TEXT = "text-yellow-400"; // Text color for accents
const BUTTON_BG = "bg-yellow-500 hover:bg-yellow-600"; // Button background

export default function ChatModal({
  username,
  chatMessages,
  sendChatMessage,
  chatInput,
  setChatInput,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  console.log("Received chatMessages message:", chatMessages);

  const getSurname = (username: string) => {
    const parts = username.trim().split(" ");
    return parts.length > 1 ? parts[0] : username;
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          // STYLED: Dark Green/Yellow Button
          className={`fixed bottom-6 right-6 ${BUTTON_BG} text-gray-900 p-4 rounded-full shadow-2xl z-50 hover:shadow-yellow-500/50 transition-all`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={28} strokeWidth={2.5} />
            </motion.div>{" "}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            // STYLED: Dark Green Modal Background
            className={`fixed inset-y-0 right-0 w-full max-w-sm ${DARK_GREEN_BG} border-l border-green-900 shadow-2xl z-40 flex flex-col`}
          >
            {/* Chat Header */}
            <div className="p-5 bg-green-900/50 backdrop-blur-sm border-b border-green-900 flex justify-between items-center">
              <h2 className={`text-xl font-bold ${ACCENT_TEXT}`}>Class Chat</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              style={{
                // STYLED: Subtle background pattern for chat area
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%2334d399' stop-opacity='0.05'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grad)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            >
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">
                    Start the conversation!
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isMe = msg.username === username; // compare with your username
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-2xl shadow-lg ${
                            isMe
                              ? // STYLED: My Message (Yellow Gradient)
                                `${MESSAGE_BG_ME} text-gray-900 rounded-tr-none`
                              : // STYLED: Other's Message (Dark Green)
                                `${MESSAGE_BG_OTHER} text-gray-100 rounded-tl-none`
                          }`}
                        >
                          {!isMe && (
                            // STYLED: Other's Name (Yellow Text)
                            <p
                              className={`text-xs font-bold ${ACCENT_TEXT} mb-1`}
                            >
                              {getSurname(msg.username)}
                            </p>
                          )}
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="sent"
                              className="rounded-lg max-w-full h-auto mb-2"
                            />
                          )}
                          <p className="text-sm leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className={`p-4 bg-green-900 border-t border-green-900`}>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendChatMessage()
                  }
                  placeholder="Type a message..."
                  // STYLED: Input Field (Darker Green BG, Yellow focus ring)
                  className={`flex-1 bg-green-800 text-white rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500 text-sm`}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sendChatMessage}
                  // STYLED: Send Button (Yellow Gradient)
                  className={`bg-gradient-to-r from-yellow-600 to-yellow-500 p-3 rounded-full shadow-lg hover:shadow-yellow-600/50 transition`}
                >
                  <Send size={22} className="text-gray-900" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
