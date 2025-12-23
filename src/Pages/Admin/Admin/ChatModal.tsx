import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  isMe?: boolean;
  image?: string;
}

interface Props {
  username: string;
  chatMessages: ChatMessage[];
  sendChatMessage: () => void;
  chatInput: string;
  setChatInput: (val: string) => void;
}

const DARK_GREEN_BG = "bg-[#071F0C]";
const MESSAGE_BG_OTHER = "bg-green-900";
const MESSAGE_BG_ME = "bg-gradient-to-r from-yellow-600 to-yellow-500";
const ACCENT_TEXT = "text-yellow-400";
const BUTTON_BG = "bg-yellow-500 hover:bg-yellow-600";

export default function ChatModal({
  username,
  chatMessages,
  sendChatMessage,
  chatInput,
  setChatInput,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOpen]);

  const getFirstName = (name: string) => {
    return name.trim().split(" ")[0];
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 ${BUTTON_BG} text-gray-900 p-4 rounded-full z-50 shadow-2xl transition-all`}
        >
          <MessageCircle size={28} strokeWidth={2.5} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-y-0 right-0 w-full max-w-sm ${DARK_GREEN_BG} border-l border-green-900 z-50 flex flex-col shadow-2xl`}
          >
            <div className="p-5 bg-green-900/50 backdrop-blur-sm border-b border-green-900 flex justify-between items-center">
              <h2 className={`text-xl font-bold ${ACCENT_TEXT}`}>Class Chat</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%2334d399' stop-opacity='0.05'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grad)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            >
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.username === username;
                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                          isMe
                            ? `${MESSAGE_BG_ME} text-gray-900 rounded-tr-none`
                            : `${MESSAGE_BG_OTHER} text-gray-100 rounded-tl-none`
                        }`}
                      >
                        {!isMe && (
                          <p
                            className={`text-[10px] font-bold ${ACCENT_TEXT} mb-1 uppercase tracking-wider`}
                          >
                            {getFirstName(msg.username)}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed break-words">
                          {msg.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-green-950 border-t border-green-900">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendChatMessage()
                  }
                  placeholder="Type a message..."
                  className="flex-1 bg-green-900 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sendChatMessage}
                  className={`${BUTTON_BG} p-2.5 rounded-full text-gray-900 transition flex-shrink-0`}
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
