import { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchClassesByUser } from "../../../Redux/Slices/class.slice";
import { useNavigate } from "react-router-dom";

// Updated to a high-contrast palette (No light greens)
// const SUBJECT_COLORS = [
//   "bg-slate-900 text-yellow-400 border-slate-700",
//   "bg-[#064e3b] text-yellow-400 border-emerald-800",
//   "bg-blue-900 text-blue-100 border-blue-800",
//   "bg-indigo-900 text-indigo-100 border-indigo-800",
//   "bg-slate-700 text-white border-slate-600",
//   "bg-amber-900 text-amber-100 border-amber-800",
// ];

interface ClassModel {
  _id: string;
  title: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  } | null;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  date: string;
  time: string;
  duration: number;
}

type ViewMode = "month" | "week" | "day";
type ClassStatus = "upcoming" | "ongoing" | "finished";

// const getSubjectColor = (subjectId: string | null) => {
//   if (!subjectId) return SUBJECT_COLORS[0];
//   const index =
//     Math.abs(subjectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
//     SUBJECT_COLORS.length;
//   return SUBJECT_COLORS[index];
// };

const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const getClassStatus = (cls: ClassModel): ClassStatus => {
  const now = new Date();
  const datePart = cls.date.split("T")[0];
  const classStart = new Date(`${datePart}T${cls.time}:00`);
  const endTime = new Date(classStart.getTime() + cls.duration * 60 * 1000);

  if (now < classStart) return "upcoming";
  if (now >= classStart && now <= endTime) return "ongoing";
  return "finished";
};

const getStatusConfig = (status: ClassStatus) => {
  switch (status) {
    case "upcoming":
      return {
        text: "Upcoming",
        color: "text-blue-600 bg-blue-50 border-blue-100",
      };
    case "ongoing":
      return {
        text: "Live Now",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200 animate-pulse",
      };
    case "finished":
      return {
        text: "Completed",
        color: "text-slate-400 bg-slate-50 border-slate-100",
      };
  }
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.getFullYear(), date.getMonth(), diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export default function ClassCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const router = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [classes, setClasses] = useState<ClassModel[]>([]);

  useEffect(() => {
    dispatch(fetchClassesByUser())
      .unwrap()
      .then((res: any[]) => {
        setClasses(res || []);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  const navigate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + amount);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + amount * 7);
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + amount);
      setSelectedDay(newDate);
    }
    setCurrentDate(newDate);
  };

  const classesByDate = useMemo(() => {
    return classes.reduce((acc, cls) => {
      const dateKey = cls.date.split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(cls);
      return acc;
    }, {} as Record<string, ClassModel[]>);
  }, [classes]);

  const renderMonthView = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(
        <div
          key={`empty-prev-${i}`}
          className="p-2 border border-slate-50 bg-slate-50/30"
        ></div>
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateKey = formatDate(dayDate);
      const dayClasses = classesByDate[dateKey] || [];
      const isToday = formatDate(new Date()) === dateKey;

      days.push(
        <motion.div
          key={dateKey}
          onClick={() => {
            setSelectedDay(dayDate);
            setViewMode("day");
          }}
          whileHover={{ scale: 1.01, zIndex: 10 }}
          className={`p-2 h-32 border border-slate-100 cursor-pointer transition relative flex flex-col justify-between ${
            isToday
              ? "bg-yellow-50 border-yellow-400 ring-1 ring-yellow-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          <div
            className={`text-sm font-black ${
              isToday ? "text-yellow-700" : "text-slate-900"
            }`}
          >
            {i}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            {dayClasses.slice(0, 2).map((cls) => (
              <div
                key={cls._id}
                className="flex items-center gap-1 bg-[#064e3b] px-1.5 py-0.5 rounded text-[10px] text-yellow-400 font-bold truncate"
              >
                {cls.subjectId?.code || "CLS"}
              </div>
            ))}
            {dayClasses.length > 2 && (
              <span className="text-[10px] font-black text-[#064e3b] uppercase">
                + {dayClasses.length - 2} more
              </span>
            )}
          </div>
        </motion.div>
      );
    }

    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <div
          key={`empty-next-${i}`}
          className="p-2 border border-slate-50 bg-slate-50/30"
        ></div>
      );
    }

    return (
      <div className="w-full bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200">
        <div className="grid grid-cols-7 text-center font-black text-[#064e3b] uppercase tracking-widest text-[10px] bg-slate-50 border-b border-slate-200">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-4 border-r border-slate-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  }, [currentDate, classesByDate]);

  const renderWeekView = useMemo(() => {
    const startDay = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      return day;
    });

    return (
      <div className="w-full bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div className="grid grid-cols-7 text-center bg-slate-50 border-b border-slate-200">
          {weekDays.map((day) => {
            const isToday = formatDate(new Date()) === formatDate(day);
            return (
              <div
                key={formatDate(day)}
                className={`py-6 border-r border-slate-200 last:border-r-0 ${
                  isToday ? "bg-yellow-400" : ""
                }`}
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-tighter ${
                    isToday ? "text-[#064e3b]" : "text-slate-400"
                  }`}
                >
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={`text-2xl font-black ${
                    isToday ? "text-[#064e3b]" : "text-slate-900"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day) => {
            const dayClasses = classesByDate[formatDate(day)] || [];
            return (
              <div
                key={formatDate(day)}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode("day");
                }}
                className="p-3 border-r border-slate-100 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="space-y-3">
                  {dayClasses.map((cls) => (
                    <div
                      key={cls._id}
                      className="p-3 rounded-2xl bg-[#064e3b] border-l-4 border-yellow-400 shadow-sm"
                    >
                      <div className="font-black text-[10px] text-yellow-400 uppercase truncate mb-1">
                        {cls.title}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-100 font-bold">
                        <Clock className="w-3 h-3" /> {cls.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [currentDate, classesByDate]);

  const renderDayView = useMemo(() => {
    const dayClasses = classesByDate[formatDate(selectedDay)] || [];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-[#064e3b] tracking-tighter flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-yellow-500" />
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <span className="bg-slate-100 px-4 py-2 rounded-full text-xs font-black uppercase text-slate-500">
              {dayClasses.length} Classes Scheduled
            </span>
          </div>

          {dayClasses.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <Clock3 className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold italic">
                No academic sessions found for this date.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dayClasses
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((cls, index) => {
                  const status = getClassStatus(cls);
                  const { text: statusText, color: statusColor } =
                    getStatusConfig(status);

                  return (
                    <motion.div
                      key={cls._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-6 bg-white rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between hover:border-yellow-400 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="bg-[#064e3b] text-yellow-400 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px] shadow-lg">
                          <Clock className="w-4 h-4 mb-1" />
                          <span className="font-black text-lg">{cls.time}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${statusColor}`}
                            >
                              {statusText}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              {cls.subjectId?.code}
                            </span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 group-hover:text-[#064e3b] transition-colors">
                            {capitalizeFirst(cls.title)}
                          </h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <User className="w-3.5 h-3.5" />
                              {cls.teacherId
                                ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`
                                : "TBA"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <BookOpen className="w-3.5 h-3.5" />
                              {cls.subjectId?.name || "General"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                        <button
                          onClick={() => {
                            const classId = cls._id;
                            const classTitle = encodeURIComponent(cls.title);
                            const subject = encodeURIComponent(
                              cls?.subjectId?.name || "N/A"
                            );
                            router(
                              `/webrtc/${classId}/${classTitle}/${subject}`
                            );
                          }}
                          disabled={status === "finished"}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                            status === "finished"
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-[#064e3b] text-yellow-400 hover:bg-slate-900 shadow-xl shadow-emerald-900/20"
                          }`}
                        >
                          <Video size={16} />{" "}
                          {status === "ongoing" ? "Join Now" : "Class Link"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedDay, classesByDate, router]);

  const headerText = useMemo(() => {
    switch (viewMode) {
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "week":
        const start = startOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      case "day":
        return selectedDay.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
      default:
        return "Timetable";
    }
  }, [currentDate, viewMode, selectedDay]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]"
          >
            <Loader2 className="w-12 h-12 animate-spin text-[#064e3b] mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#064e3b]">
              Syncing Calendar...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#fcfdfc] p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 mt-10">
            <div className="space-y-4">
              <div className="bg-yellow-400 p-3 rounded-2xl inline-flex items-center justify-center shadow-xl shadow-yellow-400/20">
                <CalendarIcon className="w-6 h-6 text-[#064e3b]" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[#064e3b] tracking-tighter">
                Academic Timetable
              </h1>
              <p className="text-slate-500 font-bold text-lg italic max-w-xl">
                Track your lectures, manage your study windows, and access live
                classrooms.
              </p>
            </div>

            <div className="flex gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
              {(["month", "week", "day"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewMode(view)}
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === view
                      ? "bg-[#064e3b] text-yellow-400 shadow-lg"
                      : "text-slate-400 hover:text-[#064e3b]"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-8 bg-white px-8 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 rounded-2xl bg-slate-50 text-[#064e3b] hover:bg-yellow-400 transition-all group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <h2 className="text-xl font-black text-slate-900 tracking-tight min-w-[200px] text-center">
                {headerText}
              </h2>
              <button
                onClick={() => navigate(1)}
                className="p-3 rounded-2xl bg-slate-50 text-[#064e3b] hover:bg-yellow-400 transition-all group"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDay(new Date());
              }}
              className="hidden md:block text-[10px] font-black uppercase tracking-widest text-[#064e3b] hover:underline"
            >
              Go To Today
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + headerText}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              {viewMode === "month" && renderMonthView}
              {viewMode === "week" && renderWeekView}
              {viewMode === "day" && renderDayView}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
