import { getCookie } from "../../../utils/cookies";
import Select from "../../../components/ui/Select";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  X,
  Check,
  CheckCheck,
  Clock,
  ChevronRight,
  Info,
  BookOpen,
  Calendar,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../../store/index";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationModel,
} from "../../../store/features/notifications/notifications.slice";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";

export default function NotificationsManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector(
    (state: RootState) => state.notifications,
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
        toast.error(String(msg));
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
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(String(err || "Failed to update notifications"));
    }
  };

  const goToSubject = (subjectId: string, subjectName?: string) => {
    navigate(`/app/subjects/${subjectId}`, {
      state: { subjectName: subjectName || undefined },
    });
  };

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
    if (search && selectedType) {
      return "No notifications match your search and category filter.";
    }
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

  const DetailContent = ({
    notification,
  }: {
    notification: NotificationModel;
  }) => {
    const hasSubject =
      notification.meta?.subjectId && notification.meta?.subjectName;
    const isClassSchedule = notification.type === "class_schedule";
    const typeLabel = notification.type
      ? notification.type.replace(/_/g, " ")
      : "broadcast";

    return (
      <div className="flex flex-col h-full justify-between space-y-5">
        <div className="space-y-5">
          <div className="pb-4 border-b border-[var(--color-card-border)] flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <span className="text-[11px] uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] font-medium inline-block">
                {typeLabel}
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-primary)] leading-snug">
                {notification.title}
              </h2>
            </div>
            <StatusPill status={notification.isRead ? "read" : "unread"} />
          </div>

          <div>
            <span className="form-label block mb-1.5">Message</span>
            <div className="p-4 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] text-sm text-[var(--color-primary)] leading-relaxed whitespace-pre-wrap break-words">
              {notification.description ||
                "No description provided for this notification."}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] flex items-center gap-3">
              <Avatar name={typeLabel} size={28} />
              <div className="min-w-0">
                <span className="form-label block">Category</span>
                <span className="font-medium text-sm text-[var(--color-primary)] capitalize truncate block">
                  {typeLabel}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] flex items-center gap-3">
              <Clock size={16} className="text-[var(--color-muted)] shrink-0" />
              <div className="min-w-0">
                <span className="form-label block">Received</span>
                <span className="font-medium text-sm text-[var(--color-primary)] truncate block">
                  {new Date(notification.createdAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          {(hasSubject || isClassSchedule) && (
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {hasSubject && (
                <button
                  type="button"
                  onClick={() =>
                    goToSubject(
                      notification.meta!.subjectId,
                      notification.meta!.subjectName,
                    )
                  }
                  className="btn btn-primary flex-1 justify-center inline-flex items-center gap-2"
                >
                  <BookOpen size={15} />
                  <span>View {notification.meta!.subjectName}</span>
                </button>
              )}

              {isClassSchedule && notification.meta?.subjectId && (
                <button
                  type="button"
                  onClick={() => goToClass(notification.meta?.subjectId)}
                  className="btn btn-secondary flex-1 justify-center inline-flex items-center gap-2"
                >
                  <Calendar size={15} />
                  <span>View class</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--color-card-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Info size={13} /> Notification record
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium">
            <Check size={14} /> Delivered
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        highlight="Notifications"
        subtitle="Updates, alerts, and messages from your classes and teachers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {getCookie("userType") === "parent" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/app/notifications/preferences")}
              >
                Alert settings
              </button>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-primary inline-flex items-center gap-1.5"
              >
                <CheckCheck size={15} />
                <span>Mark all read ({unreadCount})</span>
              </button>
            )}
          </div>
        }
      />

      <Panel
        title={
          loading && notifications.length === 0
            ? "Messages"
            : `Messages (${filteredNotifications.length}${
                search || selectedType ? ` of ${notifications.length}` : ""
              })`
        }
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search notifications…"
                aria-label="Search notifications"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input w-full !min-h-0 !py-1.5 text-sm"
              >
                <option value="">All types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>

            {(search || selectedType) && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs"
              >
                Reset
              </button>
            )}
          </div>
        }
      >
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading notifications…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left List */}
            <div className="lg:col-span-5 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] max-h-[640px] overflow-y-auto divide-y divide-[var(--color-card-border)]">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4">
                  <EmptyState
                    title="No notifications"
                    text={getEmptyMessage()}
                  />
                </div>
              ) : (
                filteredNotifications.map((notification: any) => {
                  const isSelected =
                    selectedNotification?._id === notification._id;
                  const typeLabel = notification.type
                    ? notification.type.replace(/_/g, " ")
                    : "broadcast";

                  return (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() => handleSelectNotification(notification)}
                      className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 group ${
                        isSelected
                          ? "bg-[var(--row-bg)]"
                          : "hover:bg-[var(--row-bg)]/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)] font-medium truncate">
                            {typeLabel}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!notification.isRead && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[var(--color-brand-fg)]">
                                New
                              </span>
                            )}
                            <span className="text-xs text-[var(--color-muted)]">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <h4
                          className={`text-sm truncate ${
                            !notification.isRead || isSelected
                              ? "font-semibold text-[var(--color-primary)]"
                              : "font-medium text-[var(--color-primary)]"
                          }`}
                        >
                          {notification.title}
                        </h4>

                        <p className="text-xs text-[var(--color-muted)] line-clamp-2">
                          {notification.description ||
                            "No preview description."}
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] shrink-0 mt-1"
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Detail Pane (Desktop) */}
            <div className="hidden lg:block lg:col-span-7 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 sticky top-6 min-h-[460px]">
              {selectedNotification ? (
                <DetailContent notification={selectedNotification} />
              ) : (
                <div className="py-16">
                  <EmptyState
                    title="Select a notification"
                    text="Choose a message on the left to read its full details and actions."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Mobile Detail Modal */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedNotification && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseMobileDetail}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
                <h3 className="text-base font-semibold text-[var(--color-primary)] truncate">
                  Notification details
                </h3>
                <button
                  type="button"
                  onClick={handleCloseMobileDetail}
                  aria-label="Close notification details"
                  className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-4">
                <DetailContent notification={selectedNotification} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
