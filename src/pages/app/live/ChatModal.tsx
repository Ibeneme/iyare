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

export default function ChatModal({
  username,
  chatMessages,
  sendChatMessage,
  chatInput,
  setChatInput,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(chatMessages.length);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      prevCountRef.current = chatMessages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (chatMessages.length > prevCountRef.current) {
      const added = chatMessages.length - prevCountRef.current;
      const incoming = chatMessages
        .slice(-added)
        .filter((m) => m.username !== username);
      if (incoming.length > 0) {
        setUnreadCount((c) => c + incoming.length);
      }
    }
    prevCountRef.current = chatMessages.length;
  }, [chatMessages, isOpen, username]);

  const getFirstName = (name: string) => name.trim().split(" ")[0] || "User";

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendChatMessage();
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          aria-label="Open class chat"
          className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white text-neutral-900 border border-black/10 z-50 shadow-xl flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed z-50 right-2.5 left-2.5 sm:left-auto bottom-20 sm:bottom-6 sm:right-6 sm:w-96 h-[68dvh] max-h-[calc(100dvh-6.5rem)] sm:h-[34rem] sm:max-h-[calc(100dvh-4rem)] flex flex-col rounded-2xl sm:rounded-[1.75rem] bg-neutral-900/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-sm sm:text-base font-semibold">Class chat</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 sm:space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-xs sm:text-sm text-white/50 mt-8">
                  Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.username === username;
                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[82%] min-w-0 px-3.5 py-2 rounded-2xl ${
                          isMe
                            ? "bg-white text-neutral-900 rounded-br-md"
                            : "bg-white/10 text-white rounded-bl-md"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[11px] sm:text-xs font-semibold text-[#FFD000] mb-0.5 truncate">
                            {getFirstName(msg.username)}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed break-words">
                          {msg.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2.5 sm:p-3 border-t border-white/10 shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-3">
              <div className="flex gap-1.5 sm:gap-2 items-center bg-white/10 rounded-full pl-3.5 sm:pl-4 pr-1 py-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-base sm:text-sm py-1"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  aria-label="Send message"
                  className="h-9 w-9 sm:h-9 sm:w-9 grid place-items-center rounded-full bg-white text-neutral-900 hover:bg-neutral-200 transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
