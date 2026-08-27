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
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchClassesByUser } from "../../../Redux/Slices/class.slice";
import { useNavigate } from "react-router-dom";

/* ---------- Schedule types (mirrors backend Class model) ---------- */

type Frequency = "daily" | "weekly" | "monthly" | "none";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayOfWeekEntry {
  day: number;
  timeSlots: TimeSlot[];
}

interface DayOfMonthEntry {
  day: number;
  timeSlots: TimeSlot[];
}

interface SpecificDateEntry {
  date: string;
  timeSlots: TimeSlot[];
}

interface ScheduleItem {
  frequency: Frequency;
  timeSlots?: TimeSlot[];
  daysOfWeek?: DayOfWeekEntry[] | number[];
  daysOfMonth?: DayOfMonthEntry[] | number[];
  specificDates?: SpecificDateEntry[] | string[];
  startDate?: string;
  endDate?: string;
}

interface ClassModel {
  _id: string;
  title: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
    /** Optional grade / grade level if API populates it */
    gradeLevel?: { _id?: string; title?: string } | string | null;
    grade?: { _id?: string; title?: string } | string | null;
  } | null;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  date?: string;
  time?: string;
  duration?: number;
  schedules?: ScheduleItem[];
  status?: string;
  studentCount?: number;
}

interface ClassOccurrence {
  classId: string;
  title: string;
  subjectId: ClassModel["subjectId"];
  teacherId: ClassModel["teacherId"];
  date: string;
  startTime: string;
  endTime: string;
  status: ClassStatus;
}

type ViewMode = "month" | "week" | "day";
type ClassStatus = "upcoming" | "ongoing" | "finished";

const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (isoOrYmd: string): Date => {
  const ymd = isoOrYmd.split("T")[0];
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.getFullYear(), date.getMonth(), diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const minutesBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

/** Resolve a grade label from subject if present */
const getGradeLabel = (subjectId: ClassModel["subjectId"]): string | null => {
  if (!subjectId) return null;
  const g = subjectId.gradeLevel ?? subjectId.grade;
  if (!g) return null;
  if (typeof g === "string") return g;
  if (typeof g === "object" && g.title) return g.title;
  return null;
};

const normalizeTimeSlots = (slots: any): TimeSlot[] => {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  return slots
    .filter((t) => t && t.startTime && t.endTime)
    .map((t) => ({
      startTime: String(t.startTime).slice(0, 5),
      endTime: String(t.endTime).slice(0, 5),
    }));
};

const expandClassToOccurrences = (
  cls: ClassModel,
  rangeStart: Date,
  rangeEnd: Date
): ClassOccurrence[] => {
  const occurrences: ClassOccurrence[] = [];
  const rangeStartKey = formatDate(rangeStart);
  const rangeEndKey = formatDate(rangeEnd);

  const push = (dateKey: string, slot: TimeSlot) => {
    if (dateKey < rangeStartKey || dateKey > rangeEndKey) return;
    occurrences.push({
      classId: cls._id,
      title: cls.title,
      subjectId: cls.subjectId,
      teacherId: cls.teacherId,
      date: dateKey,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: computeOccurrenceStatus(dateKey, slot.startTime, slot.endTime),
    });
  };

  if (Array.isArray(cls.schedules) && cls.schedules.length > 0) {
    for (const raw of cls.schedules) {
      const frequency: Frequency = (raw.frequency as Frequency) || "none";
      const ruleStart = raw.startDate
        ? parseDateOnly(String(raw.startDate))
        : null;
      const ruleEnd = raw.endDate ? parseDateOnly(String(raw.endDate)) : null;

      let windowStart = new Date(rangeStart);
      let windowEnd = new Date(rangeEnd);
      if (ruleStart && ruleStart > windowStart) windowStart = ruleStart;
      if (ruleEnd && ruleEnd < windowEnd) windowEnd = ruleEnd;
      if (windowStart > windowEnd) continue;

      if (frequency === "daily") {
        const slots = normalizeTimeSlots(raw.timeSlots);
        if (slots.length === 0) continue;
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const key = formatDate(cursor);
          for (const slot of slots) push(key, slot);
          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (frequency === "weekly") {
        const daysRaw = raw.daysOfWeek || [];
        type WeekEntry = { day: number; timeSlots: TimeSlot[] };
        let entries: WeekEntry[] = [];

        if (daysRaw.length > 0 && typeof (daysRaw as any[])[0] === "object") {
          entries = (daysRaw as DayOfWeekEntry[]).map((d) => ({
            day: d.day,
            timeSlots: normalizeTimeSlots(d.timeSlots),
          }));
        } else {
          const shared = normalizeTimeSlots(raw.timeSlots);
          entries = (daysRaw as number[]).map((day) => ({
            day,
            timeSlots: shared,
          }));
        }

        if (entries.length === 0) continue;

        const byDay = new Map(entries.map((e) => [e.day, e.timeSlots]));
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const dow = cursor.getDay();
          const slots = byDay.get(dow);
          if (slots && slots.length > 0) {
            const key = formatDate(cursor);
            for (const slot of slots) push(key, slot);
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (frequency === "monthly") {
        const daysRaw = raw.daysOfMonth || [];
        type MonthEntry = { day: number; timeSlots: TimeSlot[] };
        let entries: MonthEntry[] = [];

        if (daysRaw.length > 0 && typeof (daysRaw as any[])[0] === "object") {
          entries = (daysRaw as DayOfMonthEntry[]).map((d) => ({
            day: d.day,
            timeSlots: normalizeTimeSlots(d.timeSlots),
          }));
        } else {
          const shared = normalizeTimeSlots(raw.timeSlots);
          entries = (daysRaw as number[]).map((day) => ({
            day,
            timeSlots: shared,
          }));
        }

        if (entries.length === 0) continue;

        const byDay = new Map(entries.map((e) => [e.day, e.timeSlots]));
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const dom = cursor.getDate();
          const slots = byDay.get(dom);
          if (slots && slots.length > 0) {
            const key = formatDate(cursor);
            for (const slot of slots) push(key, slot);
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (frequency === "none") {
        const datesRaw = raw.specificDates || [];
        if (datesRaw.length === 0) continue;

        if (typeof (datesRaw as any[])[0] === "object") {
          for (const entry of datesRaw as SpecificDateEntry[]) {
            if (!entry.date) continue;
            const key = String(entry.date).split("T")[0];
            const slots = normalizeTimeSlots(entry.timeSlots);
            for (const slot of slots) push(key, slot);
          }
        } else {
          const shared = normalizeTimeSlots(raw.timeSlots);
          for (const d of datesRaw as string[]) {
            if (!d) continue;
            const key = String(d).split("T")[0];
            for (const slot of shared) push(key, slot);
          }
        }
      }
    }
  } else if (cls.date && cls.time) {
    const dateKey = cls.date.split("T")[0];
    const startTime = cls.time.slice(0, 5);
    const duration = cls.duration && cls.duration > 0 ? cls.duration : 60;
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + duration;
    const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
    const endM = String(endMinutes % 60).padStart(2, "0");
    push(dateKey, { startTime, endTime: `${endH}:${endM}` });
  }

  return occurrences;
};

const computeOccurrenceStatus = (
  dateKey: string,
  startTime: string,
  endTime: string
): ClassStatus => {
  const now = new Date();
  const start = new Date(`${dateKey}T${startTime}:00`);
  const end = new Date(`${dateKey}T${endTime}:00`);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
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

const getViewRange = (
  viewMode: ViewMode,
  currentDate: Date,
  selectedDay: Date
): { start: Date; end: Date } => {
  if (viewMode === "day") {
    const d = new Date(selectedDay);
    d.setHours(0, 0, 0, 0);
    return { start: d, end: d };
  }
  if (viewMode === "week") {
    const start = startOfWeek(currentDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDow = first.getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const start = new Date(year, month, 1 - startOffset);
  const end = new Date(
    year,
    month,
    last.getDate() + (42 - (startOffset + last.getDate()))
  );
  return { start, end };
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

  const occurrences = useMemo(() => {
    const { start, end } = getViewRange(viewMode, currentDate, selectedDay);
    const all: ClassOccurrence[] = [];
    for (const cls of classes) {
      all.push(...expandClassToOccurrences(cls, start, end));
    }
    all.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    return all;
  }, [classes, viewMode, currentDate, selectedDay]);

  const occurrencesByDate = useMemo(() => {
    return occurrences.reduce((acc, occ) => {
      if (!acc[occ.date]) acc[occ.date] = [];
      acc[occ.date].push(occ);
      return acc;
    }, {} as Record<string, ClassOccurrence[]>);
  }, [occurrences]);

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
      const dayOccs = occurrencesByDate[dateKey] || [];
      const isToday = formatDate(new Date()) === dateKey;

      days.push(
        <motion.div
          key={dateKey}
          onClick={() => {
            setSelectedDay(dayDate);
            setViewMode("day");
          }}
          whileHover={{ scale: 1.01, zIndex: 10 }}
          className={`p-2 h-36 border border-slate-100 cursor-pointer transition relative flex flex-col ${
            isToday
              ? "bg-yellow-50 border-yellow-400 ring-1 ring-yellow-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          <div
            className={`text-sm font-black mb-1 ${
              isToday ? "text-yellow-700" : "text-slate-900"
            }`}
          >
            {i}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden flex-1">
            {dayOccs.slice(0, 2).map((occ) => {
              const grade = getGradeLabel(occ.subjectId);
              const subjectName = occ.subjectId?.name;
              return (
                <div
                  key={`${occ.classId}-${occ.startTime}`}
                  className="bg-[#064e3b] px-1.5 py-1 rounded text-[9px] text-yellow-400 font-bold leading-tight"
                  title={[
                    occ.title,
                    subjectName,
                    grade,
                    `${occ.startTime}–${occ.endTime}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <div className="truncate font-black text-[10px]">
                    {occ.title}
                  </div>
                  <div className="flex items-center gap-1 opacity-90 truncate">
                    <span className="opacity-70">{occ.startTime}</span>
                    {subjectName && (
                      <span className="truncate text-emerald-100/90">
                        · {subjectName}
                      </span>
                    )}
                  </div>
                  {grade && (
                    <div className="truncate text-emerald-200/70 text-[8px]">
                      {grade}
                    </div>
                  )}
                </div>
              );
            })}
            {dayOccs.length > 2 && (
              <span className="text-[10px] font-black text-[#064e3b] uppercase">
                + {dayOccs.length - 2} more
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
  }, [currentDate, occurrencesByDate]);

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
            const dayOccs = occurrencesByDate[formatDate(day)] || [];
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
                  {dayOccs.map((occ) => {
                    const grade = getGradeLabel(occ.subjectId);
                    return (
                      <div
                        key={`${occ.classId}-${occ.startTime}`}
                        className="p-3 rounded-2xl bg-[#064e3b] border-l-4 border-yellow-400 shadow-sm"
                      >
                        {/* Class name first */}
                        <div className="font-black text-[11px] text-yellow-400 truncate mb-1">
                          {occ.title}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-100 font-bold">
                          <Clock className="w-3 h-3 shrink-0" />
                          {occ.startTime}–{occ.endTime}
                        </div>
                        {/* Subject name */}
                        {occ.subjectId?.name && (
                          <div className="mt-1 text-[9px] text-emerald-100/90 font-bold truncate">
                            {occ.subjectId.name}
                            {occ.subjectId.code
                              ? ` (${occ.subjectId.code})`
                              : ""}
                          </div>
                        )}
                        {/* Grade if present */}
                        {grade && (
                          <div className="mt-0.5 text-[9px] text-emerald-200/70 font-bold truncate flex items-center gap-1">
                            <GraduationCap className="w-2.5 h-2.5" />
                            {grade}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [currentDate, occurrencesByDate]);

  const renderDayView = useMemo(() => {
    const dayOccs = occurrencesByDate[formatDate(selectedDay)] || [];

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
              {dayOccs.length} Session{dayOccs.length !== 1 ? "s" : ""}{" "}
              Scheduled
            </span>
          </div>

          {dayOccs.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <Clock3 className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold italic">
                No academic sessions found for this date.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dayOccs.map((occ, index) => {
                const status = occ.status;
                const { text: statusText, color: statusColor } =
                  getStatusConfig(status);
                const durationMins = minutesBetween(occ.startTime, occ.endTime);
                const grade = getGradeLabel(occ.subjectId);

                return (
                  <motion.div
                    key={`${occ.classId}-${occ.startTime}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-6 bg-white rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between hover:border-yellow-400 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="bg-[#064e3b] text-yellow-400 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[110px] shadow-lg">
                        <Clock className="w-4 h-4 mb-1" />
                        <span className="font-black text-lg leading-tight">
                          {occ.startTime}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-200/80 mt-0.5">
                          – {occ.endTime}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${statusColor}`}
                          >
                            {statusText}
                          </span>
                          {durationMins > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              {durationMins} min
                            </span>
                          )}
                        </div>
                        {/* Class name */}
                        <h4 className="text-xl font-black text-slate-900 group-hover:text-[#064e3b] transition-colors">
                          {capitalizeFirst(occ.title)}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {/* Subject */}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <BookOpen className="w-3.5 h-3.5" />
                            {occ.subjectId?.name || "General"}
                            {occ.subjectId?.code
                              ? ` (${occ.subjectId.code})`
                              : ""}
                          </div>
                          {/* Grade */}
                          {grade && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {grade}
                            </div>
                          )}
                          {/* Teacher */}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {occ.teacherId
                              ? `${occ.teacherId.firstName} ${occ.teacherId.lastName}`
                              : "TBA"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                      <button
                        onClick={() => {
                          const classId = occ.classId;
                          const classTitle = encodeURIComponent(occ.title);
                          const subject = encodeURIComponent(
                            occ?.subjectId?.name || "N/A"
                          );
                          router(`/webrtc/${classId}/${classTitle}/${subject}`);
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
  }, [selectedDay, occurrencesByDate, router]);

  const headerText = useMemo(() => {
    switch (viewMode) {
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "week": {
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
      }
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
              transition={{ duration: 0.4, ease: "easeOut" }}
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
