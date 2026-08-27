// src/pages/ClassesMain.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Circle,
  Repeat,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
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
  status?: ClassStatus;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

type ClassStatus = "upcoming" | "ongoing" | "finished";
type FilterStatus = ClassStatus | "all";

/** One concrete session instance shown as a card */
interface SessionInstance {
  key: string;
  classId: string;
  title: string;
  subjectId: ClassModel["subjectId"];
  teacherId: ClassModel["teacherId"];
  status: ClassStatus;
  whenLabel: string;
  scheduleHint?: string;
  isRecurring: boolean;
  startTime: string;
  endTime: string;
  dateKey: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalizeTimeSlots = (slots: any): TimeSlot[] => {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  return slots
    .filter((t) => t && t.startTime && t.endTime)
    .map((t) => ({
      startTime: String(t.startTime).slice(0, 5),
      endTime: String(t.endTime).slice(0, 5),
    }));
};

const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTimeSlots = (slots: TimeSlot[]): string => {
  if (!slots.length) return "";
  return slots.map((t) => `${t.startTime}–${t.endTime}`).join(", ");
};

const summarizeSchedules = (
  schedules: ScheduleItem[] | undefined
): string | null => {
  if (!schedules || schedules.length === 0) return null;

  const parts = schedules.map((raw) => {
    const frequency = (raw.frequency as Frequency) || "none";

    if (frequency === "daily") {
      const times = formatTimeSlots(normalizeTimeSlots(raw.timeSlots));
      return times ? `Daily · ${times}` : "Daily";
    }

    if (frequency === "weekly") {
      const daysRaw = raw.daysOfWeek || [];
      if (daysRaw.length === 0) return "Weekly";

      if (typeof (daysRaw as any[])[0] === "object") {
        const entries = (daysRaw as DayOfWeekEntry[])
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((d) => {
            const times = formatTimeSlots(normalizeTimeSlots(d.timeSlots));
            return times ? `${DAY_NAMES[d.day]} ${times}` : DAY_NAMES[d.day];
          });
        return `Weekly · ${entries.join(", ")}`;
      }

      const shared = formatTimeSlots(normalizeTimeSlots(raw.timeSlots));
      const days = (daysRaw as number[])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAY_NAMES[d])
        .join(", ");
      return shared ? `Weekly on ${days} · ${shared}` : `Weekly on ${days}`;
    }

    if (frequency === "monthly") {
      const daysRaw = raw.daysOfMonth || [];
      if (daysRaw.length === 0) return "Monthly";

      if (typeof (daysRaw as any[])[0] === "object") {
        const entries = (daysRaw as DayOfMonthEntry[])
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((d) => {
            const times = formatTimeSlots(normalizeTimeSlots(d.timeSlots));
            return times ? `day ${d.day} ${times}` : `day ${d.day}`;
          });
        return `Monthly · ${entries.join(", ")}`;
      }

      const shared = formatTimeSlots(normalizeTimeSlots(raw.timeSlots));
      const days = (daysRaw as number[])
        .slice()
        .sort((a, b) => a - b)
        .join(", ");
      return shared
        ? `Monthly on day ${days} · ${shared}`
        : `Monthly on day ${days}`;
    }

    const datesRaw = raw.specificDates || [];
    if (datesRaw.length === 0) return "One-off";

    if (typeof (datesRaw as any[])[0] === "object") {
      const entries = (datesRaw as SpecificDateEntry[]).map((d) => {
        const label = d.date
          ? new Date(
              String(d.date).split("T")[0] + "T00:00:00"
            ).toLocaleDateString()
          : "—";
        const times = formatTimeSlots(normalizeTimeSlots(d.timeSlots));
        return times ? `${label} ${times}` : label;
      });
      return `On ${entries.join(", ")}`;
    }

    const shared = formatTimeSlots(normalizeTimeSlots(raw.timeSlots));
    const dates = (datesRaw as string[])
      .map((d) =>
        new Date(String(d).split("T")[0] + "T00:00:00").toLocaleDateString()
      )
      .join(", ");
    return shared ? `On ${dates} · ${shared}` : `On ${dates}`;
  });

  return parts.filter(Boolean).join("  |  ") || null;
};

const isRecurringClass = (cls: ClassModel): boolean =>
  Array.isArray(cls.schedules) &&
  cls.schedules.some((s) => s.frequency && s.frequency !== "none");

const occurrenceStatus = (
  dateKey: string,
  startTime: string,
  endTime: string,
  now: Date
): ClassStatus => {
  const start = new Date(`${dateKey}T${startTime}:00`);
  const end = new Date(`${dateKey}T${endTime}:00`);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "finished";
};

const formatWhenLabel = (
  dateKey: string,
  startTime: string,
  endTime: string,
  now: Date
): string => {
  const todayKey = formatDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  const timeRange = `${startTime}–${endTime}`;
  if (dateKey === todayKey) return `Today · ${timeRange}`;
  if (dateKey === tomorrowKey) return `Tomorrow · ${timeRange}`;

  const d = new Date(dateKey + "T00:00:00");
  const dayName = DAY_NAMES[d.getDay()];
  return `${dayName} ${d.toLocaleDateString()} · ${timeRange}`;
};

const collectOccurrences = (
  cls: ClassModel,
  from: Date,
  to: Date
): Array<{ dateKey: string; startTime: string; endTime: string }> => {
  const result: Array<{
    dateKey: string;
    startTime: string;
    endTime: string;
  }> = [];
  const fromKey = formatDateKey(from);
  const toKey = formatDateKey(to);

  const push = (dateKey: string, slot: TimeSlot) => {
    if (dateKey < fromKey || dateKey > toKey) return;
    result.push({
      dateKey,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  };

  if (Array.isArray(cls.schedules) && cls.schedules.length > 0) {
    for (const raw of cls.schedules) {
      const frequency = (raw.frequency as Frequency) || "none";
      const ruleStart = raw.startDate
        ? new Date(String(raw.startDate).split("T")[0] + "T00:00:00")
        : null;
      const ruleEnd = raw.endDate
        ? new Date(String(raw.endDate).split("T")[0] + "T23:59:59")
        : null;

      let windowStart = new Date(from);
      let windowEnd = new Date(to);
      if (ruleStart && ruleStart > windowStart) windowStart = ruleStart;
      if (ruleEnd && ruleEnd < windowEnd) windowEnd = ruleEnd;
      if (windowStart > windowEnd) continue;

      if (frequency === "daily") {
        const slots = normalizeTimeSlots(raw.timeSlots);
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const key = formatDateKey(cursor);
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

        const byDay = new Map(entries.map((e) => [e.day, e.timeSlots]));
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const slots = byDay.get(cursor.getDay());
          if (slots) {
            const key = formatDateKey(cursor);
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

        const byDay = new Map(entries.map((e) => [e.day, e.timeSlots]));
        const cursor = new Date(windowStart);
        while (cursor <= windowEnd) {
          const slots = byDay.get(cursor.getDate());
          if (slots) {
            const key = formatDateKey(cursor);
            for (const slot of slots) push(key, slot);
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (frequency === "none") {
        const datesRaw = raw.specificDates || [];
        if (datesRaw.length > 0 && typeof (datesRaw as any[])[0] === "object") {
          for (const entry of datesRaw as SpecificDateEntry[]) {
            if (!entry.date) continue;
            const key = String(entry.date).split("T")[0];
            for (const slot of normalizeTimeSlots(entry.timeSlots)) {
              push(key, slot);
            }
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

  result.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.startTime.localeCompare(b.startTime);
  });

  return result;
};

/**
 * Build session cards for one class:
 * - Today's finished slot(s)
 * - Ongoing slot(s)
 * - Next upcoming occurrence (always, if any remain in the schedule window)
 * - Fallback: most recent finished
 *
 * Example Ethics weekly Sun/Tue/Thu:
 *   Today Thu 09:00–10:00 finished → card "finished"
 *   Next Sun 09:00–10:00 → card "upcoming"
 */
const expandClassToSessions = (
  cls: ClassModel,
  now: Date
): SessionInstance[] => {
  const from = new Date(now);
  from.setDate(from.getDate() - 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(now);
  to.setDate(to.getDate() + 56);
  to.setHours(23, 59, 59, 999);

  const occs = collectOccurrences(cls, from, to);
  const todayKey = formatDateKey(now);
  const scheduleHint = summarizeSchedules(cls.schedules) || undefined;
  const recurring = isRecurringClass(cls);

  if (occs.length === 0) {
    return [
      {
        key: `${cls._id}-none`,
        classId: cls._id,
        title: cls.title,
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
        status: cls.status || "upcoming",
        whenLabel: scheduleHint || "No schedule set",
        scheduleHint: undefined,
        isRecurring: recurring,
        startTime: "",
        endTime: "",
        dateKey: "",
      },
    ];
  }

  const withStatus = occs.map((o) => ({
    ...o,
    status: occurrenceStatus(o.dateKey, o.startTime, o.endTime, now),
  }));

  const todayFinished = withStatus.filter(
    (o) => o.dateKey === todayKey && o.status === "finished"
  );
  const ongoing = withStatus.filter((o) => o.status === "ongoing");
  const nextUpcoming = withStatus.find((o) => o.status === "upcoming");
  const allFinished = withStatus.filter((o) => o.status === "finished");
  const mostRecentFinished =
    allFinished.length > 0 ? allFinished[allFinished.length - 1] : null;

  const selected: typeof withStatus = [];

  // 1) Today's finished
  for (const f of todayFinished) selected.push(f);

  // 2) Ongoing
  for (const o of ongoing) {
    if (
      !selected.some(
        (s) =>
          s.dateKey === o.dateKey &&
          s.startTime === o.startTime &&
          s.endTime === o.endTime
      )
    ) {
      selected.push(o);
    }
  }

  // 3) Next upcoming — always include so finished + upcoming both show
  if (nextUpcoming) {
    if (
      !selected.some(
        (s) =>
          s.dateKey === nextUpcoming.dateKey &&
          s.startTime === nextUpcoming.startTime &&
          s.endTime === nextUpcoming.endTime
      )
    ) {
      selected.push(nextUpcoming);
    }
  }

  // 4) Nothing left → most recent finished
  if (selected.length === 0 && mostRecentFinished) {
    selected.push(mostRecentFinished);
  }

  if (selected.length === 0 && withStatus[0]) {
    selected.push(withStatus[0]);
  }

  return selected.map((o) => ({
    key: `${cls._id}-${o.dateKey}-${o.startTime}-${o.endTime}`,
    classId: cls._id,
    title: cls.title,
    subjectId: cls.subjectId,
    teacherId: cls.teacherId,
    status: o.status,
    whenLabel: formatWhenLabel(o.dateKey, o.startTime, o.endTime, now),
    scheduleHint: recurring ? scheduleHint : undefined,
    isRecurring: recurring,
    startTime: o.startTime,
    endTime: o.endTime,
    dateKey: o.dateKey,
  }));
};

export default function ClassesMain() {
  const dispatch = useDispatch<AppDispatch>();

  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(error);
    dispatch(fetchClassesByUser())
      .unwrap()
      .then((data: any[]) => {
        setClasses(data || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || err || "Failed to load classes";
        setError(msg);
        toast.error(msg);
        setLoading(false);
      });
  }, [dispatch]);

  const sessions = useMemo(() => {
    const now = new Date();
    const all: SessionInstance[] = [];
    for (const cls of classes) {
      all.push(...expandClassToSessions(cls, now));
    }
    const rank = (s: ClassStatus) =>
      s === "ongoing" ? 0 : s === "upcoming" ? 1 : 2;
    all.sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      return a.startTime.localeCompare(b.startTime);
    });
    return all;
  }, [classes]);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const title = s.title.toLowerCase();
        const subject = s.subjectId?.name?.toLowerCase() || "";
        const code = s.subjectId?.code?.toLowerCase() || "";
        const teacher = s.teacherId
          ? `${s.teacherId.firstName} ${s.teacherId.lastName}`.toLowerCase()
          : "";
        const when = s.whenLabel.toLowerCase();
        const hint = s.scheduleHint?.toLowerCase() || "";
        return (
          title.includes(query) ||
          subject.includes(query) ||
          code.includes(query) ||
          teacher.includes(query) ||
          when.includes(query) ||
          hint.includes(query)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    return filtered;
  }, [sessions, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#fcfdfc] p-6 md:p-12">
      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]">
            <Loader2 className="w-12 h-12 animate-spin text-[#064e3b]" />
            <p className="text-[#064e3b] font-black uppercase tracking-[0.2em] mt-4 text-[10px]">
              Loading Schedule...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#064e3b] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20">
              <Calendar className="text-yellow-400" size={28} />
            </div>
            <h1 className="text-5xl font-black text-[#064e3b] tracking-tighter">
              Class Registry
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-xl">
            Access your live sessions and curriculum timeline.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#064e3b] transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by subject or topic..."
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-[#064e3b] outline-none font-bold text-slate-800 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] h-fit self-center">
            {(["all", "upcoming", "ongoing", "finished"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === status
                      ? "bg-[#064e3b] text-yellow-400 shadow-lg"
                      : "text-slate-500 hover:text-[#064e3b]"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        {!loading && filteredSessions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <Calendar className="w-14 h-14 mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400 font-bold">
              {searchQuery || statusFilter !== "all"
                ? "No classes match your filters."
                : "No classes scheduled yet."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions?.reverse()?.map((session) => {
            const { status } = session;
            const subjectName = session.subjectId?.name || "General";
            const subjectCode = session.subjectId?.code;

            return (
              <motion.div
                key={session.key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 hover:border-yellow-400 transition-all group shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 relative overflow-hidden"
              >
                {/* Subject code + status */}
                <div className="flex justify-between items-start mb-6">
                  <div className="px-4 py-1.5 bg-slate-900 text-yellow-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {subjectCode || "GEN"}
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${
                      status === "ongoing"
                        ? "border-yellow-400 bg-yellow-400 text-[#064e3b] animate-pulse"
                        : status === "upcoming"
                        ? "border-blue-100 text-blue-600 bg-blue-50"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <Circle size={8} className="fill-current" /> {status}
                  </div>
                </div>

                {/* Class title */}
                <h3 className="text-2xl font-black text-[#064e3b] mb-2 leading-tight group-hover:text-black transition-colors">
                  {session.title}
                </h3>

                {/* Subject name — always visible */}
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen size={14} className="text-[#064e3b] shrink-0" />
                  <p className="text-slate-600 font-bold text-sm">
                    {subjectName}
                    {subjectCode ? (
                      <span className="text-slate-400 font-bold text-xs ml-1.5">
                        ({subjectCode})
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="space-y-3 pt-5 border-t border-slate-50 mb-8">
                  {/* This session's when */}
                  <div className="flex items-start gap-3 text-slate-600 font-bold text-sm">
                    {session.isRecurring ? (
                      <Repeat
                        size={18}
                        className="text-[#064e3b] shrink-0 mt-0.5"
                      />
                    ) : (
                      <Calendar
                        size={18}
                        className="text-[#064e3b] shrink-0 mt-0.5"
                      />
                    )}
                    <span className="leading-snug">{session.whenLabel}</span>
                  </div>
                  {/* Full recurring pattern */}
                  {session.scheduleHint && (
                    <div className="flex items-start gap-3 text-slate-400 font-bold text-xs">
                      <Clock
                        size={16}
                        className="text-[#064e3b] shrink-0 mt-0.5"
                      />
                      <span className="leading-snug">
                        {session.scheduleHint}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/webrtc/${session.classId}/${encodeURIComponent(
                        session.title
                      )}/${encodeURIComponent(subjectName)}`
                    )
                  }
                  disabled={status === "finished"}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    status === "finished"
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-[#064e3b] text-yellow-400 hover:bg-slate-900 shadow-xl shadow-emerald-900/10"
                  }`}
                >
                  <PlusCircle size={16} />{" "}
                  {status === "ongoing" ? "Join Now" : "Enter Room"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
