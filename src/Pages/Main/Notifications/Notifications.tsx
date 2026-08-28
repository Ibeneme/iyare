import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  X,
  Check,
  Bell,
  CheckCheck,
  Clock,
  ChevronRight,
  Info,
  BookOpen,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { AppDispatch, RootState } from "../../../Redux/store";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationModel,
} from "../../../Redux/Slices/notifications.slice";

export default function NotificationsManager() {
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate(); // ← added
  const { notifications, unreadCount, loading } = useSelector(
    (state: RootState) => state.notifications
  );

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationModel | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  /* ---------- Load Notifications ---------- */
  const loadNotifications = useCallback(() => {
    dispatch(fetchNotifications())
      .unwrap()
      .catch((err) => {
        const msg = err || "Failed to load notifications";
        toast.error(msg);
      });
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* ---------- Handlers ---------- */
  const handleSelectNotification = (notification: NotificationModel) => {
    setSelectedNotification(notification);
    setIsMobileDetailOpen(true);
    if (!notification.isRead) {
      dispatch(markNotificationAsRead(notification._id))
        .unwrap()
        .catch(() => {});
    }
  };

  const handleCloseMobileDetail = () => {
    setIsMobileDetailOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success("All notifications marked as read!");
    } catch (err: any) {
      toast.error(err || "Failed to update notifications");
    }
  };

  // Navigate to subject (passes subjectName in location.state)
  const goToSubject = (subjectId: string, subjectName?: string) => {
    navigate(`/subjects/${subjectId}`, {
      state: { subjectName: subjectName || undefined },
    });
  };

  // Navigate to class (for class_schedule notifications)
  const goToClass = (classId: string) => {
    navigate(`/classes/${classId}`);
  };

  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (selectedType) {
      result = result.filter((n: any) => n.type === selectedType);
    }
    const term = search?.trim()?.toLowerCase();
    if (term) {
      result = result.filter((n: any) => {
        const title = n.title?.toLowerCase() ?? "";
        const description = n.description?.toLowerCase() ?? "";
        const typeStr = n.type?.toLowerCase() ?? "";
        return (
          title.includes(term) ||
          description.includes(term) ||
          typeStr.includes(term)
        );
      });
    }
    return result;
  }, [notifications, selectedType, search]);

  // Auto-select first notification only on desktop (lg+)
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (
      isDesktop &&
      filteredNotifications.length > 0 &&
      !selectedNotification
    ) {
      setSelectedNotification(filteredNotifications[0]);
    }
  }, [filteredNotifications, selectedNotification]);

  // Close mobile overlay when resizing to desktop
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMobileDetailOpen(false);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setSelectedType("");
  };

  const getEmptyMessage = () => {
    if (search && selectedType)
      return "No notifications found matching your search and type filter.";
    if (search) return "No notifications match your search.";
    if (selectedType) return "No notifications found for this category.";
    return "Your inbox is completely clear.";
  };

  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>();
    notifications.forEach((n: any) => {
      if (n.type) typesSet.add(n.type);
    });
    return Array.from(typesSet);
  }, [notifications]);

  /* ---------- Shared Detail Content ---------- */
  const DetailContent = ({
    notification,
  }: {
    notification: NotificationModel;
  }) => {
    const hasSubject =
      notification.meta?.subjectId && notification.meta?.subjectName;
    const isClassSchedule = notification.type === "class_schedule";

    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#66666612]">
          <div className="pr-4">
            <span className="px-3 py-1 bg-yellow-400 text-emerald-950 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-sm">
              {notification.type
                ? notification.type.toUpperCase()
                : "BROADCAST"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tighter leading-tight">
              {notification.title}
            </h2>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-2">
              Full Message Details
            </p>
            <p className="text-emerald-900/80 font-medium leading-relaxed italic text-base bg-[#66666604] p-5 md:p-6 rounded-3xl border border-[#66666608]">
              {notification.description ||
                "No description provided for this notification."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#66666612]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-400/20 rounded-2xl text-emerald-950">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-[#666] uppercase tracking-widest">
                  Timestamp
                </p>
                <p className="text-xs font-black text-emerald-950">
                  {new Date(notification.createdAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-900/10 rounded-2xl text-emerald-900">
                <Info size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-[#666] uppercase tracking-widest">
                  Status
                </p>
                <p className="text-xs font-black text-emerald-600 uppercase">
                  {notification.isRead ? "Read & Logged" : "Unread"}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons for Subject / Class */}
          {(hasSubject || isClassSchedule) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {hasSubject && (
                <button
                  onClick={() =>
                    goToSubject(
                      notification.meta!.subjectId,
                      notification.meta!.subjectName
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-900 text-yellow-400 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10"
                >
                  <BookOpen size={16} />
                  View Subject: {notification.meta!.subjectName}
                </button>
              )}

              {isClassSchedule && notification.meta?.subjectId && (
                <button
                  onClick={() => goToClass(notification.meta?.subjectId)}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-emerald-950 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20"
                >
                  <Calendar size={16} />
                  View Class
                </button>
              )}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[#66666612] flex justify-end mt-auto">
          <span className="text-[10px] font-black uppercase text-[#666] tracking-widest flex items-center gap-1.5">
            <Check size={14} className="text-emerald-600" /> Secure System
            Stream
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading && notifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[100]"
        >
          <Loader2 className="w-16 h-16 animate-spin text-emerald-900 mb-4" />
          <p className="text-emerald-900 font-black uppercase tracking-[0.3em] text-xs">
            Accessing Notification Stream...
          </p>
        </motion.div>
      )}

      <div className="min-h-screen bg-[#f8faf7] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="space-y-3">
              <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-yellow-400/20">
                <Bell className="w-6 h-6 text-emerald-950" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter">
                Notifications Center
              </h1>
              <p className="text-emerald-800/60 font-medium text-base max-w-xl italic">
                Manage your system updates, alerts, and operational messages in
                real-time.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="bg-emerald-900 text-yellow-400 px-6 py-3.5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/10 group"
              >
                <CheckCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-white p-4 rounded-[2.5rem] shadow-sm border border-[#66666612]">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search notifications by title, details, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3.5 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold transition-all placeholder:text-[#666]"
              />
            </div>
            <div className="relative flex-1 lg:max-w-xs">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-12 pr-10 py-3.5 w-full bg-[#66666608] border-2 border-transparent rounded-3xl focus:border-yellow-400 focus:bg-white focus:outline-none text-sm font-bold appearance-none transition-all text-emerald-950"
              >
                <option value="">All Notification Types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            {(search || selectedType) && (
              <button
                onClick={resetFilters}
                className="px-6 py-3.5 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-3xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Master-Detail Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Notification List */}
            <div className="lg:col-span-5 bg-white rounded-[2.5rem] border border-[#66666612] p-4 shadow-sm max-h-[700px] overflow-y-auto space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification: any) => {
                  const isSelected =
                    selectedNotification?._id === notification._id;
                  return (
                    <motion.div
                      key={notification._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleSelectNotification(notification)}
                      className={`p-5 rounded-3xl cursor-pointer transition-all border relative overflow-hidden group ${
                        isSelected
                          ? "bg-emerald-950 text-white border-emerald-950 shadow-xl shadow-emerald-950/10"
                          : notification.isRead
                          ? "bg-[#66666604] border-transparent hover:bg-[#66666608]"
                          : "bg-emerald-50/40 border-emerald-900/20 hover:bg-emerald-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                            isSelected ? "text-yellow-400" : "text-[#666]"
                          }`}
                        >
                          {notification.type
                            ? notification.type.toUpperCase()
                            : "BROADCAST"}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        )}
                      </div>
                      <h4
                        className={`text-base font-black leading-snug mb-2 line-clamp-1 ${
                          isSelected ? "text-white" : "text-emerald-950"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <p
                        className={`text-xs font-medium line-clamp-2 italic mb-3 ${
                          isSelected
                            ? "text-emerald-100/70"
                            : "text-emerald-800/60"
                        }`}
                      >
                        {notification.description ||
                          "No preview description..."}
                      </p>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span
                          className={
                            isSelected ? "text-emerald-200/50" : "text-[#666]"
                          }
                        >
                          {new Date(notification.createdAt).toLocaleDateString(
                            "en-NG",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <ChevronRight
                          size={14}
                          className={
                            isSelected ? "text-yellow-400" : "text-[#666]"
                          }
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {!filteredNotifications.length && !loading && (
                <div className="py-20 text-center px-4">
                  <Bell className="w-12 h-12 text-[#666] mx-auto mb-4 opacity-40" />
                  <p className="text-sm font-bold text-emerald-950 mb-1">
                    No Notifications Found
                  </p>
                  <p className="text-xs text-[#666] italic">
                    {getEmptyMessage()}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Detailed View Pane (Desktop only) */}
            <div className="hidden lg:flex lg:col-span-7 bg-white rounded-[2.5rem] border border-[#66666612] p-8 md:p-10 shadow-sm sticky top-6 min-h-[550px] flex-col justify-between">
              {selectedNotification ? (
                <DetailContent notification={selectedNotification} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
                  <div className="w-16 h-16 bg-[#66666608] rounded-full flex items-center justify-center text-[#666] mb-4">
                    <Bell size={28} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-950 mb-2">
                    Select a Notification
                  </h3>
                  <p className="text-xs text-[#666] font-medium max-w-xs italic">
                    Choose any message from the list on the left to read its
                    complete contents and metadata.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Detail Overlay */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseMobileDetail}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 max-h-[92vh] bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="w-12 h-1.5 bg-[#66666630] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <button
                  onClick={handleCloseMobileDetail}
                  className="ml-auto p-2.5 rounded-full bg-[#66666610] hover:bg-[#66666620] transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-emerald-950" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 pb-8 pt-2 flex-1">
                <DetailContent notification={selectedNotification} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
