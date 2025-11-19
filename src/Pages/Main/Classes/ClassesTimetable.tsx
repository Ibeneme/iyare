import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchClassesByUser } from "../../../Redux/Slices/class.slice";

const SUBJECT_COLORS = [
  "bg-green-100 text-green-700 border-green-300",
  "bg-lime-100 text-lime-700 border-lime-300",
  "bg-emerald-100 text-emerald-700 border-emerald-300",
  "bg-teal-100 text-teal-700 border-teal-300",
  "bg-cyan-100 text-cyan-700 border-cyan-300",
  "bg-blue-100 text-blue-700 border-blue-300",
];

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

const getSubjectColor = (subjectId: string | null) => {
  if (!subjectId) return SUBJECT_COLORS[0];
  const index =
    Math.abs(subjectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
    SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
};

const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const getClassStatus = (cls: ClassModel): ClassStatus => {
  const now = new Date(); // This is correct, uses local time

  // Ensure cls.date is a date string like '2025-11-17'
  const datePart = cls.date.split("T")[0];

  // This comparison creates two dates based on the provided datePart and time,
  // which will interpret them in the user's local timezone.
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
        color: "text-green-700 bg-green-100 border-green-200",
      };
    case "ongoing":
      return {
        text: "Ongoing",
        color: "text-emerald-700 bg-emerald-100 border-emerald-200",
      };
    case "finished":
      return {
        text: "Finished",
        color: "text-gray-700 bg-gray-100 border-gray-200",
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
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  // Fix: Use local methods for calculation to maintain the day correctly
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Sets Monday as the start (1)
  const start = new Date(date.getFullYear(), date.getMonth(), diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

// --- END REDUX PLACEHOLDER IMPLEMENTATIONS ---

export default function ClassCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // START: Re-added Redux data fetching structure
  const dispatch = useDispatch<AppDispatch>();
  const [classes, setClasses] = useState<ClassModel[]>([]);

  useEffect(() => {
    dispatch(fetchClassesByUser())
      .unwrap()

      .then((res: any[]) => {
        setClasses(res || []);

        console.log(res, "res.datres.dat");
      })

      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  // END: Re-added Redux data fetching structure

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
    let date = 1;

    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(
        <div
          key={`empty-prev-${i}`}
          className="p-2 border border-gray-100 bg-gray-50/50"
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
          whileHover={{ scale: 1.02 }}
          className={`p-2 h-32 border border-gray-100 cursor-pointer transition relative flex flex-col justify-between ${
            isToday
              ? "bg-green-100 border-green-400"
              : "bg-white hover:bg-gray-50"
          } ${dayClasses.length > 0 ? "bg-green-50 border-green-200" : ""}`}
        >
          <div
            className={`text-lg font-bold ${
              isToday ? "text-green-800" : "text-gray-800"
            }`}
          >
            {i}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            {dayClasses.slice(0, 3).map((cls) => (
              <div key={cls._id} className="flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 text-green-500 fill-green-500" />
                <span className="text-xs font-medium truncate text-gray-700">
                  {cls.subjectId?.code || cls.title}
                </span>
              </div>
            ))}
            {dayClasses.length > 3 && (
              <span className="text-xs text-gray-500 mt-1">
                + {dayClasses.length - 3} more
              </span>
            )}
          </div>
        </motion.div>
      );
      date++;
    }

    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <div
          key={`empty-next-${i}`}
          className="p-2 border border-gray-100 bg-gray-50/50"
        ></div>
      );
    }

    return (
      <div className="grid grid-cols-7 w-full border-t border-l border-gray-100">
        <div className="col-span-7 grid grid-cols-7 text-center font-semibold text-gray-500 text-sm bg-gray-100 rounded-t-lg border-b border-gray-200">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-2 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="col-span-7 grid grid-cols-7 border-b border-r border-gray-100">
          {days}
        </div>
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
      <div className="w-full">
        <div className="grid grid-cols-7 text-center font-semibold text-gray-600 bg-gray-100 rounded-t-lg border border-gray-200">
          {weekDays.map((day) => {
            const dayKey = formatDate(day);
            const isToday = formatDate(new Date()) === dayKey;
            return (
              <div
                key={dayKey}
                className={`py-3 border-r border-gray-200 last:border-r-0 ${
                  isToday ? "text-green-700 bg-green-100/50 font-bold" : ""
                }`}
              >
                <span className="hidden sm:inline">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="sm:hidden">
                  {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
                <div
                  className={`text-xl ${
                    isToday ? "text-green-800" : "text-gray-900"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 border-t border-l border-r border-gray-200 bg-white min-h-[400px]">
          {weekDays.map((day) => {
            const dateKey = formatDate(day);
            const dayClasses = classesByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode("day");
                }}
                className="p-3 border-r border-b border-gray-100 hover:bg-green-50 transition cursor-pointer"
              >
                <div className="space-y-3">
                  {dayClasses.map((cls) => {
                    const subjectColor = getSubjectColor(
                      cls.subjectId?._id ?? null
                    );

                    return (
                      <div
                        key={cls._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("--- Class Selected (Week View) ---");
                          console.log("Class Details:", cls);
                          console.log("Current Status:", getClassStatus(cls));
                          console.log("-----------------------------------");
                        }}
                        className={`p-2 rounded-lg text-xs font-medium border ${
                          subjectColor.split(" ")[0]
                        } ${subjectColor
                          .split(" ")[2]
                          .replace("text-", "border-")}`}
                      >
                        <div className="font-bold truncate text-gray-800">
                          {capitalizeFirst(cls.title)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {cls.time} ({cls.duration} min)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {dayClasses.length === 0 && (
                    <p className="text-sm text-gray-400">No classes</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [currentDate, classesByDate]);

  const renderDayView = useMemo(() => {
    const dateKey = formatDate(selectedDay);
    const dayClasses = classesByDate[dateKey] || [];

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-green-600" />
          Schedule for{" "}
          {selectedDay.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>

        {dayClasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock3 className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">No classes scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayClasses
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((cls, index) => {
                const status = getClassStatus(cls);
                const { text: statusText, color: statusColor } =
                  getStatusConfig(status);
                const subjectColor = getSubjectColor(
                  cls.subjectId?._id ?? null
                );

                return (
                  <motion.div
                    key={cls._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      console.log("--- Class Selected (Day View) ---");
                      console.log("Class Details:", cls);
                      console.log("Current Status:", getClassStatus(cls));
                      console.log("-----------------------------------");
                    }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-green-100 transition duration-150 cursor-pointer"
                  >
                    <div className="mb-2 md:mb-0 md:w-1/3">
                      <div className="flex items-center gap-2 text-xl font-extrabold text-gray-800">
                        <Clock className="w-5 h-5 text-green-500" />
                        {cls.time}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mt-1">
                        {capitalizeFirst(cls.title)}
                      </h4>
                    </div>

                    <div className="text-sm space-y-1 md:w-1/3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {cls.subjectId?.name ?? "No Subject"}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${subjectColor}`}
                        >
                          {cls.subjectId?.code ?? "N/A"}
                        </span>
                      </div>
                      {cls.teacherId && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>
                            {cls.teacherId.firstName} {cls.teacherId.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start md:items-end md:w-1/5 mt-3 md:mt-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}
                      >
                        <Circle className="w-2 h-2 fill-current" />
                        {statusText}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {cls.duration} minutes
                      </p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    );
  }, [selectedDay, classesByDate]);

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
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      default:
        return "Calendar View";
    }
  }, [currentDate, viewMode, selectedDay]);

  const handleViewChange = useCallback(
    (newView: ViewMode) => {
      if (newView === "day" && viewMode !== "day") {
        setSelectedDay(
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
          )
        );
      }
      setViewMode(newView);
    },
    [viewMode, currentDate]
  );

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%]  py-48 bg-gray-50 flex flex-col items-center justify-center gap-6 z-50 p-4"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-green-600" />
              <p className="text-lg font-medium text-green-700">
                Loading timetable data...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 mt-12">
              <div className="bg-yellow-200 rounded-full p-4 mb-4 inline-flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-yellow-900" />
              </div>

              <h1 className="text-3xl font-black text-black">
                Class Timetable Calendar
              </h1>
              <p className="text-gray-600 mt-1">
                Interactive calendar view for your scheduled classes.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-4 md:mb-0">
                {(["month", "week", "day"] as const).map((view) => {
                  const isActive = viewMode === view;
                  const label = capitalizeFirst(view);
                  return (
                    <button
                      key={view}
                      onClick={() => handleViewChange(view)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-green-700 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <h2 className="text-[16px] font-semibold text-gray-800 w-48 text-center truncate">
                  {headerText}
                </h2>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(1)}
                  className="p-2 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode + headerText}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === "month" && renderMonthView}
                {viewMode === "week" && renderWeekView}
                {viewMode === "day" && renderDayView}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
