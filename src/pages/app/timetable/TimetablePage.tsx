import { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
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
import { AppDispatch } from "../../../store/index";
import { fetchClassesByUser } from "../../../store/features/classes/classes.slice";
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
  rangeEnd: Date,
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
  endTime: string,
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
        color:
          "text-[var(--color-info)] bg-[var(--color-info-bg)] border-blue-200 dark:border-blue-800",
      };
    case "ongoing":
      return {
        text: "Live Now",
        color:
          "text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-yellow-300 dark:border-yellow-700 animate-pulse",
      };
    case "finished":
      return {
        text: "Completed",
        color:
          "text-[var(--color-subtle)] bg-[var(--color-surface)] border-[var(--color-card-border)]",
      };
  }
};

const getViewRange = (
  viewMode: ViewMode,
  currentDate: Date,
  selectedDay: Date,
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
    last.getDate() + (42 - (startOffset + last.getDate())),
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

  const navigatePeriod = (amount: number) => {
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
    return occurrences.reduce(
      (acc, occ) => {
        if (!acc[occ.date]) acc[occ.date] = [];
        acc[occ.date].push(occ);
        return acc;
      },
      {} as Record<string, ClassOccurrence[]>,
    );
  }, [occurrences]);

  const todayKey = formatDate(new Date());
  const selectedDayKey = formatDate(selectedDay);

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
          className="p-2 min-h-[110px] border-r border-b border-[var(--color-card-border)] bg-[var(--color-surface)]/50"
        />,
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateKey = formatDate(dayDate);
      const dayOccs = occurrencesByDate[dateKey] || [];
      const isToday = todayKey === dateKey;

      days.push(
        <div
          key={dateKey}
          onClick={() => {
            setSelectedDay(dayDate);
            setViewMode("day");
          }}
          className={`p-2 min-h-[110px] border-r border-b border-[var(--color-card-border)] cursor-pointer transition-colors flex flex-col gap-1 ${
            isToday
              ? "bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30"
              : "bg-[var(--color-card)] hover:bg-[var(--color-surface)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold h-6 w-6 grid place-items-center rounded-md ${
                isToday
                  ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                  : "text-[var(--color-primary)]"
              }`}
            >
              {i}
            </span>
            {dayOccs.length > 0 && (
              <span className="text-[10px] text-[var(--color-muted)]">
                {dayOccs.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {dayOccs.slice(0, 2).map((occ) => {
              const grade = getGradeLabel(occ.subjectId);
              const subjectName = occ.subjectId?.name;
              return (
                <div
                  key={`${occ.classId}-${occ.startTime}`}
                  className="bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                  title={[
                    occ.title,
                    subjectName,
                    grade,
                    `${occ.startTime}–${occ.endTime}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <span className="font-medium">{occ.title}</span>
                  <span className="opacity-70 ml-1 text-[9px]">
                    {occ.startTime}
                  </span>
                </div>
              );
            })}
            {dayOccs.length > 2 && (
              <span className="text-[10px] text-[var(--color-muted)] pl-0.5">
                +{dayOccs.length - 2}
              </span>
            )}
          </div>
        </div>,
      );
    }

    const totalCells = days.length;
    const remainingCells = Math.max(0, 42 - totalCells);
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <div
          key={`empty-next-${i}`}
          className="p-2 min-h-[110px] border-r border-b border-[var(--color-card-border)] bg-[var(--color-surface)]/50"
        />,
      );
    }

    return (
      <div className="w-full bg-[var(--color-card)] rounded-lg border border-[var(--color-card-border)] overflow-hidden">
        <div className="grid grid-cols-7 text-center font-medium text-[var(--color-muted)] text-xs bg-[var(--color-surface)] border-b border-[var(--color-card-border)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-2.5 border-r border-[var(--color-card-border)] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  }, [currentDate, occurrencesByDate, todayKey]);

  const renderWeekView = useMemo(() => {
    const startDay = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      return day;
    });

    return (
      <div className="w-full bg-[var(--color-card)] rounded-lg border border-[var(--color-card-border)] overflow-hidden">
        <div className="grid grid-cols-7 text-center bg-[var(--color-surface)] border-b border-[var(--color-card-border)]">
          {weekDays.map((day) => {
            const key = formatDate(day);
            const isToday = todayKey === key;
            return (
              <div
                key={key}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode("day");
                }}
                className={`py-3 px-1 border-r border-[var(--color-card-border)] last:border-r-0 cursor-pointer ${
                  isToday
                    ? "bg-[var(--color-accent)]/20"
                    : "hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                <div className="text-[10px] font-medium uppercase text-[var(--color-muted)]">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={`mt-1 mx-auto w-7 h-7 rounded-md grid place-items-center text-sm font-semibold ${
                    isToday
                      ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                      : "text-[var(--color-primary)]"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[420px]">
          {weekDays.map((day) => {
            const key = formatDate(day);
            const dayOccs = occurrencesByDate[key] || [];
            return (
              <div
                key={key}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode("day");
                }}
                className="p-2 border-r border-[var(--color-card-border)] last:border-r-0 hover:bg-[var(--color-surface)]/50 cursor-pointer"
              >
                <div className="space-y-1.5">
                  {dayOccs.map((occ) => (
                    <div
                      key={`${occ.classId}-${occ.startTime}`}
                      className="p-2 rounded-md bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-xs"
                    >
                      <div className="font-medium truncate">{occ.title}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {occ.startTime}–{occ.endTime}
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
  }, [currentDate, occurrencesByDate, todayKey]);

  const renderDayView = useMemo(() => {
    const dayOccs = occurrencesByDate[selectedDayKey] || [];

    return (
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-card-border)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[var(--color-card-border)]">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-primary)] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {selectedDay.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <span className="text-xs font-medium text-[var(--color-muted)] bg-[var(--color-surface)] px-2.5 py-1 rounded-md border border-[var(--color-card-border)]">
            {dayOccs.length} {dayOccs.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        {dayOccs.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-md border border-dashed border-[var(--color-card-border)]">
            <Clock3 className="w-10 h-10 mx-auto mb-2 text-[var(--color-subtle)]" />
            <p className="text-sm text-[var(--color-muted)]">
              No classes scheduled
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {dayOccs.map((occ, index) => {
              const status = occ.status;
              const { text: statusText, color: statusColor } =
                getStatusConfig(status);
              const durationMins = minutesBetween(occ.startTime, occ.endTime);
              const grade = getGradeLabel(occ.subjectId);

              return (
                <motion.div
                  key={`${occ.classId}-${occ.startTime}-${index}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 bg-[var(--color-surface)] rounded-md border border-[var(--color-card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--color-primary)]/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-3 py-2 rounded-md text-center sm:min-w-[100px]">
                      <div className="font-semibold text-sm">
                        {occ.startTime}
                      </div>
                      <div className="text-xs opacity-80">– {occ.endTime}</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusColor}`}
                        >
                          {statusText}
                        </span>
                        {durationMins > 0 && (
                          <span className="text-xs text-[var(--color-muted)]">
                            {durationMins} min
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-[var(--color-primary)]">
                        {capitalizeFirst(occ.title)}
                      </h4>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--color-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {occ.subjectId?.name || "General"}
                        </span>
                        {grade && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {grade}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {occ.teacherId
                            ? `${occ.teacherId.firstName} ${occ.teacherId.lastName}`
                            : "TBA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const classId = occ.classId;
                      const classTitle = encodeURIComponent(occ.title);
                      const subject = encodeURIComponent(
                        occ?.subjectId?.name || "N/A",
                      );
                      router(`/app/live/${classId}/${classTitle}/${subject}`);
                    }}
                    disabled={status === "finished"}
                    className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium transition-colors ${
                      status === "finished"
                        ? "bg-[var(--color-card)] text-[var(--color-subtle)] border border-[var(--color-card-border)] cursor-not-allowed"
                        : "bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)]"
                    }`}
                  >
                    <Video size={14} />
                    {status === "ongoing" ? "Join Now" : "Open Class"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [selectedDay, selectedDayKey, occurrencesByDate, router]);

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
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
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
            className="fixed inset-0 bg-[var(--color-card)]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[100]"
          >
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mb-3" />
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--color-primary)]">
              Syncing Calendar…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[var(--color-surface)] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-primary)] tracking-tight">
                Academic Timetable
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Browse sessions by month, week, or day
              </p>
            </div>

            <div className="inline-flex gap-1 bg-[var(--color-card)] border border-[var(--color-card-border)] p-1 rounded-md">
              {(["month", "week", "day"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setViewMode(view)}
                  className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                    viewMode === view
                      ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </header>

          {/* Navigation */}
          <div className="flex items-center justify-between bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-md px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigatePeriod(-1)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-[var(--color-surface)] text-[var(--color-primary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-[var(--color-primary)] min-w-[180px] text-center">
                {headerText}
              </h2>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-[var(--color-surface)] text-[var(--color-primary)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDay(now);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-primary)]"
            >
              Today
            </button>
          </div>

          {/* Calendar Views */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${headerText}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
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
