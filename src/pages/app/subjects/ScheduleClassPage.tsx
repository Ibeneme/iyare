import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Loader2,
  Plus,
  X,
  Calendar,
  Repeat,
  Users,
  UserCheck,
  Search,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import DateInput from "../../../components/ui/DateInput";
import { AppDispatch } from "../../../store/index";
import { fetchSubjectById } from "../../../store/features/subjects/subjects.slice";
import {
  fetchClasses,
  fetchSubjectStudents,
  createClass,
  updateClass,
  ClassScope,
  SubjectStudentInfo,
} from "../../../store/features/classes/classes.slice";
import { PageHeader, Panel, StatusPill, Avatar } from "../../../components/ui";

/* ---------- Recurring schedule types (mirrors backend Class model) ---------- */
export type Frequency = "daily" | "weekly" | "monthly" | "none";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DayOfWeekEntry {
  day: number;
  timeSlots: TimeSlot[];
}

export interface DayOfMonthEntry {
  day: number;
  timeSlots: TimeSlot[];
}

export interface SpecificDateEntry {
  date: string;
  timeSlots: TimeSlot[];
}

export interface ScheduleItem {
  frequency: Frequency;
  timeSlots: TimeSlot[];
  daysOfWeek: DayOfWeekEntry[];
  daysOfMonth: DayOfMonthEntry[];
  specificDates: SpecificDateEntry[];
  startDate: string;
  endDate: string;
}

export interface ClassFormState {
  title: string;
  scope: ClassScope;
  selectedStudentIds: string[];
  schedules: ScheduleItem[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "none", label: "Specific dates" },
];

export const makeEmptyTimeSlot = (): TimeSlot => ({
  startTime: "09:00",
  endTime: "10:00",
});

export const makeEmptySchedule = (): ScheduleItem => ({
  frequency: "weekly",
  timeSlots: [makeEmptyTimeSlot()],
  daysOfWeek: [],
  daysOfMonth: [],
  specificDates: [],
  startDate: "",
  endDate: "",
});

export const makeEmptyClassForm = (): ClassFormState => ({
  title: "",
  scope: "general",
  selectedStudentIds: [],
  schedules: [makeEmptySchedule()],
});

const normalizeTimeSlots = (slots: any): TimeSlot[] => {
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.map((t: any) => ({
      startTime: t?.startTime || "09:00",
      endTime: t?.endTime || "10:00",
    }));
  }
  return [makeEmptyTimeSlot()];
};

export const normalizeScheduleForForm = (s: any): ScheduleItem => {
  const frequency: Frequency = s?.frequency || "weekly";
  const startDate = s?.startDate ? String(s.startDate).split("T")[0] : "";
  const endDate = s?.endDate ? String(s.endDate).split("T")[0] : "";

  let daysOfWeek: DayOfWeekEntry[] = [];
  if (Array.isArray(s?.daysOfWeek) && s.daysOfWeek.length > 0) {
    if (typeof s.daysOfWeek[0] === "object" && s.daysOfWeek[0] !== null) {
      daysOfWeek = s.daysOfWeek.map((d: any) => ({
        day: typeof d.day === "number" ? d.day : 0,
        timeSlots: normalizeTimeSlots(d.timeSlots),
      }));
    } else {
      const shared = normalizeTimeSlots(s.timeSlots);
      daysOfWeek = s.daysOfWeek.map((day: number) => ({
        day,
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

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

  let specificDates: SpecificDateEntry[] = [];
  if (Array.isArray(s?.specificDates) && s.specificDates.length > 0) {
    if (typeof s.specificDates[0] === "object" && s.specificDates[0] !== null) {
      specificDates = s.specificDates.map((d: any) => ({
        date: d.date ? String(d.date).split("T")[0] : "",
        timeSlots: normalizeTimeSlots(d.timeSlots),
      }));
    } else {
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

const formatTimeSlots = (slots: TimeSlot[] | undefined): string => {
  if (!slots || slots.length === 0) return "";
  return slots.map((t) => `${t.startTime}–${t.endTime}`).join(", ");
};

export const summarizeSchedules = (
  schedules: ScheduleItem[] | any[] | undefined,
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

const validateTimeSlots = (slots: TimeSlot[], label: string): string | null => {
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
          `Weekly on ${DAY_NAMES[d.day]}`,
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
        timeSlots: [],
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

const extractIdsFromClassStudents = (
  rawStudents: any[] | undefined,
): string[] => {
  if (!Array.isArray(rawStudents)) return [];
  return rawStudents
    .map((s) => {
      if (!s) return null;
      if (typeof s === "string") return s;
      if (typeof s === "object") return s._id || s.id || null;
      return null;
    })
    .filter(Boolean)
    .map((id) => String(id));
};

export default function ScheduleClassPage() {
  const params = useParams<{
    id?: string;
    subjectId?: string;
    classId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const subjectId =
    params.subjectId || params.id || searchParams.get("subjectId") || "";
  const classId = params.classId || searchParams.get("classId") || "";
  const isEditing = Boolean(classId);

  const [subjectName, setSubjectName] = useState<string>("");
  const [gradeTitle, setGradeTitle] = useState<string>("");
  const [subjectStudents, setSubjectStudents] = useState<SubjectStudentInfo[]>(
    [],
  );
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [existingClass, setExistingClass] = useState<any | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<ClassFormState>(makeEmptyClassForm());
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!subjectId) {
        if (active) {
          setLoadError("Missing subject ID.");
          setLoadingInitial(false);
        }
        return;
      }

      setLoadingInitial(true);
      setLoadError(null);

      try {
        const [subjectData, studentsList] = await Promise.all([
          dispatch(fetchSubjectById(subjectId)).unwrap() as Promise<any>,
          dispatch(fetchSubjectStudents(subjectId))
            .unwrap()
            .catch(() => [] as SubjectStudentInfo[]),
        ]);
        if (!active) return;

        setSubjectName(subjectData?.name || "");
        setGradeTitle(
          subjectData?.gradeLevel?.[0]?.title ||
            subjectData?.grades?.[0]?.title ||
            "",
        );

        // Merge any subject.children fallback if fetchSubjectStudents returned empty
        const mergedStudents: SubjectStudentInfo[] =
          studentsList.length > 0
            ? studentsList
            : Array.isArray(subjectData?.children)
              ? subjectData.children
              : [];
        setSubjectStudents(mergedStudents);

        if (classId) {
          const classesList: any[] = await dispatch(
            fetchClasses(subjectId),
          ).unwrap();
          if (!active) return;

          const target = classesList.find((c) => c._id === classId);
          if (!target) {
            setLoadError("Scheduled class not found.");
          } else {
            setExistingClass(target);
            const schedules =
              Array.isArray(target.schedules) && target.schedules.length > 0
                ? target.schedules.map(normalizeScheduleForForm)
                : [makeEmptySchedule()];
            const resolvedScope: ClassScope =
              target.scope === "specific" || target.isGeneral === false
                ? "specific"
                : "general";
            const preselectedIds = extractIdsFromClassStudents(
              target.studentIds,
            );

            setForm({
              title: target.title || "",
              scope: resolvedScope,
              selectedStudentIds: preselectedIds,
              schedules,
            });
          }
        }
      } catch (err: any) {
        if (active) {
          const msg = err?.message || "Failed to load schedule details.";
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoadingInitial(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [subjectId, classId, dispatch]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleScopeChange = (nextScope: ClassScope) => {
    setForm((prev) => ({
      ...prev,
      scope: nextScope,
      selectedStudentIds:
        nextScope === "specific" &&
        prev.selectedStudentIds.length === 0 &&
        subjectStudents.length === 1
          ? [subjectStudents[0]._id]
          : prev.selectedStudentIds,
    }));
  };

  const toggleStudentSelection = (studentId: string) => {
    setForm((prev) => {
      const exists = prev.selectedStudentIds.includes(studentId);
      return {
        ...prev,
        selectedStudentIds: exists
          ? prev.selectedStudentIds.filter((id) => id !== studentId)
          : [...prev.selectedStudentIds, studentId],
      };
    });
  };

  const selectAllFilteredStudents = (filtered: SubjectStudentInfo[]) => {
    const filteredIds = filtered.map((s) => s._id);
    setForm((prev) => ({
      ...prev,
      selectedStudentIds: Array.from(
        new Set([...prev.selectedStudentIds, ...filteredIds]),
      ),
    }));
  };

  const clearSelectedStudents = () => {
    setForm((prev) => ({ ...prev, selectedStudentIds: [] }));
  };

  const updateSchedule = (
    index: number,
    updater: (s: ScheduleItem) => ScheduleItem,
  ) => {
    setForm((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => (i === index ? updater(s) : s)),
    }));
  };

  const addSchedule = () => {
    setForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, makeEmptySchedule()],
    }));
  };

  const removeSchedule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const setScheduleFrequency = (index: number, frequency: Frequency) => {
    updateSchedule(index, (s) => ({ ...s, frequency }));
  };

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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, i) =>
                i === slotIdx ? { ...t, [field]: value } : t,
              ),
            }
          : d,
      ),
    }));
  };

  const addDayOfWeekTimeSlot = (index: number, day: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d,
      ),
    }));
  };

  const removeDayOfWeekTimeSlot = (
    index: number,
    day: number,
    slotIdx: number,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, i) => i !== slotIdx),
            }
          : d,
      ),
    }));
  };

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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, i) =>
                i === slotIdx ? { ...t, [field]: value } : t,
              ),
            }
          : d,
      ),
    }));
  };

  const addDayOfMonthTimeSlot = (index: number, day: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d,
      ),
    }));
  };

  const removeDayOfMonthTimeSlot = (
    index: number,
    day: number,
    slotIdx: number,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      daysOfMonth: s.daysOfMonth.map((d) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, i) => i !== slotIdx),
            }
          : d,
      ),
    }));
  };

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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx ? { ...d, date: value } : d,
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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? {
              ...d,
              timeSlots: d.timeSlots.map((t, j) =>
                j === slotIdx ? { ...t, [field]: value } : t,
              ),
            }
          : d,
      ),
    }));
  };

  const addSpecificDateTimeSlot = (index: number, dateIdx: number) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? { ...d, timeSlots: [...d.timeSlots, makeEmptyTimeSlot()] }
          : d,
      ),
    }));
  };

  const removeSpecificDateTimeSlot = (
    index: number,
    dateIdx: number,
    slotIdx: number,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      specificDates: s.specificDates.map((d, i) =>
        i === dateIdx
          ? {
              ...d,
              timeSlots: d.timeSlots.filter((_, j) => j !== slotIdx),
            }
          : d,
      ),
    }));
  };

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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t, i) =>
        i === slotIdx ? { ...t, [field]: value } : t,
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
    value: string,
  ) => {
    updateSchedule(index, (s) => ({ ...s, [field]: value }));
  };

  const handleBack = () => {
    if (subjectId) {
      navigate(`/app/subjects/${subjectId}`);
    } else {
      navigate(-1);
    }
  };

  const selectedStudentsDetails = subjectStudents.filter((st) =>
    form.selectedStudentIds.includes(st._id),
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Class title is required.");
      return;
    }

    if (form.scope === "specific" && form.selectedStudentIds.length === 0) {
      setFormError(
        "Select at least one student to schedule a specific class and alert their parents.",
      );
      return;
    }

    const scheduleValidationError = validateSchedules(form.schedules);
    if (scheduleValidationError) {
      setFormError(scheduleValidationError);
      return;
    }

    setSaving(true);
    const isSpecific = form.scope === "specific";
    const payload = {
      title: form.title.trim(),
      scope: form.scope,
      isGeneral: !isSpecific,
      studentIds: isSpecific ? form.selectedStudentIds : undefined,
      students: isSpecific ? selectedStudentsDetails : undefined,
      schedules: buildSchedulePayload(form.schedules),
    };

    try {
      if (isEditing && classId) {
        await dispatch(updateClass({ id: classId, data: payload })).unwrap();
        toast.success(
          isSpecific
            ? "Specific class updated & selected students/parents alerted!"
            : "General class updated!",
        );
      } else {
        await dispatch(createClass({ ...payload, subjectId })).unwrap();
        toast.success(
          isSpecific
            ? "Specific class scheduled & selected students/parents alerted!"
            : "General class scheduled for everyone in subject!",
        );
      }
      navigate(`/app/subjects/${subjectId}`);
    } catch (err: any) {
      const msg =
        (typeof err === "string" ? err : err?.message) ||
        "Failed to save class schedule.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isRecurringPreview = form.schedules.some(
    (s) => s.frequency && s.frequency !== "none",
  );

  const filteredStudents = subjectStudents.filter((st) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    const fullName = `${st.firstName || ""} ${st.lastName || ""}`.toLowerCase();
    const email = (st.email || "").toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const alertedStudentsCount =
    form.scope === "specific"
      ? selectedStudentsDetails.length
      : subjectStudents.length;

  const alertedParentsCount = (
    form.scope === "specific" ? selectedStudentsDetails : subjectStudents
  ).reduce((acc, st) => acc + (st.parents?.length || (st.parentId ? 1 : 0)), 0);

  return (
    <div className="page space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to subject</span>
        </button>

        {isEditing && existingClass?.status && (
          <StatusPill status={existingClass.status} />
        )}
      </div>

      <PageHeader
        eyebrow={
          subjectName
            ? gradeTitle
              ? `${subjectName} · ${gradeTitle}`
              : subjectName
            : "Class Schedule"
        }
        title={isEditing ? "Edit scheduled class" : "Schedule a class"}
        highlight={isEditing ? "scheduled class" : "class"}
        subtitle={
          isEditing
            ? "Update the session title, audience scope, or schedule rules."
            : "Schedule a general class for everyone in the subject or a specific class for selected students and alert their parents."
        }
      />

      {loadingInitial ? (
        <Panel title={isEditing ? "Edit scheduled class" : "Schedule a class"}>
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading schedule details…</p>
          </div>
        </Panel>
      ) : loadError ? (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            Go back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
            <Panel title="Session details & audience">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="class-title" className="form-label block">
                    Class title
                  </label>
                  <input
                    id="class-title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleTitleChange}
                    required
                    placeholder="e.g. Advanced Vector Math"
                    className="w-full form-input"
                  />
                  {submitted && !form.title.trim() && (
                    <p className="text-xs font-medium text-[var(--color-danger)]">
                      Class title is required.
                    </p>
                  )}
                </div>

                {/* General vs Specific Class Selector */}
                <div className="space-y-2">
                  <label className="form-label block">Class type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleScopeChange("general")}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        form.scope === "general"
                          ? "border-[var(--color-primary)] bg-[var(--row-bg)] ring-1 ring-[var(--color-primary)]"
                          : "border-[var(--color-card-border)] bg-[var(--color-card)] hover:bg-[var(--row-bg)]/60"
                      }`}
                    >
                      <span className="p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-primary)] shrink-0">
                        <Users size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          General class
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          Open to all students in{" "}
                          {subjectName || "this subject"}; alerts all enrolled
                          students &amp; their parents.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScopeChange("specific")}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        form.scope === "specific"
                          ? "border-[var(--color-primary)] bg-[var(--row-bg)] ring-1 ring-[var(--color-primary)]"
                          : "border-[var(--color-card-border)] bg-[var(--color-card)] hover:bg-[var(--row-bg)]/60"
                      }`}
                    >
                      <span className="p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-primary)] shrink-0">
                        <UserCheck size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          Specific student(s)
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          For one student or a selected set; alerts only
                          selected students &amp; their parents.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Specific Student Picker & Details */}
                {form.scope === "specific" && (
                  <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--row-bg)] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-primary)]">
                          Select students in {subjectName || "subject"} (
                          {form.selectedStudentIds.length} selected)
                        </p>
                        <p className="text-[11px] text-[var(--color-muted)]">
                          Selected students and their parents will be notified.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            selectAllFilteredStudents(filteredStudents)
                          }
                          className="btn btn-secondary !min-h-0 !py-1 !px-2.5 text-xs"
                        >
                          Select all
                        </button>
                        {form.selectedStudentIds.length > 0 && (
                          <button
                            type="button"
                            onClick={clearSelectedStudents}
                            className="btn btn-secondary !min-h-0 !py-1 !px-2.5 text-xs"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                      />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search student by name or email…"
                        className="w-full form-input !pl-8 !min-h-0 !py-1.5 text-xs"
                      />
                    </div>

                    {filteredStudents.length === 0 ? (
                      <p className="text-xs text-[var(--color-muted)] py-4 text-center">
                        No students found for this subject.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {filteredStudents.map((st) => {
                          const checked = form.selectedStudentIds.includes(
                            st._id,
                          );
                          const fullName =
                            `${st.firstName || ""} ${st.lastName || ""}`.trim() ||
                            "Unnamed Student";
                          const parentNames = (st.parents || [])
                            .map((p) =>
                              `${p.firstName || ""} ${p.lastName || ""}`.trim(),
                            )
                            .filter(Boolean);

                          return (
                            <label
                              key={st._id}
                              className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                checked
                                  ? "border-[var(--color-primary)] bg-[var(--color-card)]"
                                  : "border-[var(--color-card-border)] bg-[var(--color-card)]/70 hover:bg-[var(--color-card)]"
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleStudentSelection(st._id)
                                  }
                                  className="mt-1 rounded border-[var(--color-card-border)] accent-[var(--color-primary)]"
                                />
                                <Avatar name={fullName} size={28} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-[var(--color-primary)] truncate">
                                    {fullName}
                                  </p>
                                  {st.email && (
                                    <p className="text-[11px] text-[var(--color-muted)] truncate flex items-center gap-1 mt-0.5">
                                      <Mail size={11} />
                                      <span>{st.email}</span>
                                    </p>
                                  )}
                                  {parentNames.length > 0 && (
                                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                                      Parent(s): {parentNames.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {st.isSubscribed !== undefined && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] shrink-0">
                                  {st.isSubscribed
                                    ? "Subscribed"
                                    : "Unsubscribed"}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {submitted &&
                      form.scope === "specific" &&
                      form.selectedStudentIds.length === 0 && (
                        <p className="text-xs font-medium text-[var(--color-danger)]">
                          Please select at least one student.
                        </p>
                      )}
                  </div>
                )}

                {submitted && formError && (
                  <div className="p-3 rounded-2xl bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] text-xs font-medium text-[var(--color-danger)] flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title={`Schedule rules (${form.schedules.length})`}
              actions={
                <button
                  type="button"
                  onClick={addSchedule}
                  className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add rule</span>
                </button>
              }
            >
              <div className="space-y-4">
                {form.schedules.map((schedule, index) => (
                  <ScheduleEditor
                    key={index}
                    schedule={schedule}
                    index={index}
                    canRemove={form.schedules.length > 1}
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
                      val,
                    ) =>
                      changeSpecificDateTimeSlot(
                        index,
                        dateIdx,
                        slotIdx,
                        field,
                        val,
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
                    onRemoveTimeSlot={(slotIdx) =>
                      removeTimeSlot(index, slotIdx)
                    }
                    onChangeDate={(field, val) =>
                      changeScheduleDate(index, field, val)
                    }
                  />
                ))}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={saving}
                    className="btn btn-secondary justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary justify-center inline-flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <Check size={15} />
                    )}
                    <span>{isEditing ? "Save changes" : "Schedule class"}</span>
                  </button>
                </div>
              </div>
            </Panel>
          </form>

          <div className="lg:col-span-4 space-y-6">
            <Panel title="Schedule summary">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-xl bg-[var(--row-bg)] text-[var(--color-primary)] shrink-0 mt-0.5">
                    {isRecurringPreview ? (
                      <Repeat size={15} />
                    ) : (
                      <Calendar size={15} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-[var(--color-primary)] break-words">
                      {form.title.trim() || "Untitled class"}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed break-words">
                      {summarizeSchedules(form.schedules)}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--color-card-border)] border-t border-[var(--color-card-border)] pt-2">
                  {subjectName && (
                    <div className="py-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--color-muted)]">
                        Subject
                      </span>
                      <span className="text-xs font-medium text-[var(--color-primary)]">
                        {subjectName}
                      </span>
                    </div>
                  )}
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Class type
                    </span>
                    <span className="text-xs font-medium text-[var(--color-primary)] capitalize">
                      {form.scope === "specific"
                        ? "Specific student(s)"
                        : "General (all subject)"}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Students alerted
                    </span>
                    <span className="text-xs font-medium text-[var(--color-primary)]">
                      {alertedStudentsCount}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Parents alerted
                    </span>
                    <span className="text-xs font-medium text-[var(--color-primary)]">
                      {alertedParentsCount}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Rules
                    </span>
                    <span className="text-xs font-medium text-[var(--color-primary)]">
                      {form.schedules.length}
                    </span>
                  </div>
                </div>

                {form.scope === "specific" &&
                  selectedStudentsDetails.length > 0 && (
                    <div className="border-t border-[var(--color-card-border)] pt-3 space-y-2">
                      <p className="text-xs font-semibold text-[var(--color-primary)]">
                        Selected student details
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedStudentsDetails.map((st) => (
                          <div
                            key={st._id}
                            className="p-2 rounded-xl bg-[var(--row-bg)] text-xs space-y-0.5"
                          >
                            <p className="font-medium text-[var(--color-primary)]">
                              {st.firstName} {st.lastName}
                            </p>
                            {st.email && (
                              <p className="text-[11px] text-[var(--color-muted)] truncate">
                                {st.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Shared time-slot row editor ---------- */

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
      <div
        key={slotIdx}
        className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] p-2"
      >
        <div className="flex-1 min-w-[110px]">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)] mb-0.5">
            Start
          </span>
          <DateInput
            type="time"
            value={slot.startTime}
            onChange={(e) => onChange(slotIdx, "startTime", e.target.value)}
            className="w-full form-input !min-h-0 !py-1.5 !px-2.5 text-xs"
          />
        </div>
        <span className="text-xs text-[var(--color-muted)] pt-3.5 shrink-0">
          –
        </span>
        <div className="flex-1 min-w-[110px]">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)] mb-0.5">
            End
          </span>
          <DateInput
            type="time"
            value={slot.endTime}
            onChange={(e) => onChange(slotIdx, "endTime", e.target.value)}
            className="w-full form-input !min-h-0 !py-1.5 !px-2.5 text-xs"
          />
        </div>
        {slots.length > 1 && (
          <button
            type="button"
            onClick={() => onRemove(slotIdx)}
            aria-label="Remove time slot"
            className="mt-3.5 p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
    >
      <Plus size={12} />
      <span>Add time slot</span>
    </button>
  </div>
);

/* ---------- Recurring schedule rule editor ---------- */

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
    value: string,
  ) => void;
  onAddDayOfWeekTimeSlot: (day: number) => void;
  onRemoveDayOfWeekTimeSlot: (day: number, slotIdx: number) => void;
  onToggleDayOfMonth: (d: number) => void;
  onChangeDayOfMonthTimeSlot: (
    day: number,
    slotIdx: number,
    field: keyof TimeSlot,
    value: string,
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
    value: string,
  ) => void;
  onAddSpecificDateTimeSlot: (dateIdx: number) => void;
  onRemoveSpecificDateTimeSlot: (dateIdx: number, slotIdx: number) => void;
  onAddTimeSlot: () => void;
  onChangeTimeSlot: (
    slotIdx: number,
    field: keyof TimeSlot,
    value: string,
  ) => void;
  onRemoveTimeSlot: (slotIdx: number) => void;
  onChangeDate: (field: "startDate" | "endDate", value: string) => void;
}) => {
  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--row-bg)] p-4 sm:p-5 space-y-5">
      {/* Rule Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-card-border)]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-brand-fg)] text-xs font-semibold">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            Rule {index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove rule ${index + 1}`}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Frequency Segmented Pills */}
      <div className="space-y-1.5">
        <span className="form-label block">Frequency</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FREQUENCY_OPTIONS.map((opt) => {
            const selected = schedule.frequency === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFrequencyChange(opt.value)}
                className={`btn !min-h-0 !py-2 !px-3 text-xs font-medium justify-center transition-all ${
                  selected
                    ? "btn-primary shadow-xs"
                    : "btn-secondary bg-[var(--color-card)]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily */}
      {schedule.frequency === "daily" && (
        <div className="space-y-2">
          <label className="form-label block">Time slot(s) — every day</label>
          <TimeSlotRows
            slots={schedule.timeSlots}
            onChange={onChangeTimeSlot}
            onAdd={onAddTimeSlot}
            onRemove={onRemoveTimeSlot}
          />
        </div>
      )}

      {/* Weekly */}
      {schedule.frequency === "weekly" && (
        <div className="space-y-3">
          <label className="form-label block">Repeats on</label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_NAMES.map((day, d) => {
              const active = schedule.daysOfWeek.some((e) => e.day === d);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDayOfWeek(d)}
                  className={`btn !min-h-0 !py-1.5 !px-3 text-xs ${
                    active
                      ? "btn-primary"
                      : "btn-secondary bg-[var(--color-card)]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {schedule.daysOfWeek.length > 0 && (
            <div className="space-y-2.5 pt-1">
              {schedule.daysOfWeek
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-3.5 space-y-2.5"
                  >
                    <p className="text-xs font-semibold text-[var(--color-primary)]">
                      {DAY_NAMES[entry.day]}
                    </p>
                    <TimeSlotRows
                      slots={entry.timeSlots}
                      onChange={(slotIdx, field, val) =>
                        onChangeDayOfWeekTimeSlot(
                          entry.day,
                          slotIdx,
                          field,
                          val,
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

      {/* Monthly */}
      {schedule.frequency === "monthly" && (
        <div className="space-y-3">
          <label className="form-label block">Repeats on day(s) of month</label>
          <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-2 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const active = schedule.daysOfMonth.some((e) => e.day === day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDayOfMonth(day)}
                  className={`h-8 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-brand-fg)]"
                      : "bg-[var(--row-bg)] text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {schedule.daysOfMonth.length > 0 && (
            <div className="space-y-2.5 pt-1">
              {schedule.daysOfMonth
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-3.5 space-y-2.5"
                  >
                    <p className="text-xs font-semibold text-[var(--color-primary)]">
                      Day {entry.day}
                    </p>
                    <TimeSlotRows
                      slots={entry.timeSlots}
                      onChange={(slotIdx, field, val) =>
                        onChangeDayOfMonthTimeSlot(
                          entry.day,
                          slotIdx,
                          field,
                          val,
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

      {/* Specific dates */}
      {schedule.frequency === "none" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="form-label">Specific dates</label>
            <button
              type="button"
              onClick={onAddSpecificDate}
              className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 bg-[var(--color-card)]"
            >
              <Plus size={13} />
              <span>Add date</span>
            </button>
          </div>

          {schedule.specificDates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--color-card)]/60 p-5 text-center space-y-2.5">
              <p className="text-xs text-[var(--color-muted)]">
                No dates added yet.
              </p>
              <button
                type="button"
                onClick={onAddSpecificDate}
                className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add first date</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {schedule.specificDates.map((entry, dateIdx) => (
                <div
                  key={dateIdx}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      Date #{dateIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveSpecificDate(dateIdx)}
                      aria-label="Remove specific date"
                      className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <DateInput
                    type="date"
                    value={entry.date}
                    placeholder="Pick a date"
                    onChange={(e) =>
                      onChangeSpecificDateValue(dateIdx, e.target.value)
                    }
                    className="w-full form-input !min-h-0 !py-1.5 text-xs"
                  />
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
          )}
        </div>
      )}

      {/* Date Bounds (Starts / Ends) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--color-card-border)]">
        <div className="space-y-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] p-2.5">
          <label className="form-label block text-xs">Starts (optional)</label>
          <DateInput
            type="date"
            value={schedule.startDate}
            placeholder="Pick a date"
            onChange={(e) => onChangeDate("startDate", e.target.value)}
            className="w-full form-input !min-h-0 !py-1.5 text-xs"
          />
        </div>
        <div className="space-y-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] p-2.5">
          <label className="form-label block text-xs">Ends (optional)</label>
          <DateInput
            type="date"
            value={schedule.endDate}
            placeholder="Pick a date"
            onChange={(e) => onChangeDate("endDate", e.target.value)}
            className="w-full form-input !min-h-0 !py-1.5 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
