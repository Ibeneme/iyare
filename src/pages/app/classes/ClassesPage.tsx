// src/pages/ClassesMain.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Repeat,
  BookOpen,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { fetchClassesByUser } from "../../../store/features/classes/classes.slice";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";

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

type ClassStatus = "upcoming" | "ongoing" | "finished";
type FilterStatus = ClassStatus | "all";

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
  schedules: ScheduleItem[] | undefined,
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
              String(d.date).split("T")[0] + "T00:00:00",
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
        new Date(String(d).split("T")[0] + "T00:00:00").toLocaleDateString(),
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
  now: Date,
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
  now: Date,
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
  to: Date,
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

const expandClassToSessions = (
  cls: ClassModel,
  now: Date,
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
    (o) => o.dateKey === todayKey && o.status === "finished",
  );
  const ongoing = withStatus.filter((o) => o.status === "ongoing");
  const nextUpcoming = withStatus.find((o) => o.status === "upcoming");
  const allFinished = withStatus.filter((o) => o.status === "finished");
  const mostRecentFinished =
    allFinished.length > 0 ? allFinished[allFinished.length - 1] : null;

  const selected: typeof withStatus = [];

  for (const f of todayFinished) selected.push(f);

  for (const o of ongoing) {
    if (
      !selected.some(
        (s) =>
          s.dateKey === o.dateKey &&
          s.startTime === o.startTime &&
          s.endTime === o.endTime,
      )
    ) {
      selected.push(o);
    }
  }

  if (nextUpcoming) {
    if (
      !selected.some(
        (s) =>
          s.dateKey === nextUpcoming.dateKey &&
          s.startTime === nextUpcoming.startTime &&
          s.endTime === nextUpcoming.endTime,
      )
    ) {
      selected.push(nextUpcoming);
    }
  }

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

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ongoing", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Finished" },
];

export default function ClassesMain() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const loadClasses = () => {
    setLoading(true);
    setError(null);
    dispatch(fetchClassesByUser())
      .unwrap()
      .then((data: any[]) => {
        setClasses(data || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || err || "Failed to load classes";
        setError(String(msg));
        toast.error(String(msg));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClasses();
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const counts = useMemo(
    () => ({
      all: sessions.length,
      ongoing: sessions.filter((s) => s.status === "ongoing").length,
      upcoming: sessions.filter((s) => s.status === "upcoming").length,
      finished: sessions.filter((s) => s.status === "finished").length,
    }),
    [sessions],
  );

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

  const groupedSections = useMemo(() => {
    const order: ClassStatus[] = ["ongoing", "upcoming", "finished"];
    const titles: Record<
      ClassStatus,
      { heading: string; description: string }
    > = {
      ongoing: {
        heading: "Live now",
        description: "Sessions currently in progress.",
      },
      upcoming: {
        heading: "Upcoming sessions",
        description: "Next scheduled classes on your timetable.",
      },
      finished: {
        heading: "Completed today & recent",
        description: "Sessions that have already wrapped up.",
      },
    };

    return order
      .map((st) => ({
        status: st,
        ...titles[st],
        items: filteredSessions.filter((s) => s.status === st),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredSessions]);

  const renderSessionCard = (session: SessionInstance) => {
    const { status } = session;
    const subjectName = session.subjectId?.name || "General";
    const subjectCode = session.subjectId?.code;
    const teacherName = session.teacherId
      ? `${session.teacherId.firstName} ${session.teacherId.lastName}`.trim()
      : null;

    return (
      <div
        key={session.key}
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between bg-[var(--color-card)] transition-colors ${
          status === "ongoing"
            ? "border-[var(--color-primary)]"
            : "border-[var(--color-card-border)]"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] font-medium">
              <BookOpen size={12} />
              <span className="truncate">{subjectCode || subjectName}</span>
            </span>
            <StatusPill status={status} />
          </div>

          <div>
            <h3 className="font-semibold text-base text-[var(--color-primary)] leading-snug">
              {session.title}
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {subjectName}
              {subjectCode && subjectCode !== subjectName
                ? ` · ${subjectCode}`
                : ""}
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--color-card-border)] space-y-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2 font-medium text-[var(--color-primary)]">
              {session.isRecurring ? (
                <Repeat
                  size={15}
                  className="text-[var(--color-muted)] shrink-0 mt-0.5"
                />
              ) : (
                <Calendar
                  size={15}
                  className="text-[var(--color-muted)] shrink-0 mt-0.5"
                />
              )}
              <span>{session.whenLabel}</span>
            </div>

            {session.scheduleHint && (
              <div className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
                <Clock size={13} className="shrink-0 mt-0.5" />
                <span>{session.scheduleHint}</span>
              </div>
            )}

            {teacherName && (
              <div className="flex items-center gap-2 pt-0.5">
                <Avatar name={teacherName} size={22} />
                <span className="text-xs font-medium text-[var(--color-muted)] truncate">
                  {teacherName}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/app/live/${session.classId}/${encodeURIComponent(
                session.title,
              )}/${encodeURIComponent(subjectName)}`,
            )
          }
          disabled={status === "finished"}
          className={`btn mt-4 w-full justify-center ${
            status === "finished"
              ? "btn-secondary opacity-60 cursor-not-allowed"
              : "btn-primary"
          }`}
        >
          <PlusCircle size={15} />
          {status === "ongoing"
            ? "Join live class"
            : status === "finished"
              ? "Session ended"
              : "Enter classroom"}
        </button>
      </div>
    );
  };

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Timetable"
        title="Class registry"
        highlight="registry"
        subtitle="Join live lessons, check upcoming times, and review recurring schedules."
      />

      {!loading && error && sessions.length === 0 && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadClasses}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      <Panel
        title={
          loading
            ? "Scheduled sessions"
            : `Scheduled sessions (${filteredSessions.length}${
                searchQuery.trim() || statusFilter !== "all"
                  ? ` of ${sessions.length}`
                  : ""
              })`
        }
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search title, subject, teacher…"
                aria-label="Search classes"
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter sessions by status"
              className="flex items-center gap-1.5 overflow-x-auto"
            >
              {FILTER_TABS.map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`btn !min-h-0 !py-1.5 !px-3 text-xs whitespace-nowrap ${
                      active ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="opacity-75">({counts[tab.key]})</span>
                  </button>
                );
              })}
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading schedule…</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            title="No matching classes"
            text={
              searchQuery.trim() || statusFilter !== "all"
                ? "Try clearing your search query or switching status filters."
                : "No classes are scheduled on your timetable yet."
            }
          />
        ) : statusFilter === "all" ? (
          <div className="divide-y divide-[var(--color-card-border)]">
            {groupedSections.map((group, idx) => (
              <section
                key={group.status}
                className={`space-y-4 ${
                  idx === 0
                    ? "pb-6"
                    : idx === groupedSections.length - 1
                      ? "pt-6"
                      : "py-6"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--color-primary)]">
                      {group.heading}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)]">
                      {group.description}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-muted)] shrink-0">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "session" : "sessions"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(renderSessionCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map(renderSessionCard)}
          </div>
        )}
      </Panel>
    </div>
  );
}
