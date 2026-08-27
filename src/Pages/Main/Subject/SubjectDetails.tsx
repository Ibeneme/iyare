import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  Users,
  GraduationCap,
  Calendar,
  ToggleLeft,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Clock,
  FileText,
  Megaphone,
  ClipboardList,
  Mail,
  BookOpen,
  CheckCircle2,
  XCircle,
  Repeat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  fetchSubjectById,
  deleteSubject,
} from "../../../Redux/Slices/subject.slice";
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../../Redux/Slices/class.slice";
import {
  fetchResources,
  addResource,
  updateResource,
  deleteResource,
  clearResources,
} from "../../../Redux/Slices/resources.slice";
import { useParams, useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";

interface RawSubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  gradeLevel: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;
  grades: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;
  teachers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  children: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    subjects?: string[];
    isSubscribed?: boolean;
    gradeId?: string;
  }>;
  classes: Array<{
    _id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    teacherId?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

type ResourceType = "assignment" | "note" | "announcement";
type MobileTab = "classes" | "assignments" | "teachers" | "students";

/* ---------- Recurring schedule types (mirrors backend Class model) ---------- */
type Frequency = "daily" | "weekly" | "monthly" | "none";

interface TimeSlot {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

/** Per-day entry for weekly schedules */
interface DayOfWeekEntry {
  day: number; // 0 (Sun) - 6 (Sat)
  timeSlots: TimeSlot[];
}

/** Per-day entry for monthly schedules */
interface DayOfMonthEntry {
  day: number; // 1-31
  timeSlots: TimeSlot[];
}

/** Per-date entry for one-off (frequency "none") schedules */
interface SpecificDateEntry {
  date: string; // YYYY-MM-DD
  timeSlots: TimeSlot[];
}

interface ScheduleItem {
  frequency: Frequency;
  /** Shared time slots — used only when frequency === "daily" */
  timeSlots: TimeSlot[];
  daysOfWeek: DayOfWeekEntry[];
  daysOfMonth: DayOfMonthEntry[];
  specificDates: SpecificDateEntry[];
  startDate: string; // ISO date string, optional
  endDate: string; // ISO date string, optional
}

interface ClassForm {
  title: string;
  schedules: ScheduleItem[];
}

interface ResourceForm {
  title: string;
  description: string;
}

const resourceIcons = {
  assignment: ClipboardList,
  note: FileText,
  announcement: Megaphone,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusStyles: Record<string, string> = {
  ongoing: "bg-emerald-100 text-emerald-800 border-emerald-200",
  upcoming: "bg-yellow-50 text-yellow-800 border-yellow-200",
  finished: "bg-gray-100 text-gray-500 border-gray-200",
};

const makeEmptyTimeSlot = (): TimeSlot => ({
  startTime: "09:00",
  endTime: "10:00",
});

const makeEmptySchedule = (): ScheduleItem => ({
  frequency: "weekly",
  timeSlots: [makeEmptyTimeSlot()],
  daysOfWeek: [],
  daysOfMonth: [],
  specificDates: [],
  startDate: "",
  endDate: "",
});

const makeEmptyClassForm = (): ClassForm => ({
  title: "",
  schedules: [makeEmptySchedule()],
});

/** Normalize a single timeSlots array from backend (may be missing/empty) */
const normalizeTimeSlots = (slots: any): TimeSlot[] => {
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.map((t: any) => ({
      startTime: t?.startTime || "09:00",
      endTime: t?.endTime || "10:00",
    }));
  }
  return [makeEmptyTimeSlot()];
};

/**
 * Turn raw backend schedules into form-safe values.
 * Supports both the new per-day shape and a legacy flat shape
 * (daysOfWeek as number[], timeSlots shared) for older documents.
 */
const normalizeScheduleForForm = (s: any): ScheduleItem => {
  const frequency: Frequency = s?.frequency || "weekly";
  const startDate = s?.startDate ? String(s.startDate).split("T")[0] : "";
  const endDate = s?.endDate ? String(s.endDate).split("T")[0] : "";

  // --- daysOfWeek ---
  let daysOfWeek: DayOfWeekEntry[] = [];
  if (Array.isArray(s?.daysOfWeek) && s.daysOfWeek.length > 0) {
    if (typeof s.daysOfWeek[0] === "object" && s.daysOfWeek[0] !== null) {
      // New shape: [{ day, timeSlots }]
      daysOfWeek = s.daysOfWeek.map((d: any) => ({
        day: typeof d.day === "number" ? d.day : 0,
        timeSlots: normalizeTimeSlots(d.timeSlots),
      }));
    } else {
      // Legacy: [0, 1, 2, ...] + shared timeSlots
      const shared = normalizeTimeSlots(s.timeSlots);
      daysOfWeek = s.daysOfWeek.map((day: number) => ({
        day,
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  // --- daysOfMonth ---
  let daysOfMonth: DayOfMonthEntry[] = [];
  if (Array.isArray(s?.daysOfMonth) && s.daysOfMonth.length > 0) {
    if (typeof s.daysOfMonth[0] === "object" && s.daysOfMonth[0] !== null) {
      daysOfMonth = s.daysOfMonth.map((d: any) => ({
        day: typeof d.day === "number" ? d.day : 1,
        timeSlots: normalizeTimeSlots(d.timeSlots),
      }));
    } else {
      const shared = normalizeTimeSlots(s.timeSlots);
      daysOfMonth = s.daysOfMonth.map((day: number) => ({
        day,
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  // --- specificDates ---
  let specificDates: SpecificDateEntry[] = [];
  if (Array.isArray(s?.specificDates) && s.specificDates.length > 0) {
    if (typeof s.specificDates[0] === "object" && s.specificDates[0] !== null) {
      specificDates = s.specificDates.map((d: any) => ({
        date: d.date ? String(d.date).split("T")[0] : "",
        timeSlots: normalizeTimeSlots(d.timeSlots),
      }));
    } else {
      // Legacy: plain ISO strings + shared timeSlots
      const shared = normalizeTimeSlots(s.timeSlots);
      specificDates = s.specificDates.map((d: string) => ({
        date: d ? String(d).split("T")[0] : "",
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  return {
    frequency,
    timeSlots: normalizeTimeSlots(s?.timeSlots),
    daysOfWeek,
    daysOfMonth,
    specificDates,
    startDate,
    endDate,
  };
};

/** Format a list of time slots for display */
const formatTimeSlots = (slots: TimeSlot[] | undefined): string => {
  if (!slots || slots.length === 0) return "";
  return slots.map((t) => `${t.startTime}–${t.endTime}`).join(", ");
};

/* Human readable summary of a class's schedules, shown on the class card */
const summarizeSchedules = (
  schedules: ScheduleItem[] | any[] | undefined
): string => {
  if (!schedules || schedules.length === 0) return "No schedule set";

  return schedules
    .map((raw) => {
      const s = normalizeScheduleForForm(raw);

      switch (s.frequency) {
        case "daily": {
          const times = formatTimeSlots(s.timeSlots);
          return times ? `Daily · ${times}` : "Daily";
        }
        case "weekly": {
          if (s.daysOfWeek.length === 0) return "Weekly on —";
          const parts = s.daysOfWeek
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((d) => {
              const times = formatTimeSlots(d.timeSlots);
              return times ? `${DAY_NAMES[d.day]} ${times}` : DAY_NAMES[d.day];
            });
          return `Weekly · ${parts.join(", ")}`;
        }
        case "monthly": {
          if (s.daysOfMonth.length === 0) return "Monthly on day —";
          const parts = s.daysOfMonth
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((d) => {
              const times = formatTimeSlots(d.timeSlots);
              return times ? `day ${d.day} ${times}` : `day ${d.day}`;
            });
          return `Monthly · ${parts.join(", ")}`;
        }
        case "none": {
          if (s.specificDates.length === 0) return "One-off (no date set)";
          const parts = s.specificDates.map((d) => {
            const label = d.date
              ? new Date(d.date + "T00:00:00").toLocaleDateString()
              : "—";
            const times = formatTimeSlots(d.timeSlots);
            return times ? `${label} ${times}` : label;
          });
          return `On ${parts.join(", ")}`;
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("  |  ");
};

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [subject, setSubject] = useState<RawSubject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [classForm, setClassForm] = useState<ClassForm>(makeEmptyClassForm());
  const [classSubmitted, setClassSubmitted] = useState(false);
  const [classSaving, setClassSaving] = useState(false);
  const [classFormError, setClassFormError] = useState<string | null>(null);

  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  const [activeTab, setActiveTab] = useState<ResourceType>("assignment");
  const [resources, setResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isEditResourceOpen, setIsEditResourceOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceForm>({
    title: "",
    description: "",
  });
  const [resourceSubmitted, setResourceSubmitted] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);

  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [isDeleteResourceOpen, setIsDeleteResourceOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(false);

  const [isDeleteSubjectOpen, setIsDeleteSubjectOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);

  // Mobile bottom nav tab
  const [mobileTab, setMobileTab] = useState<MobileTab>("classes");

  useEffect(() => {
    if (!id) {
      setSubjectError("Invalid subject ID");
      setSubjectLoading(false);
      console.log(resourceSubmitted, classSubmitted);
      return;
    }
    setSubjectLoading(true);
    setSubjectError(null);
    dispatch(fetchSubjectById(id))
      .unwrap()
      .then((data: any) => {
        setSubject(data);
        setSubjectLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load subject";
        setSubjectError(msg);
        toast.error(msg);
        setSubjectLoading(false);
      });
  }, [id, dispatch]);

  useEffect(() => {
    if (!id) return;
    setClassesLoading(true);
    setClassesError(null);
    dispatch(fetchClasses(id))
      .unwrap()
      .then((data: any[]) => {
        setClasses(data);
        setClassesLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load classes";
        setClassesError(msg);
        toast.error(msg);
        setClassesLoading(false);
      });
  }, [id, dispatch]);

  useEffect(() => {
    if (!id) return;
    setResourcesLoading(true);
    setResourcesError(null);
    dispatch(fetchResources({ type: activeTab, subjectId: id }))
      .unwrap()
      .then((data: any[]) => {
        setResources(data);
        setResourcesLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || "Failed to load resources";
        setResourcesError(msg);
        toast.error(msg);
        setResourcesLoading(false);
      });
    return () => {
      dispatch(clearResources());
    };
  }, [id, activeTab, dispatch]);

  const closeDeleteSubject = () => setIsDeleteSubjectOpen(false);
  const confirmDeleteSubject = async () => {
    if (!id) return;
    setDeletingSubject(true);
    try {
      await dispatch(deleteSubject(id)).unwrap();
      toast.success("Subject deleted");
      navigate("/subject-manager");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingSubject(false);
      closeDeleteSubject();
    }
  };

  /* ---------------- Class: open/close modals ---------------- */

  const openAddClass = () => {
    setClassForm(makeEmptyClassForm());
    setClassFormError(null);
    setClassSubmitted(false);
    setIsAddClassOpen(true);
  };
  const closeAddClass = () => setIsAddClassOpen(false);

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    const schedules =
      Array.isArray(cls.schedules) && cls.schedules.length > 0
        ? cls.schedules.map(normalizeScheduleForForm)
        : [makeEmptySchedule()];
    setClassForm({
      title: cls.title || "",
      schedules,
    });
    setClassFormError(null);
    setClassSubmitted(false);
    setIsEditClassOpen(true);
  };
  const closeEditClass = () => {
    setEditingClass(null);
    setIsEditClassOpen(false);
  };

  const handleClassTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClassForm((p) => ({ ...p, title: e.target.value }));
  };

  /* ---------------- Class: schedule rule helpers ---------------- */

  const updateSchedule = (
    index: number,
    updater: (s: ScheduleItem) => ScheduleItem
  ) => {
    setClassForm((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => (i === index ? updater(s) : s)),
    }));
  };

  const addSchedule = () => {
    setClassForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, makeEmptySchedule()],
    }));
  };

  const removeSchedule = (index: number) => {
    setClassForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const setScheduleFrequency = (index: number, frequency: Frequency) => {
    updateSchedule(index, (s) => ({ ...s, frequency }));
  };

  /* ---- Weekly day of week ---- */
  const toggleDayOfWeek = (index: number, day: number) => {
    updateSchedule(index, (s) => {
      const existing = s.daysOfWeek.find((d) => d.day === day);
      if (existing) {
        return {
          ...s,
          daysOfWeek: s.daysOfWeek.filter((d) => d.day !== day),
        };
      }
      return {
        ...s,
        daysOfWeek: [
          ...s.daysOfWeek,
          { day, timeSlots: [makeEmptyTimeSlot()] },
        ].sort((a, b) => a.day - b.day),
      };
    });
  };

  const changeDayOfWeekTimeSlot = (
    index: number,
    day: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, i) =>
                i === slotIdx ? { ...t, [field]: value } : t
              ),
            }
          : d
      ),
    }));
  };

  const addDayOfWeekTimeSlot = (index: number, day: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d
      ),
    }));
  };

  const removeDayOfWeekTimeSlot = (
    index: number,
    day: number,
    slotIdx: number
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, i) => i !== slotIdx),
            }
          : d
      ),
    }));
  };

  /* ---- Monthly day of month ---- */
  const toggleDayOfMonth = (index: number, day: number) => {
    updateSchedule(index, (s) => {
      const existing = s.daysOfMonth.find((d) => d.day === day);
      if (existing) {
        return {
          ...s,
          daysOfMonth: s.daysOfMonth.filter((d) => d.day !== day),
        };
      }
      return {
        ...s,
        daysOfMonth: [
          ...s.daysOfMonth,
          { day, timeSlots: [makeEmptyTimeSlot()] },
        ].sort((a, b) => a.day - b.day),
      };
    });
  };

  const changeDayOfMonthTimeSlot = (
    index: number,
    day: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, i) =>
                i === slotIdx ? { ...t, [field]: value } : t
              ),
            }
          : d
      ),
    }));
  };

  const addDayOfMonthTimeSlot = (index: number, day: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d
      ),
    }));
  };

  const removeDayOfMonthTimeSlot = (
    index: number,
    day: number,
    slotIdx: number
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, i) => i !== slotIdx),
            }
          : d
      ),
    }));
  };

  /* ---- Specific dates ---- */
  const addSpecificDate = (index: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: [
        ...s.specificDates,
        { date: "", timeSlots: [makeEmptyTimeSlot()] },
      ],
    }));
  };

  const changeSpecificDateValue = (
    index: number,
    dateIdx: number,
    value: string
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx ? { ...d, date: value } : d
      ),
    }));
  };

  const removeSpecificDate = (index: number, dateIdx: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.filter((_, i) => i !== dateIdx),
    }));
  };

  const changeSpecificDateTimeSlot = (
    index: number,
    dateIdx: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, j) =>
                j === slotIdx ? { ...t, [field]: value } : t
              ),
            }
          : d
      ),
    }));
  };

  const addSpecificDateTimeSlot = (index: number, dateIdx: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d
      ),
    }));
  };

  const removeSpecificDateTimeSlot = (
    index: number,
    dateIdx: number,
    slotIdx: number
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, j) => j !== slotIdx),
            }
          : d
      ),
    }));
  };

  /* ---- Shared (daily) time slots ---- */
  const addTimeSlot = (index: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      timeSlots: [...s.timeSlots, makeEmptyTimeSlot()],
    }));
  };

  const changeTimeSlot = (
    index: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t, i) =>
        i === slotIdx ? { ...t, [field]: value } : t
      ),
    }));
  };

  const removeTimeSlot = (index: number, slotIdx: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      timeSlots: s.timeSlots.filter((_, i) => i !== slotIdx),
    }));
  };

  const changeScheduleDate = (
    index: number,
    field: "startDate" | "endDate",
    value: string
  ) => {
    updateSchedule(index, (s) => ({ ...s, [field]: value }));
  };

  /* ---------------- Class: validation + save ---------------- */

  const validateTimeSlots = (
    slots: TimeSlot[],
    label: string
  ): string | null => {
    if (!slots || slots.length === 0) {
      return `${label} needs at least one time slot.`;
    }
    for (const t of slots) {
      if (!t.startTime || !t.endTime) {
        return `Fill in start and end time for every time slot (${label}).`;
      }
      if (t.endTime <= t.startTime) {
        return `End time must be after start time (${label}).`;
      }
    }
    return null;
  };

  const validateSchedules = (schedules: ScheduleItem[]): string | null => {
    if (schedules.length === 0) return "Add at least one schedule rule.";

    for (const s of schedules) {
      if (s.frequency === "daily") {
        const err = validateTimeSlots(s.timeSlots, "Daily schedule");
        if (err) return err;
      } else if (s.frequency === "weekly") {
        if (s.daysOfWeek.length === 0) {
          return "Pick at least one day of the week for a weekly schedule.";
        }
        for (const d of s.daysOfWeek) {
          const err = validateTimeSlots(
            d.timeSlots,
            `Weekly on ${DAY_NAMES[d.day]}`
          );
          if (err) return err;
        }
      } else if (s.frequency === "monthly") {
        if (s.daysOfMonth.length === 0) {
          return "Pick at least one day of the month for a monthly schedule.";
        }
        for (const d of s.daysOfMonth) {
          const err = validateTimeSlots(d.timeSlots, `Monthly on day ${d.day}`);
          if (err) return err;
        }
      } else if (s.frequency === "none") {
        if (
          s.specificDates.length === 0 ||
          s.specificDates.some((d) => !d.date)
        ) {
          return "Add at least one specific date, and fill in every date field.";
        }
        for (const d of s.specificDates) {
          const label = d.date
            ? new Date(d.date + "T00:00:00").toLocaleDateString()
            : "date";
          const err = validateTimeSlots(d.timeSlots, `On ${label}`);
          if (err) return err;
        }
      }

      if (s.startDate && s.endDate && s.endDate < s.startDate) {
        return "A schedule's end date can't be before its start date.";
      }
    }
    return null;
  };

  /** Build payload matching backend evaluateClassStatus shape */
  const buildSchedulePayload = (schedules: ScheduleItem[]) =>
    schedules.map((s) => {
      const base: Record<string, unknown> = {
        frequency: s.frequency,
        ...(s.startDate ? { startDate: s.startDate } : {}),
        ...(s.endDate ? { endDate: s.endDate } : {}),
      };

      if (s.frequency === "daily") {
        return {
          ...base,
          timeSlots: s.timeSlots,
          daysOfWeek: [],
          daysOfMonth: [],
          specificDates: [],
        };
      }

      if (s.frequency === "weekly") {
        return {
          ...base,
          timeSlots: [], // per-day slots live on daysOfWeek entries
          daysOfWeek: s.daysOfWeek.map((d) => ({
            day: d.day,
            timeSlots: d.timeSlots,
          })),
          daysOfMonth: [],
          specificDates: [],
        };
      }

      if (s.frequency === "monthly") {
        return {
          ...base,
          timeSlots: [],
          daysOfWeek: [],
          daysOfMonth: s.daysOfMonth.map((d) => ({
            day: d.day,
            timeSlots: d.timeSlots,
          })),
          specificDates: [],
        };
      }

      // frequency === "none"
      return {
        ...base,
        timeSlots: [],
        daysOfWeek: [],
        daysOfMonth: [],
        specificDates: s.specificDates.map((d) => ({
          date: d.date,
          timeSlots: d.timeSlots,
        })),
      };
    });

  const handleSaveClass = async (e: FormEvent) => {
    e.preventDefault();
    setClassSubmitted(true);
    setClassFormError(null);

    if (!classForm.title.trim()) {
      setClassFormError("Class title is required.");
      return;
    }

    const scheduleError = validateSchedules(classForm.schedules);
    if (scheduleError) {
      setClassFormError(scheduleError);
      return;
    }

    setClassSaving(true);
    const payload = {
      title: classForm.title.trim(),
      schedules: buildSchedulePayload(classForm.schedules),
    };

    try {
      if (editingClass) {
        const result = await dispatch(
          updateClass({ id: editingClass._id, data: payload })
        ).unwrap();
        setClasses((prev) =>
          prev.map((c) => (c._id === result._id ? result : c))
        );
        toast.success("Class updated!");
        closeEditClass();
      } else {
        const result = await dispatch(
          createClass({ ...payload, subjectId: id })
        ).unwrap();
        setClasses((prev) => [...prev, result]);
        toast.success("Class created!");
        closeAddClass();
      }
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setClassSaving(false);
    }
  };

  const openDeleteClass = (classId: string) => {
    setDeleteClassId(classId);
    setIsDeleteClassOpen(true);
  };
  const closeDeleteClass = () => {
    setDeleteClassId(null);
    setIsDeleteClassOpen(false);
  };
  const confirmDeleteClass = async () => {
    if (!deleteClassId) return;
    setDeletingClass(true);
    try {
      await dispatch(deleteClass(deleteClassId)).unwrap();
      setClasses((prev) => prev.filter((c) => c._id !== deleteClassId));
      toast.success("Class deleted");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingClass(false);
      closeDeleteClass();
    }
  };

  /* ---------------- Resources (unchanged) ---------------- */

  const openAddResource = () => {
    setResourceForm({ title: "", description: "" });
    setResourceSubmitted(false);
    setIsAddResourceOpen(true);
  };
  const closeAddResource = () => setIsAddResourceOpen(false);

  const openEditResource = (res: any) => {
    setEditingResource(res);
    setResourceForm({ title: res.title, description: res.description || "" });
    setResourceSubmitted(false);
    setIsEditResourceOpen(true);
  };
  const closeEditResource = () => {
    setEditingResource(null);
    setIsEditResourceOpen(false);
  };

  const handleResourceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setResourceForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveResource = async (e: FormEvent) => {
    e.preventDefault();
    setResourceSubmitted(true);
    if (!resourceForm.title) return;
    setResourceSaving(true);
    const payload = {
      type: activeTab,
      subjectId: id!,
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || undefined,
    };
    try {
      if (editingResource) {
        const result = await dispatch(
          updateResource({ ...payload, _id: editingResource._id })
        ).unwrap();
        setResources((prev) =>
          prev.map((r) => (r._id === result._id ? result : r))
        );
        toast.success("Updated!");
        closeEditResource();
      } else {
        const result = await dispatch(addResource(payload)).unwrap();
        setResources((prev) => [result, ...prev]);
        toast.success("Created!");
        closeAddResource();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setResourceSaving(false);
    }
  };

  const openDeleteResource = (resId: string) => {
    setDeleteResourceId(resId);
    setIsDeleteResourceOpen(true);
  };
  const closeDeleteResource = () => {
    setDeleteResourceId(null);
    setIsDeleteResourceOpen(false);
  };
  const confirmDeleteResource = async () => {
    if (!deleteResourceId) return;
    setDeletingResource(true);
    try {
      await dispatch(
        deleteResource({ type: activeTab, _id: deleteResourceId })
      ).unwrap();
      setResources((prev) => prev.filter((r) => r._id !== deleteResourceId));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingResource(false);
      closeDeleteResource();
    }
  };

  const type = getUserType();
  const canManage = type === "admin" || type === "teacher";
  const gradeTitle = subject?.gradeLevel?.[0]?.title ?? "—";
  const isActive = subject?.isActive;

  return (
    <div className="min-h-screen bg-[#f6f8f6] p-4 md:p-6 lg:p-8 pb-28 lg:pb-8">
      {/* Loading Overlay */}
      <AnimatePresence>
        {(subjectLoading || classesLoading || resourcesLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
            <p className="text-emerald-800 font-medium text-sm tracking-wide">
              Loading subject...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 transition-colors mb-6 font-medium group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to list
        </button>

        {/* Errors */}
        <AnimatePresence>
          {(subjectError || classesError || resourcesError) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-red-700 font-medium">
                <AlertCircle size={20} />
                <p>{subjectError || classesError || resourcesError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject Header */}
        {!subjectError && subject && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-900 rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden text-white mb-6"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400/10 rounded-full -mr-24 -mt-24 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className="px-3.5 py-1.5 bg-yellow-400 text-emerald-950 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    {subject.code}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                      isActive
                        ? "bg-emerald-800/60 text-emerald-200 border-emerald-700"
                        : "bg-red-900/40 text-red-200 border-red-800"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 leading-tight">
                  {subject.name}
                </h1>
                <p className="text-emerald-100/80 font-normal max-w-2xl leading-relaxed text-base">
                  {subject.description || "No course overview provided."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatCard
                  icon={<GraduationCap size={18} />}
                  label="Grade"
                  value={gradeTitle}
                />
                <StatCard
                  icon={<Users size={18} />}
                  label="Staff"
                  value={String(subject.teachers?.length || 0)}
                />
                <StatCard
                  icon={<Users size={18} />}
                  label="Students"
                  value={String(subject.children?.length || 0)}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 pt-6 border-t border-white/10 text-emerald-200/60 text-xs font-medium uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                Created {new Date(subject.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                Updated {new Date(subject.updatedAt).toLocaleDateString()}
              </div>
              {type === "admin" && (
                <button
                  onClick={() => setIsDeleteSubjectOpen(true)}
                  className="ml-auto text-red-300 hover:text-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Delete subject
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ========== DESKTOP LAYOUT (lg and up) ========== */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Classes Section */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
                    <Clock size={20} />
                  </div>
                  Class Sessions
                  <span className="text-emerald-400 font-semibold text-base">
                    ({classes.length})
                  </span>
                </h2>
                {canManage && (
                  <button
                    onClick={openAddClass}
                    className="bg-emerald-900 text-yellow-400 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wide flex items-center gap-2 hover:bg-emerald-800 transition-colors"
                  >
                    <Plus size={16} />
                    New Session
                  </button>
                )}
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={40} />}
                  message="No classes scheduled for this subject yet."
                />
              ) : (
                <div className="space-y-2.5">
                  {classes.map((cls) => (
                    <ClassCard
                      key={cls._id}
                      cls={cls}
                      subjectName={subject?.name}
                      canManage={canManage}
                      onOpen={() =>
                        navigate(
                          `/webrtc/${cls._id}/${encodeURIComponent(
                            cls.title
                          )}/${encodeURIComponent(subject?.name || "")}`
                        )
                      }
                      onEdit={() => openEditClass(cls)}
                      onDelete={() => openDeleteClass(cls._id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Resources Section */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
                    <ClipboardList size={20} />
                  </div>
                  Academic Portal
                </h2>

                <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-100 overflow-x-auto">
                  {(
                    ["assignment", "note", "announcement"] as ResourceType[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors whitespace-nowrap ${
                        activeTab === t
                          ? "bg-emerald-900 text-yellow-400"
                          : "text-emerald-700/70 hover:text-emerald-900"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {canManage && (
                <button
                  onClick={openAddResource}
                  className="w-full mb-5 py-3.5 border border-dashed border-emerald-200 rounded-xl text-emerald-700/60 font-medium text-sm hover:border-yellow-400 hover:text-emerald-900 hover:bg-yellow-50/40 transition-colors flex items-center justify-center gap-2 group"
                >
                  <Plus
                    size={16}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  Add new {activeTab}
                </button>
              )}

              {resources.length === 0 ? (
                <EmptyState
                  icon={<FileText size={36} />}
                  message={`No ${activeTab}s yet.`}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resources.map((res) => {
                    const Icon = resourceIcons[activeTab];
                    return (
                      <motion.div
                        key={res._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group relative flex flex-col p-4 rounded-2xl border border-emerald-100 bg-white hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-yellow-400 group-hover:border-yellow-400 group-hover:text-emerald-950 transition-colors shrink-0">
                            <Icon size={18} />
                          </div>

                          <span className="text-[11px] text-emerald-600/70 font-medium">
                            {new Date(res.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-semibold text-emerald-950 text-base leading-snug mb-1.5 line-clamp-1">
                          {res.title}
                        </h4>
                        <p className="text-sm text-emerald-700/70 leading-relaxed line-clamp-2 mb-4 flex-1">
                          {res.description || "No details provided."}
                        </p>

                        {canManage && (
                          <div className="flex items-center gap-1 pt-3 border-t border-emerald-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditResource(res)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                            >
                              <Edit2 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteResource(res._id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            {/* Curriculum Stats */}
            <aside className="bg-emerald-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-400/5 rounded-full -mb-16 -mr-16 pointer-events-none" />
              <h3 className="text-lg font-bold mb-8 text-yellow-400 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full" />
                Curriculum Stats
              </h3>

              <div className="space-y-6">
                <SideStat
                  label="Total Students"
                  value={String(subject?.children?.length || 0)}
                  icon={<Users size={15} />}
                />
                <SideStat
                  label="Teachers"
                  value={String(subject?.teachers?.length || 0)}
                  icon={<GraduationCap size={15} />}
                />
                <SideStat
                  label="Subject Code"
                  value={subject?.code || "N/A"}
                  icon={<ToggleLeft size={15} />}
                  mono
                />

                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1.5">
                    Status
                  </p>
                  <p className="text-xl font-bold text-emerald-50">
                    {isActive ? "Active Course" : "On Hold"}
                  </p>
                </div>
              </div>
            </aside>

            {/* Teachers */}
            <aside className="bg-white rounded-3xl p-6 border border-emerald-100">
              <h3 className="text-base font-bold text-emerald-950 mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <GraduationCap size={16} />
                </div>
                Teachers
                <span className="text-emerald-400 text-sm ml-auto font-semibold">
                  ({subject?.teachers?.length || 0})
                </span>
              </h3>

              {!subject?.teachers || subject.teachers.length === 0 ? (
                <p className="text-emerald-700/40 text-sm">
                  No teachers assigned yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {subject.teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="flex items-start gap-3 p-3.5 bg-[#f9fbf9] rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-900 text-yellow-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacher.firstName?.[0]}
                        {teacher.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-emerald-950 text-sm truncate">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-emerald-700/60 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail size={11} />
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Enrolled Students */}
            <aside className="bg-white rounded-3xl p-6 border border-emerald-100">
              <h3 className="text-base font-bold text-emerald-950 mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <Users size={16} />
                </div>
                Enrolled Students
                <span className="text-emerald-400 text-sm ml-auto font-semibold">
                  ({subject?.children?.length || 0})
                </span>
              </h3>

              {!subject?.children || subject.children.length === 0 ? (
                <p className="text-emerald-700/40 text-sm">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {subject.children.map((student) => (
                    <div
                      key={student._id}
                      className="p-3.5 bg-[#f9fbf9] rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-emerald-950 text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.email && (
                            <p className="text-emerald-700/60 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                              <Mail size={11} />
                              {student.email}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {student.isSubscribed !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                                  student.isSubscribed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {student.isSubscribed ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <XCircle size={10} />
                                )}
                                {student.isSubscribed
                                  ? "Subscribed"
                                  : "Not subscribed"}
                              </span>
                            )}
                            {student.subjects && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-yellow-50 text-emerald-900">
                                <BookOpen size={10} />
                                {student.subjects.length} subject
                                {student.subjects.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Quick Upload */}
            <div className="bg-yellow-400 rounded-3xl p-7 text-emerald-950">
              <div className="p-3 bg-emerald-950 rounded-xl text-yellow-400 w-fit mb-5">
                <Megaphone size={20} />
              </div>
              <h4 className="font-bold text-xl mb-2 tracking-tight">
                Staff Broadcast
              </h4>
              <p className="text-emerald-900/70 text-sm leading-relaxed mb-6">
                Need to update the curriculum? Add announcements or lecture
                notes to keep your students informed.
              </p>
              {canManage && (
                <button
                  onClick={openAddResource}
                  className="w-full bg-emerald-950 text-yellow-400 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-emerald-900 transition-colors"
                >
                  Quick Upload
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========== MOBILE CONTENT (below lg) ========== */}
        <div className="lg:hidden space-y-5 mt-2">
          {/* CLASSES TAB */}
          {mobileTab === "classes" && (
            <section className="bg-white rounded-3xl p-5 border border-emerald-100">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                    <Clock size={18} />
                  </div>
                  Class Sessions
                  <span className="text-emerald-400 font-semibold text-sm">
                    ({classes.length})
                  </span>
                </h2>
                {canManage && (
                  <button
                    onClick={openAddClass}
                    className="bg-emerald-900 text-yellow-400 px-4 py-2 rounded-xl font-semibold text-[11px] uppercase tracking-wide flex items-center gap-1.5 hover:bg-emerald-800 transition-colors"
                  >
                    <Plus size={14} />
                    New
                  </button>
                )}
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={36} />}
                  message="No classes scheduled for this subject yet."
                />
              ) : (
                <div className="space-y-2.5">
                  {classes.map((cls) => (
                    <ClassCard
                      key={cls._id}
                      cls={cls}
                      subjectName={subject?.name}
                      canManage={canManage}
                      compact
                      onOpen={() =>
                        navigate(
                          `/webrtc/${cls._id}/${encodeURIComponent(
                            cls.title
                          )}/${encodeURIComponent(subject?.name || "")}`
                        )
                      }
                      onEdit={() => openEditClass(cls)}
                      onDelete={() => openDeleteClass(cls._id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ASSIGNMENTS TAB (Resources) */}
          {mobileTab === "assignments" && (
            <section className="bg-white rounded-3xl p-5 border border-emerald-100">
              <div className="flex flex-col gap-4 mb-5">
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                    <ClipboardList size={18} />
                  </div>
                  Academic Portal
                </h2>

                <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-100 overflow-x-auto">
                  {(
                    ["assignment", "note", "announcement"] as ResourceType[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors whitespace-nowrap ${
                        activeTab === t
                          ? "bg-emerald-900 text-yellow-400"
                          : "text-emerald-700/70 hover:text-emerald-900"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {canManage && (
                <button
                  onClick={openAddResource}
                  className="w-full mb-4 py-3 border border-dashed border-emerald-200 rounded-xl text-emerald-700/60 font-medium text-sm hover:border-yellow-400 hover:text-emerald-900 hover:bg-yellow-50/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  Add new {activeTab}
                </button>
              )}

              {resources.length === 0 ? (
                <EmptyState
                  icon={<FileText size={32} />}
                  message={`No ${activeTab}s yet.`}
                />
              ) : (
                <div className="space-y-3">
                  {resources.map((res) => {
                    const Icon = resourceIcons[activeTab];
                    return (
                      <motion.div
                        key={res._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group relative flex flex-col p-4 rounded-2xl border border-emerald-100 bg-white"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <Icon size={16} />
                          </div>
                          <span className="text-[10px] text-emerald-600/70 font-medium">
                            {new Date(res.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-semibold text-emerald-950 text-sm leading-snug mb-1">
                          {res.title}
                        </h4>
                        <p className="text-xs text-emerald-700/70 leading-relaxed line-clamp-2 mb-3">
                          {res.description || "No details provided."}
                        </p>

                        {canManage && (
                          <div className="flex items-center gap-1 pt-2.5 border-t border-emerald-50">
                            <button
                              onClick={() => openEditResource(res)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Edit2 size={12} />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteResource(res._id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />
                              Remove
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TEACHERS TAB */}
          {mobileTab === "teachers" && (
            <aside className="bg-white rounded-3xl p-5 border border-emerald-100">
              <h3 className="text-base font-bold text-emerald-950 mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <GraduationCap size={16} />
                </div>
                Teachers
                <span className="text-emerald-400 text-sm ml-auto font-semibold">
                  ({subject?.teachers?.length || 0})
                </span>
              </h3>

              {!subject?.teachers || subject.teachers.length === 0 ? (
                <p className="text-emerald-700/40 text-sm py-8 text-center">
                  No teachers assigned yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {subject.teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="flex items-start gap-3 p-3.5 bg-[#f9fbf9] rounded-xl border border-emerald-100"
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-900 text-yellow-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacher.firstName?.[0]}
                        {teacher.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-emerald-950 text-sm">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-emerald-700/60 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail size={11} />
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}

          {/* STUDENTS TAB */}
          {mobileTab === "students" && (
            <aside className="bg-white rounded-3xl p-5 border border-emerald-100">
              <h3 className="text-base font-bold text-emerald-950 mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <Users size={16} />
                </div>
                Enrolled Students
                <span className="text-emerald-400 text-sm ml-auto font-semibold">
                  ({subject?.children?.length || 0})
                </span>
              </h3>

              {!subject?.children || subject.children.length === 0 ? (
                <p className="text-emerald-700/40 text-sm py-8 text-center">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {subject.children.map((student) => (
                    <div
                      key={student._id}
                      className="p-3.5 bg-[#f9fbf9] rounded-xl border border-emerald-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-emerald-950 text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.email && (
                            <p className="text-emerald-700/60 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                              <Mail size={11} />
                              {student.email}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {student.isSubscribed !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                                  student.isSubscribed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {student.isSubscribed ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <XCircle size={10} />
                                )}
                                {student.isSubscribed
                                  ? "Subscribed"
                                  : "Not subscribed"}
                              </span>
                            )}
                            {student.subjects && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-yellow-50 text-emerald-900">
                                <BookOpen size={10} />
                                {student.subjects.length} subject
                                {student.subjects.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      {/* ========== MOBILE BOTTOM NAV BAR ========== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-emerald-100 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {(
            [
              { key: "classes", label: "Classes", icon: Clock },
              { key: "assignments", label: "Assignments", icon: ClipboardList },
              { key: "teachers", label: "Teachers", icon: GraduationCap },
              { key: "students", label: "Students", icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActiveTab = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActiveTab
                    ? "text-emerald-900"
                    : "text-emerald-600/60 hover:text-emerald-800"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActiveTab ? "bg-emerald-100" : ""
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActiveTab ? 2.4 : 1.8}
                    className={isActiveTab ? "text-emerald-900" : ""}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isActiveTab ? "text-emerald-900" : "text-emerald-600/70"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODALS */}
      <AnimatePresence>
        {/* Delete Subject */}
        {isDeleteSubjectOpen && (
          <Modal onClose={closeDeleteSubject}>
            <div className="text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-3">
                Delete subject?
              </h3>
              <p className="text-emerald-800/70 text-sm mb-8 leading-relaxed">
                This will{" "}
                <strong className="text-red-600">permanently erase</strong> the
                subject and all associated resources. This action cannot be
                reversed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-semibold uppercase tracking-wide text-xs flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingSubject ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Confirm Delete
                </button>
                <button
                  onClick={closeDeleteSubject}
                  disabled={deletingSubject}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-3.5 rounded-xl font-semibold uppercase tracking-wide text-xs hover:bg-emerald-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add / Edit Class — full recurring schedule builder */}
        {(isAddClassOpen || isEditClassOpen) && (
          <Modal onClose={isAddClassOpen ? closeAddClass : closeEditClass}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-950">
                {isEditClassOpen ? "Edit Session" : "Schedule Class"}
              </h2>
              <button
                onClick={isAddClassOpen ? closeAddClass : closeEditClass}
                className="text-emerald-400 hover:text-emerald-900 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSaveClass}
              className="space-y-6 max-h-[70vh] overflow-y-auto pr-1"
            >
              <InputGroup
                label="Class Title"
                name="title"
                value={classForm.title}
                onChange={handleClassTitleChange}
                required
                placeholder="e.g. Advanced Vector Math"
              />

              {classSubmitted && classFormError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl p-3">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {classFormError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/60">
                  Schedule Rules
                </label>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
                >
                  <Plus size={14} />
                  Add rule
                </button>
              </div>

              {classForm.schedules.map((schedule, index) => (
                <ScheduleEditor
                  key={index}
                  schedule={schedule}
                  index={index}
                  canRemove={classForm.schedules.length > 1}
                  onRemove={() => removeSchedule(index)}
                  onFrequencyChange={(f) => setScheduleFrequency(index, f)}
                  onToggleDayOfWeek={(d) => toggleDayOfWeek(index, d)}
                  onChangeDayOfWeekTimeSlot={(day, slotIdx, field, val) =>
                    changeDayOfWeekTimeSlot(index, day, slotIdx, field, val)
                  }
                  onAddDayOfWeekTimeSlot={(day) =>
                    addDayOfWeekTimeSlot(index, day)
                  }
                  onRemoveDayOfWeekTimeSlot={(day, slotIdx) =>
                    removeDayOfWeekTimeSlot(index, day, slotIdx)
                  }
                  onToggleDayOfMonth={(d) => toggleDayOfMonth(index, d)}
                  onChangeDayOfMonthTimeSlot={(day, slotIdx, field, val) =>
                    changeDayOfMonthTimeSlot(index, day, slotIdx, field, val)
                  }
                  onAddDayOfMonthTimeSlot={(day) =>
                    addDayOfMonthTimeSlot(index, day)
                  }
                  onRemoveDayOfMonthTimeSlot={(day, slotIdx) =>
                    removeDayOfMonthTimeSlot(index, day, slotIdx)
                  }
                  onAddSpecificDate={() => addSpecificDate(index)}
                  onChangeSpecificDateValue={(dateIdx, val) =>
                    changeSpecificDateValue(index, dateIdx, val)
                  }
                  onRemoveSpecificDate={(dateIdx) =>
                    removeSpecificDate(index, dateIdx)
                  }
                  onChangeSpecificDateTimeSlot={(
                    dateIdx,
                    slotIdx,
                    field,
                    val
                  ) =>
                    changeSpecificDateTimeSlot(
                      index,
                      dateIdx,
                      slotIdx,
                      field,
                      val
                    )
                  }
                  onAddSpecificDateTimeSlot={(dateIdx) =>
                    addSpecificDateTimeSlot(index, dateIdx)
                  }
                  onRemoveSpecificDateTimeSlot={(dateIdx, slotIdx) =>
                    removeSpecificDateTimeSlot(index, dateIdx, slotIdx)
                  }
                  onAddTimeSlot={() => addTimeSlot(index)}
                  onChangeTimeSlot={(slotIdx, field, val) =>
                    changeTimeSlot(index, slotIdx, field, val)
                  }
                  onRemoveTimeSlot={(slotIdx) => removeTimeSlot(index, slotIdx)}
                  onChangeDate={(field, val) =>
                    changeScheduleDate(index, field, val)
                  }
                />
              ))}

              <button
                type="submit"
                disabled={classSaving}
                className="w-full bg-emerald-900 text-yellow-400 py-4 rounded-xl font-semibold uppercase tracking-wide text-xs flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:opacity-60 transition-colors mt-2 sticky bottom-0"
              >
                {classSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                {isEditClassOpen ? "Update Schedule" : "Confirm Schedule"}
              </button>
            </form>
          </Modal>
        )}

        {/* Add / Edit Resource */}
        {(isAddResourceOpen || isEditResourceOpen) && (
          <Modal
            onClose={isAddResourceOpen ? closeAddResource : closeEditResource}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-emerald-950 capitalize">
                {isEditResourceOpen ? "Update" : "Add"} {activeTab}
              </h2>
              <button
                onClick={
                  isAddResourceOpen ? closeAddResource : closeEditResource
                }
                className="text-emerald-400 hover:text-emerald-900 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-5">
              <InputGroup
                label="Resource Title"
                name="title"
                value={resourceForm.title}
                onChange={handleResourceChange}
                required
                placeholder="e.g. Lecture Notes #04"
              />
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/60 ml-0.5">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={resourceForm.description}
                  onChange={handleResourceChange}
                  rows={4}
                  className="w-full bg-emerald-50 border border-emerald-100 focus:border-yellow-400 rounded-xl p-4 font-medium outline-none transition-colors placeholder:text-emerald-900/25 resize-none"
                  placeholder="Provide context or instructions..."
                />
              </div>
              <button
                type="submit"
                disabled={resourceSaving}
                className="w-full bg-emerald-950 text-yellow-400 py-4 rounded-xl font-semibold uppercase tracking-wide text-xs flex items-center justify-center gap-2 hover:bg-emerald-900 disabled:opacity-60 transition-colors mt-2"
              >
                {resourceSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                {isEditResourceOpen ? "Save Changes" : `Post ${activeTab}`}
              </button>
            </form>
          </Modal>
        )}

        {/* Delete Class */}
        {isDeleteClassOpen && (
          <Modal onClose={closeDeleteClass}>
            <div className="text-center">
              <div className="h-14 w-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-2">
                Remove session?
              </h3>
              <p className="text-emerald-800/70 text-sm mb-8">
                This will remove this class (and all of its recurring schedule
                rules) from the student calendar.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteClass}
                  disabled={deletingClass}
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-semibold uppercase text-xs disabled:opacity-50 hover:bg-red-700 transition-colors"
                >
                  {deletingClass ? (
                    <Loader2 className="animate-spin mx-auto" size={16} />
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
                <button
                  onClick={closeDeleteClass}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-3.5 rounded-xl font-semibold uppercase text-xs hover:bg-emerald-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Resource */}
        {isDeleteResourceOpen && (
          <Modal onClose={closeDeleteResource}>
            <div className="text-center">
              <div className="h-14 w-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <Trash2 size={26} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-2 capitalize">
                Delete {activeTab}?
              </h3>
              <p className="text-emerald-800/70 text-sm mb-8">
                Once deleted, students can no longer access this item.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteResource}
                  disabled={deletingResource}
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-semibold uppercase text-xs hover:bg-red-700 transition-colors"
                >
                  {deletingResource ? (
                    <Loader2 className="animate-spin mx-auto" size={16} />
                  ) : (
                    "Delete Now"
                  )}
                </button>
                <button
                  onClick={closeDeleteResource}
                  className="flex-1 bg-emerald-50 text-emerald-950 py-3.5 rounded-xl font-semibold uppercase text-xs hover:bg-emerald-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Sub-components ---------- */

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-white/10 border border-white/10 p-4 rounded-2xl min-w-[120px]">
    <div className="flex items-center gap-1.5 text-yellow-400 mb-1.5 font-semibold text-[10px] uppercase tracking-wider opacity-90">
      {icon}
      {label}
    </div>
    <div className="text-xl font-bold tracking-tight">{value}</div>
  </div>
);

const SideStat = ({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
}) => (
  <div>
    <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p
      className={
        mono
          ? "font-mono text-yellow-400 bg-emerald-900/50 px-3 py-2 rounded-lg inline-block text-sm border border-white/5"
          : "text-2xl font-bold text-emerald-50"
      }
    >
      {value}
    </p>
  </div>
);

const EmptyState = ({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) => (
  <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-2xl text-center px-6">
    <div className="text-emerald-200 mb-4">{icon}</div>
    <p className="text-emerald-700/40 font-medium max-w-[220px] leading-relaxed text-sm">
      {message}
    </p>
  </div>
);

const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.96, y: 12 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.96, y: 12 }}
      className="bg-white rounded-3xl p-7 md:p-9 w-full max-w-lg relative"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

const InputGroup = ({
  label,
  ...props
}: {
  label: string;
  [key: string]: any;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/60 ml-0.5">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-emerald-50 border border-emerald-100 focus:border-yellow-400 rounded-xl p-3.5 font-medium outline-none transition-colors placeholder:text-emerald-900/25 text-emerald-950"
    />
  </div>
);

/* ---------- Class card (used in both desktop + mobile lists) ---------- */

const ClassCard = ({
  cls,
  canManage,
  compact,
  onOpen,
  onEdit,
  onDelete,
}: {
  cls: any;
  subjectName?: string;
  canManage: boolean;
  compact?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const status: string = cls.status || "upcoming";
  const isRecurring =
    Array.isArray(cls.schedules) &&
    cls.schedules.some((s: any) => s.frequency && s.frequency !== "none");

  return (
    <motion.div
      layout
      onClick={onOpen}
      className={`group relative flex flex-col ${
        compact ? "gap-3" : "sm:flex-row sm:items-center justify-between gap-4"
      } p-4 rounded-2xl border border-emerald-100 bg-white hover:border-emerald-300 transition-colors cursor-pointer`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-yellow-400 group-hover:border-yellow-400 group-hover:text-emerald-950 transition-colors shrink-0">
          {isRecurring ? <Repeat size={18} /> : <Calendar size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-emerald-950 text-base leading-snug truncate">
              {cls.title}
            </h4>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                statusStyles[status] || statusStyles.upcoming
              }`}
            >
              {status}
            </span>
          </div>

          <p className="mt-1.5 text-[12px] text-emerald-700/80 leading-relaxed">
            {summarizeSchedules(cls.schedules)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-emerald-700/80">
   
            <span className="inline-flex items-center gap-1.5">
              <Users size={12} className="opacity-60" />
              {cls.studentCount ?? cls.studentIds?.length ?? 0} student
              {(cls.studentCount ?? cls.studentIds?.length ?? 0) !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>
      </div>

      {canManage && (
        <div
          className={`flex items-center gap-1.5 ${
            compact
              ? "pt-2 border-t border-emerald-50"
              : "self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className={
              compact
                ? "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                : "p-2.5 rounded-xl text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            }
            title="Edit"
          >
            <Edit2 size={compact ? 13 : 15} />
            {compact && "Edit"}
          </button>
          <button
            onClick={onDelete}
            className={
              compact
                ? "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                : "p-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            }
            title="Delete"
          >
            <Trash2 size={compact ? 13 : 15} />
            {compact && "Delete"}
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ---------- Shared time-slot row editor ---------- */

const TimeSlotRows = ({
  slots,
  onChange,
  onAdd,
  onRemove,
}: {
  slots: TimeSlot[];
  onChange: (slotIdx: number, field: keyof TimeSlot, value: string) => void;
  onAdd: () => void;
  onRemove: (slotIdx: number) => void;
}) => (
  <div className="space-y-2">
    {slots.map((slot, slotIdx) => (
      <div key={slotIdx} className="flex items-center gap-2">
        <input
          type="time"
          value={slot.startTime}
          onChange={(e) => onChange(slotIdx, "startTime", e.target.value)}
          className="flex-1 bg-white border border-emerald-100 focus:border-yellow-400 rounded-lg p-2.5 text-sm outline-none transition-colors text-emerald-950"
        />
        <span className="text-emerald-700/50 text-xs font-semibold">to</span>
        <input
          type="time"
          value={slot.endTime}
          onChange={(e) => onChange(slotIdx, "endTime", e.target.value)}
          className="flex-1 bg-white border border-emerald-100 focus:border-yellow-400 rounded-lg p-2.5 text-sm outline-none transition-colors text-emerald-950"
        />
        {slots.length > 1 && (
          <button
            type="button"
            onClick={() => onRemove(slotIdx)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold flex items-center gap-1"
    >
      <Plus size={12} />
      Add time slot
    </button>
  </div>
);

/* ---------- Recurring schedule rule editor ---------- */

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "none", label: "Specific dates" },
];

const ScheduleEditor = ({
  schedule,
  index,
  canRemove,
  onRemove,
  onFrequencyChange,
  onToggleDayOfWeek,
  onChangeDayOfWeekTimeSlot,
  onAddDayOfWeekTimeSlot,
  onRemoveDayOfWeekTimeSlot,
  onToggleDayOfMonth,
  onChangeDayOfMonthTimeSlot,
  onAddDayOfMonthTimeSlot,
  onRemoveDayOfMonthTimeSlot,
  onAddSpecificDate,
  onChangeSpecificDateValue,
  onRemoveSpecificDate,
  onChangeSpecificDateTimeSlot,
  onAddSpecificDateTimeSlot,
  onRemoveSpecificDateTimeSlot,
  onAddTimeSlot,
  onChangeTimeSlot,
  onRemoveTimeSlot,
  onChangeDate,
}: {
  schedule: ScheduleItem;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onFrequencyChange: (f: Frequency) => void;
  onToggleDayOfWeek: (d: number) => void;
  onChangeDayOfWeekTimeSlot: (
    day: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => void;
  onAddDayOfWeekTimeSlot: (day: number) => void;
  onRemoveDayOfWeekTimeSlot: (day: number, slotIdx: number) => void;
  onToggleDayOfMonth: (d: number) => void;
  onChangeDayOfMonthTimeSlot: (
    day: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => void;
  onAddDayOfMonthTimeSlot: (day: number) => void;
  onRemoveDayOfMonthTimeSlot: (day: number, slotIdx: number) => void;
  onAddSpecificDate: () => void;
  onChangeSpecificDateValue: (dateIdx: number, value: string) => void;
  onRemoveSpecificDate: (dateIdx: number) => void;
  onChangeSpecificDateTimeSlot: (
    dateIdx: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => void;
  onAddSpecificDateTimeSlot: (dateIdx: number) => void;
  onRemoveSpecificDateTimeSlot: (dateIdx: number, slotIdx: number) => void;
  onAddTimeSlot: () => void;
  onChangeTimeSlot: (
    slotIdx: number,
    field: keyof TimeSlot,
    value: string
  ) => void;
  onRemoveTimeSlot: (slotIdx: number) => void;
  onChangeDate: (field: "startDate" | "endDate", value: string) => void;
}) => {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-[#f9fbf9] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700/70">
          Rule {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Remove this rule"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Frequency selector */}
      <div className="flex bg-white p-1 rounded-xl border border-emerald-100 overflow-x-auto">
        {FREQUENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFrequencyChange(opt.value)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
              schedule.frequency === opt.value
                ? "bg-emerald-900 text-yellow-400"
                : "text-emerald-700/70 hover:text-emerald-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Daily: shared time slots */}
      {schedule.frequency === "daily" && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60 mb-2 block">
            Time slot(s) — every day
          </label>
          <TimeSlotRows
            slots={schedule.timeSlots}
            onChange={onChangeTimeSlot}
            onAdd={onAddTimeSlot}
            onRemove={onRemoveTimeSlot}
          />
        </div>
      )}

      {/* Weekly: days of week, each with own time slots */}
      {schedule.frequency === "weekly" && (
        <div className="space-y-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60 block">
            Repeats on
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_NAMES.map((day, d) => {
              const active = schedule.daysOfWeek.some((e) => e.day === d);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDayOfWeek(d)}
                  className={`h-9 w-9 rounded-full text-[11px] font-bold transition-colors ${
                    active
                      ? "bg-emerald-900 text-yellow-400"
                      : "bg-white border border-emerald-100 text-emerald-700/70 hover:border-emerald-300"
                  }`}
                >
                  {day[0]}
                </button>
              );
            })}
          </div>

          {schedule.daysOfWeek.length > 0 && (
            <div className="space-y-3 pt-1">
              {schedule.daysOfWeek
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-xl border border-emerald-100 bg-white p-3 space-y-2"
                  >
                    <p className="text-[11px] font-bold text-emerald-900">
                      {DAY_NAMES[entry.day]}
                    </p>
                    <TimeSlotRows
                      slots={entry.timeSlots}
                      onChange={(slotIdx, field, val) =>
                        onChangeDayOfWeekTimeSlot(
                          entry.day,
                          slotIdx,
                          field,
                          val
                        )
                      }
                      onAdd={() => onAddDayOfWeekTimeSlot(entry.day)}
                      onRemove={(slotIdx) =>
                        onRemoveDayOfWeekTimeSlot(entry.day, slotIdx)
                      }
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly: days of month, each with own time slots */}
      {schedule.frequency === "monthly" && (
        <div className="space-y-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60 block">
            Repeats on day(s) of month
          </label>
          <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const active = schedule.daysOfMonth.some((e) => e.day === day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDayOfMonth(day)}
                  className={`h-8 rounded-lg text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-emerald-900 text-yellow-400"
                      : "bg-white border border-emerald-100 text-emerald-700/70 hover:border-emerald-300"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {schedule.daysOfMonth.length > 0 && (
            <div className="space-y-3 pt-1">
              {schedule.daysOfMonth
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-xl border border-emerald-100 bg-white p-3 space-y-2"
                  >
                    <p className="text-[11px] font-bold text-emerald-900">
                      Day {entry.day}
                    </p>
                    <TimeSlotRows
                      slots={entry.timeSlots}
                      onChange={(slotIdx, field, val) =>
                        onChangeDayOfMonthTimeSlot(
                          entry.day,
                          slotIdx,
                          field,
                          val
                        )
                      }
                      onAdd={() => onAddDayOfMonthTimeSlot(entry.day)}
                      onRemove={(slotIdx) =>
                        onRemoveDayOfMonthTimeSlot(entry.day, slotIdx)
                      }
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Specific dates: each date has own time slots */}
      {schedule.frequency === "none" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60">
              Specific dates
            </label>
            <button
              type="button"
              onClick={onAddSpecificDate}
              className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold flex items-center gap-1"
            >
              <Plus size={12} />
              Add date
            </button>
          </div>

          {schedule.specificDates.length === 0 && (
            <p className="text-[11px] text-emerald-700/50">
              No dates added yet.
            </p>
          )}

          <div className="space-y-3">
            {schedule.specificDates.map((entry, dateIdx) => (
              <div
                key={dateIdx}
                className="rounded-xl border border-emerald-100 bg-white p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) =>
                      onChangeSpecificDateValue(dateIdx, e.target.value)
                    }
                    className="flex-1 bg-white border border-emerald-100 focus:border-yellow-400 rounded-lg p-2.5 text-sm outline-none transition-colors text-emerald-950"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveSpecificDate(dateIdx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
                <TimeSlotRows
                  slots={entry.timeSlots}
                  onChange={(slotIdx, field, val) =>
                    onChangeSpecificDateTimeSlot(dateIdx, slotIdx, field, val)
                  }
                  onAdd={() => onAddSpecificDateTimeSlot(dateIdx)}
                  onRemove={(slotIdx) =>
                    onRemoveSpecificDateTimeSlot(dateIdx, slotIdx)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional recurrence window */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60">
            Starts (optional)
          </label>
          <input
            type="date"
            value={schedule.startDate}
            onChange={(e) => onChangeDate("startDate", e.target.value)}
            className="w-full bg-white border border-emerald-100 focus:border-yellow-400 rounded-lg p-2.5 text-sm outline-none transition-colors text-emerald-950"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/60">
            Ends (optional)
          </label>
          <input
            type="date"
            value={schedule.endDate}
            onChange={(e) => onChangeDate("endDate", e.target.value)}
            className="w-full bg-white border border-emerald-100 focus:border-yellow-400 rounded-lg p-2.5 text-sm outline-none transition-colors text-emerald-950"
          />
        </div>
      </div>
    </div>
  );
};
