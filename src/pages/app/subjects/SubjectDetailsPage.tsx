import {
  useEffect,
  useState,
  useRef,
  FormEvent,
  ChangeEvent,
  ReactNode,
} from "react";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  Users,
  Clock,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  FileText,
  Megaphone,
  ClipboardList,
  BookOpen,
  CheckCircle2,
  XCircle,
  Repeat,
  Calendar,
  RotateCcw,
  UserMinus,
  Search,
  Disc,
  Download,
  Volume2,
  Play,
  Pause,
  Mail,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/index";
import {
  fetchSubjectById,
  deleteSubject,
  addSubjectMembers,
  removeSubjectMembers,
  Subject,
  StudentDetail,
  ClassRecording,
  GradeSummary,
} from "../../../store/features/subjects/subjects.slice";
import {
  fetchClasses,
  deleteClass,
} from "../../../store/features/classes/classes.slice";
import {
  fetchResources,
  addResource,
  updateResource,
  deleteResource,
  clearResources,
} from "../../../store/features/resources/resources.slice";
import { fetchAllUsersByType } from "../../../store/features/users/users.slice";
import { useParams, useNavigate } from "react-router-dom";
import { getUserType } from "../../../utils/userType";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";

interface PersonSummary extends StudentDetail {}

type ResourceType = "assignment" | "note" | "announcement";
type MobileTab = "classes" | "assignments" | "teachers" | "students";
type MemberRole = "teacher" | "student";

interface CurrentUserIdentity {
  id?: string;
  email?: string;
}

interface PendingRemoveMember {
  role: MemberRole;
  memberId: string;
  name: string;
}

interface PendingRemoveRecording {
  classId: string;
  recording: ClassRecording;
  key: string;
  label: string;
}

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
  timeSlots: TimeSlot[];
  daysOfWeek: DayOfWeekEntry[];
  daysOfMonth: DayOfMonthEntry[];
  specificDates: SpecificDateEntry[];
  startDate: string;
  endDate: string;
}

interface ResourceForm {
  title: string;
  description: string;
}

interface TeacherRef {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface ClassSessionRecord {
  _id: string;
  title?: string;
  name?: string;
  date?: string;
  time?: string;
  duration?: number;
  status?: string;
  schedules?: unknown[];
  studentIds?: Array<string | StudentDetail>;
  students?: Array<string | StudentDetail>;
  student?: string | StudentDetail;
  studentCount?: number;
  recordings?: ClassRecording[];
  assignedStudents?: StudentDetail[];
  teacherId?: TeacherRef | string | null;
  teacherIds?: Array<TeacherRef | string>;
}

interface ResourceRecord {
  _id: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

const resourceIcons: Record<ResourceType, typeof ClipboardList> = {
  assignment: ClipboardList,
  note: FileText,
  announcement: Megaphone,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCurrentUserIdentity = (): CurrentUserIdentity => {
  try {
    for (const key of ["user", "currentUser", "authUser", "profile"]) {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const u = parsed?.user || parsed?.data || parsed;
      if (u && typeof u === "object") {
        return {
          id: u._id || u.id || u.userId || undefined,
          email:
            typeof u.email === "string"
              ? u.email.trim().toLowerCase()
              : undefined,
        };
      }
    }
  } catch {
    // ignore storage parse errors
  }
  return {};
};

const extractTeacherId = (teacher: unknown): string | null => {
  if (!teacher) return null;
  if (typeof teacher === "string") return teacher.trim() || null;
  if (typeof teacher === "object") {
    const obj = teacher as { _id?: unknown; id?: unknown };
    const val = obj._id ?? obj.id;
    return val ? String(val).trim() : null;
  }
  return null;
};

const extractTeacherEmail = (teacher: unknown): string | null => {
  if (!teacher || typeof teacher !== "object") return null;
  const email = (teacher as { email?: unknown }).email;
  return typeof email === "string" && email.trim()
    ? email.trim().toLowerCase()
    : null;
};

const isTeacherAssignedToClass = (
  cls: ClassSessionRecord,
  currentUser: CurrentUserIdentity,
): boolean => {
  const userId = currentUser.id ? String(currentUser.id).trim() : "";
  const userEmail = currentUser.email
    ? currentUser.email.trim().toLowerCase()
    : "";

  if (!userId && !userEmail) return false;

  const candidates: unknown[] = [
    ...(Array.isArray(cls.teacherIds) ? cls.teacherIds : []),
    ...(cls.teacherId ? [cls.teacherId] : []),
  ];

  return candidates.some((entry) => {
    const tId = extractTeacherId(entry);
    if (userId && tId && tId === userId) return true;

    const tEmail = extractTeacherEmail(entry);
    if (userEmail && tEmail && tEmail === userEmail) return true;

    return false;
  });
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};

const getRecordingKey = (rec: ClassRecording, idx: number): string =>
  rec._id || `${rec.url}-${rec.fileName || "rec"}-${idx}`;

const getSubjectName = (subj?: Subject | null): string =>
  subj?.name?.trim() || subj?.code?.trim() || "Untitled Subject";

const getPersonDisplayName = (person?: {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  _id?: string;
}): string => {
  const combined =
    `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
  return (
    person?.fullName?.trim() ||
    combined ||
    person?.name?.trim() ||
    person?.email?.trim() ||
    person?._id ||
    "Unnamed User"
  );
};

const isStudentObject = (item: unknown): item is StudentDetail => {
  if (!item || typeof item !== "object") return false;
  const obj = item as Partial<StudentDetail>;
  return Boolean(
    obj._id &&
    (obj.firstName || obj.lastName || obj.name || obj.fullName || obj.email),
  );
};

const formatDuration = (sec?: number): string => {
  const total = Math.max(0, Number(sec) || 0);
  if (!total) return "";
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
};

const makeEmptyTimeSlot = (): TimeSlot => ({
  startTime: "09:00",
  endTime: "10:00",
});

const normalizeTimeSlots = (slots: unknown): TimeSlot[] => {
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.map((t) => {
      const slot = (t && typeof t === "object" ? t : {}) as Partial<TimeSlot>;
      return {
        startTime: slot.startTime || "09:00",
        endTime: slot.endTime || "10:00",
      };
    });
  }
  return [makeEmptyTimeSlot()];
};

const normalizeScheduleForForm = (raw: unknown): ScheduleItem => {
  const s = (raw && typeof raw === "object" ? raw : {}) as {
    frequency?: Frequency;
    timeSlots?: unknown;
    daysOfWeek?: unknown;
    daysOfMonth?: unknown;
    specificDates?: unknown;
    startDate?: unknown;
    endDate?: unknown;
  };

  const frequency: Frequency = s.frequency || "weekly";
  const startDate = s.startDate ? String(s.startDate).split("T")[0] : "";
  const endDate = s.endDate ? String(s.endDate).split("T")[0] : "";

  let daysOfWeek: DayOfWeekEntry[] = [];
  if (Array.isArray(s.daysOfWeek) && s.daysOfWeek.length > 0) {
    if (typeof s.daysOfWeek[0] === "object" && s.daysOfWeek[0] !== null) {
      daysOfWeek = s.daysOfWeek.map((d) => {
        const entry = d as { day?: unknown; timeSlots?: unknown };
        return {
          day: typeof entry.day === "number" ? entry.day : 0,
          timeSlots: normalizeTimeSlots(entry.timeSlots),
        };
      });
    } else {
      const shared = normalizeTimeSlots(s.timeSlots);
      daysOfWeek = s.daysOfWeek.map((day) => ({
        day: typeof day === "number" ? day : 0,
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  let daysOfMonth: DayOfMonthEntry[] = [];
  if (Array.isArray(s.daysOfMonth) && s.daysOfMonth.length > 0) {
    if (typeof s.daysOfMonth[0] === "object" && s.daysOfMonth[0] !== null) {
      daysOfMonth = s.daysOfMonth.map((d) => {
        const entry = d as { day?: unknown; timeSlots?: unknown };
        return {
          day: typeof entry.day === "number" ? entry.day : 1,
          timeSlots: normalizeTimeSlots(entry.timeSlots),
        };
      });
    } else {
      const shared = normalizeTimeSlots(s.timeSlots);
      daysOfMonth = s.daysOfMonth.map((day) => ({
        day: typeof day === "number" ? day : 1,
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  let specificDates: SpecificDateEntry[] = [];
  if (Array.isArray(s.specificDates) && s.specificDates.length > 0) {
    if (typeof s.specificDates[0] === "object" && s.specificDates[0] !== null) {
      specificDates = s.specificDates.map((d) => {
        const entry = d as { date?: unknown; timeSlots?: unknown };
        return {
          date: entry.date ? String(entry.date).split("T")[0] : "",
          timeSlots: normalizeTimeSlots(entry.timeSlots),
        };
      });
    } else {
      const shared = normalizeTimeSlots(s.timeSlots);
      specificDates = s.specificDates.map((d) => ({
        date: d ? String(d).split("T")[0] : "",
        timeSlots: shared.map((t) => ({ ...t })),
      }));
    }
  }

  return {
    frequency,
    timeSlots: normalizeTimeSlots(s.timeSlots),
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

const summarizeSchedules = (
  schedules: Array<ScheduleItem | unknown> | undefined,
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
              ? new Date(`${d.date}T00:00:00`).toLocaleDateString()
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

const extractUsersFromThunkResult = (res: unknown): PersonSummary[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as PersonSummary[];
  if (typeof res === "object") {
    const obj = res as { users?: unknown; data?: unknown };
    if (Array.isArray(obj.users)) return obj.users as PersonSummary[];
    if (Array.isArray(obj.data)) return obj.data as PersonSummary[];
  }
  return [];
};

const extractGradeTitle = (subj: Subject | null): string => {
  if (!subj) return "—";
  if (Array.isArray(subj.gradeLevel) && subj.gradeLevel.length > 0) {
    const first = subj.gradeLevel[0] as GradeSummary;
    if (first?.title?.trim()) return first.title.trim();
  }
  if (Array.isArray(subj.grades) && subj.grades.length > 0) {
    const first = subj.grades[0];
    if (first?.title?.trim()) return first.title.trim();
  }
  if (typeof subj.gradeLevelTitle === "string" && subj.gradeLevelTitle.trim()) {
    return subj.gradeLevelTitle.trim();
  }
  return "—";
};

const hasClassStudents = (
  cls: ClassSessionRecord,
  resolvedStudents?: StudentDetail[],
): boolean => {
  if (Array.isArray(resolvedStudents) && resolvedStudents.length > 0) {
    return true;
  }
  if (typeof cls.studentCount === "number" && cls.studentCount > 0) {
    return true;
  }
  const rawList = [
    ...(Array.isArray(cls.studentIds) ? cls.studentIds : []),
    ...(Array.isArray(cls.assignedStudents) ? cls.assignedStudents : []),
    ...(Array.isArray(cls.students) ? cls.students : []),
    ...(cls.student ? [cls.student] : []),
  ];
  return rawList.some((entry) => {
    if (!entry) return false;
    if (typeof entry === "string") return Boolean(entry.trim());
    if (typeof entry === "object") {
      const obj = entry as { _id?: unknown; id?: unknown };
      return Boolean(obj._id || obj.id);
    }
    return false;
  });
};

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const type = getUserType();
  const isAdmin = type === "admin" || type === "superadmin";
  const isTeacher = type === "teacher";
  const canManage = isAdmin || isTeacher;
  const currentUser = getCurrentUserIdentity();

  const usersState = useSelector(
    (state: RootState) =>
      (
        state as RootState & {
          users?: {
            teachers?: PersonSummary[];
            students?: PersonSummary[];
            byType?: { teacher?: PersonSummary[]; student?: PersonSummary[] };
          };
        }
      ).users,
  );

  const [subject, setSubject] = useState<Subject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassSessionRecord[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  const [activeTab, setActiveTab] = useState<ResourceType>("assignment");
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isEditResourceOpen, setIsEditResourceOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRecord | null>(
    null,
  );
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

  const [recordingsClass, setRecordingsClass] =
    useState<ClassSessionRecord | null>(null);
  const [playingRecordingKey, setPlayingRecordingKey] = useState<string | null>(
    null,
  );
  const [pendingRemoveRecording, setPendingRemoveRecording] =
    useState<PendingRemoveRecording | null>(null);
  const [removingRecording, setRemovingRecording] = useState(false);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});

  const [memberModalRole, setMemberModalRole] = useState<MemberRole | null>(
    null,
  );
  const [availableMembers, setAvailableMembers] = useState<PersonSummary[]>([]);
  const [loadingMembersList, setLoadingMembersList] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const [pendingRemoveMember, setPendingRemoveMember] =
    useState<PendingRemoveMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<StudentDetail | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [expandedClassStudentsId, setExpandedClassStudentsId] = useState<
    string | null
  >(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>("classes");

  const subjectDisplayName = getSubjectName(subject);
  const enrolledStudents: StudentDetail[] =
    subject?.children && subject.children.length > 0
      ? subject.children
      : subject?.students || [];

  useEffect(() => {
    const elements = audioElementsRef.current;
    return () => {
      Object.values(elements).forEach((el) => {
        try {
          el?.pause();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const handleTogglePlayRecording = (recKey: string) => {
    const targetAudio = audioElementsRef.current[recKey];
    if (!targetAudio) return;

    if (!targetAudio.paused) {
      targetAudio.pause();
      setPlayingRecordingKey(null);
      return;
    }

    Object.entries(audioElementsRef.current).forEach(([key, el]) => {
      if (key !== recKey && el && !el.paused) {
        el.pause();
      }
    });

    targetAudio
      .play()
      .then(() => {
        setPlayingRecordingKey(recKey);
      })
      .catch(() => {
        toast.error("Unable to play recording.");
      });
  };

  const handleRemoveRecordingFromState = (classId: string, recKey: string) => {
    const audioEl = audioElementsRef.current[recKey];
    if (audioEl) {
      try {
        audioEl.pause();
      } catch {
        // ignore
      }
      delete audioElementsRef.current[recKey];
    }
    if (playingRecordingKey === recKey) {
      setPlayingRecordingKey(null);
    }

    const filterRecordings = (list?: ClassRecording[]) =>
      (list || []).filter((rec, idx) => getRecordingKey(rec, idx) !== recKey);

    setClasses((prev) =>
      prev.map((c) =>
        c._id === classId
          ? { ...c, recordings: filterRecordings(c.recordings) }
          : c,
      ),
    );

    setRecordingsClass((prev) =>
      prev && prev._id === classId
        ? { ...prev, recordings: filterRecordings(prev.recordings) }
        : prev,
    );

    setSubject((prev) =>
      prev
        ? {
            ...prev,
            classes: (prev.classes || []).map((c) =>
              c._id === classId
                ? { ...c, recordings: filterRecordings(c.recordings) }
                : c,
            ),
          }
        : prev,
    );
  };

  const confirmRemoveRecording = async () => {
    if (!pendingRemoveRecording) return;
    const { classId, key, recording } = pendingRemoveRecording;
    setRemovingRecording(true);
    try {
      void recording;
      handleRemoveRecordingFromState(classId, key);
      toast.success("Recording removed");
      setPendingRemoveRecording(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove recording"));
    } finally {
      setRemovingRecording(false);
    }
  };

  useEffect(() => {
    if (!isAdmin && (mobileTab === "teachers" || mobileTab === "students")) {
      setMobileTab("classes");
    }
  }, [isAdmin, mobileTab]);

  useEffect(() => {
    if (!id) {
      setSubjectError("Invalid subject ID");
      setSubjectLoading(false);
      return;
    }
    setSubjectLoading(true);
    setSubjectError(null);
    dispatch(fetchSubjectById(id))
      .unwrap()
      .then((data) => {
        setSubject(data);
        setSubjectLoading(false);
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err, "Failed to load subject");
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
      .then((data: unknown) => {
        setClasses(Array.isArray(data) ? (data as ClassSessionRecord[]) : []);
        setClassesLoading(false);
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err, "Failed to load classes");
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
      .then((data: unknown) => {
        setResources(Array.isArray(data) ? (data as ResourceRecord[]) : []);
        setResourcesLoading(false);
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err, "Failed to load resources");
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
      navigate("/app/subjects");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeletingSubject(false);
      closeDeleteSubject();
    }
  };

  const loadCandidatesForRole = async (role: MemberRole) => {
    setLoadingMembersList(true);

    const cachedByRole =
      role === "teacher"
        ? usersState?.teachers || usersState?.byType?.teacher
        : usersState?.students || usersState?.byType?.student;
    if (Array.isArray(cachedByRole) && cachedByRole.length > 0) {
      setAvailableMembers(cachedByRole);
    }

    try {
      const payload = await dispatch(fetchAllUsersByType(role)).unwrap();
      const list = extractUsersFromThunkResult(payload);
      setAvailableMembers(list);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to load ${role}s`));
    } finally {
      setLoadingMembersList(false);
    }
  };

  const openAddMemberModal = (role: MemberRole) => {
    setMemberModalRole(role);
    setMemberSearch("");
    setSelectedMemberIds([]);
    loadCandidatesForRole(role);
  };

  const closeAddMemberModal = () => {
    setMemberModalRole(null);
    setSelectedMemberIds([]);
    setMemberSearch("");
  };

  const toggleCandidateSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((item) => item !== memberId)
        : [...prev, memberId],
    );
  };

  const handleAddMembersSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !memberModalRole) return;

    if (selectedMemberIds.length === 0) {
      toast.error(`Select at least one ${memberModalRole} to add.`);
      return;
    }

    setSavingMembers(true);
    try {
      const res = await dispatch(
        addSubjectMembers({
          subjectId: id,
          teacherIds:
            memberModalRole === "teacher" ? selectedMemberIds : undefined,
          studentIds:
            memberModalRole === "student" ? selectedMemberIds : undefined,
        }),
      ).unwrap();

      if (res?._id) {
        setSubject(res);
      } else {
        const refreshed = await dispatch(fetchSubjectById(id)).unwrap();
        setSubject(refreshed);
      }

      toast.success(
        memberModalRole === "teacher"
          ? `${selectedMemberIds.length} teacher(s) added to subject`
          : `${selectedMemberIds.length} student(s) added to subject`,
      );
      closeAddMemberModal();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to add ${memberModalRole}(s)`));
    } finally {
      setSavingMembers(false);
    }
  };

  const requestRemoveMember = (
    role: MemberRole,
    memberId: string,
    name: string,
  ) => {
    setPendingRemoveMember({ role, memberId, name });
  };

  const closeRemoveMemberModal = () => {
    if (removingMember) return;
    setPendingRemoveMember(null);
  };

  const confirmRemoveMember = async () => {
    if (!id || !pendingRemoveMember) return;
    const { role, memberId } = pendingRemoveMember;
    setRemovingMember(true);
    try {
      const res = await dispatch(
        removeSubjectMembers({
          subjectId: id,
          teacherIds: role === "teacher" ? [memberId] : undefined,
          studentIds: role === "student" ? [memberId] : undefined,
        }),
      ).unwrap();

      if (res?._id) {
        setSubject(res);
      } else {
        setSubject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            teachers:
              role === "teacher"
                ? prev.teachers.filter((t) => t._id !== memberId)
                : prev.teachers,
            children:
              role === "student"
                ? prev.children.filter((s) => s._id !== memberId)
                : prev.children,
          };
        });
      }

      if (selectedStudentDetail?._id === memberId) {
        setSelectedStudentDetail(null);
      }

      toast.success(
        role === "teacher"
          ? "Teacher removed from subject"
          : "Student removed from subject",
      );
      setPendingRemoveMember(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to remove ${role}`));
    } finally {
      setRemovingMember(false);
    }
  };

  const handleNewSession = () => {
    if (!id) return;
    navigate(`/app/subjects/${id}/classes/new`);
  };

  const handleEditSession = (cls: ClassSessionRecord) => {
    if (!id || !cls?._id) return;
    navigate(`/app/subjects/${id}/classes/${cls._id}/edit`);
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
      setSubject((prev) =>
        prev
          ? {
              ...prev,
              classes: (prev.classes || []).filter(
                (c) => c._id !== deleteClassId,
              ),
            }
          : prev,
      );
      toast.success("Class deleted");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeletingClass(false);
      closeDeleteClass();
    }
  };

  const openAddResource = () => {
    setResourceForm({ title: "", description: "" });
    setResourceSubmitted(false);
    setIsAddResourceOpen(true);
  };
  const closeAddResource = () => setIsAddResourceOpen(false);

  const openEditResource = (res: ResourceRecord) => {
    setEditingResource(res);
    setResourceForm({
      title: res.title || "",
      description: res.description || "",
    });
    setResourceSubmitted(false);
    setIsEditResourceOpen(true);
  };
  const closeEditResource = () => {
    setEditingResource(null);
    setIsEditResourceOpen(false);
  };

  const handleResourceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setResourceForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveResource = async (e: FormEvent) => {
    e.preventDefault();
    setResourceSubmitted(true);
    if (!resourceForm.title.trim() || !id) return;
    setResourceSaving(true);
    const payload = {
      type: activeTab,
      subjectId: id,
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || undefined,
    };
    try {
      if (editingResource) {
        const result = (await dispatch(
          updateResource({ ...payload, _id: editingResource._id }),
        ).unwrap()) as ResourceRecord;
        setResources((prev) =>
          prev.map((r) => (r._id === result._id ? result : r)),
        );
        toast.success("Updated!");
        closeEditResource();
      } else {
        const result = (await dispatch(
          addResource(payload),
        ).unwrap()) as ResourceRecord;
        setResources((prev) => [result, ...prev]);
        toast.success("Created!");
        closeAddResource();
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed"));
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
        deleteResource({ type: activeTab, _id: deleteResourceId }),
      ).unwrap();
      setResources((prev) => prev.filter((r) => r._id !== deleteResourceId));
      toast.success("Deleted");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeletingResource(false);
      closeDeleteResource();
    }
  };

  const gradeTitle = extractGradeTitle(subject);
  const isActive = Boolean(subject?.isActive);
  const anyError = subjectError || classesError || resourcesError;
  const anyLoading = subjectLoading || classesLoading || resourcesLoading;

  const mobileNavTabs = isAdmin
    ? ([
        { key: "classes", label: "Classes", icon: Clock },
        { key: "assignments", label: "Resources", icon: ClipboardList },
        { key: "teachers", label: "Teachers", icon: Users },
        { key: "students", label: "Students", icon: BookOpen },
      ] as const)
    : ([
        { key: "classes", label: "Classes", icon: Clock },
        { key: "assignments", label: "Resources", icon: ClipboardList },
      ] as const);

  const subjectClassesMap = new Map<string, ClassSessionRecord>(
    (subject?.classes || []).map((c) => [String(c._id), c]),
  );

  const mergedClasses: ClassSessionRecord[] = (() => {
    if (classes.length > 0) {
      return classes.map((cls) => {
        const fromSubject = subjectClassesMap.get(String(cls._id));
        if (!fromSubject) return cls;
        return {
          ...fromSubject,
          ...cls,
          teacherId: cls.teacherId ?? fromSubject.teacherId,
          teacherIds:
            Array.isArray(cls.teacherIds) && cls.teacherIds.length > 0
              ? cls.teacherIds
              : fromSubject.teacherIds || cls.teacherIds,
          studentIds:
            Array.isArray(cls.studentIds) &&
            cls.studentIds.some(isStudentObject)
              ? cls.studentIds
              : fromSubject.studentIds || cls.studentIds,
          students:
            Array.isArray(cls.students) && cls.students.some(isStudentObject)
              ? cls.students
              : fromSubject.students || cls.students,
          assignedStudents:
            Array.isArray(cls.assignedStudents) &&
            cls.assignedStudents.length > 0
              ? cls.assignedStudents
              : fromSubject.assignedStudents || [],
        };
      });
    }
    return subject?.classes || [];
  })();

  const getAssignedStudentsForClass = (
    cls: ClassSessionRecord,
  ): StudentDetail[] => {
    const enrolledMap = new Map<string, StudentDetail>(
      enrolledStudents.map((st) => [String(st._id), st]),
    );

    const rawCandidates: Array<string | StudentDetail> = [
      ...(Array.isArray(cls?.studentIds) ? cls.studentIds : []),
      ...(Array.isArray(cls?.assignedStudents) ? cls.assignedStudents : []),
      ...(Array.isArray(cls?.students) ? cls.students : []),
      ...(cls?.student ? [cls.student] : []),
    ];

    const seen = new Set<string>();
    const resolved: StudentDetail[] = [];

    for (const item of rawCandidates) {
      if (!item) continue;

      if (isStudentObject(item)) {
        const key = String(item._id);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        resolved.push({
          ...enrolledMap.get(key),
          ...item,
          _id: key,
          fullName: getPersonDisplayName(item),
        });
      } else {
        const key =
          typeof item === "object" && item !== null && "_id" in item
            ? String((item as { _id?: unknown })._id || "")
            : String(item).trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const match = enrolledMap.get(key);
        if (match) {
          resolved.push(match);
        }
      }
    }

    return resolved;
  };

  // Show all classes to admins, only assigned classes to teachers,
  // and only classes with enrolled students to students/parents.
  const visibleClasses: ClassSessionRecord[] = (() => {
    if (isAdmin) {
      return mergedClasses;
    }
    if (isTeacher) {
      return mergedClasses.filter((cls) =>
        isTeacherAssignedToClass(cls, currentUser),
      );
    }
    return mergedClasses.filter((cls) =>
      hasClassStudents(cls, getAssignedStudentsForClass(cls)),
    );
  })();

  const renderClassStudentsPreview = (
    cls: ClassSessionRecord,
    assignedStudents: StudentDetail[],
    isExpanded: boolean,
    onToggle: () => void,
  ) => {
    if (!isAdmin) return null;

    const visiblePreview = isExpanded
      ? assignedStudents
      : assignedStudents.slice(0, 3);
    const remainingCount = assignedStudents.length - visiblePreview.length;

    return (
      <div
        className="mt-2.5 pt-2.5 border-t border-[var(--color-card-border)]/70 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-[var(--color-primary)] inline-flex items-center gap-1.5">
            <Users size={12} />
            Students in class ({assignedStudents.length})
          </span>

          {assignedStudents.length > 2 && (
            <button
              type="button"
              onClick={onToggle}
              className="text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] inline-flex items-center gap-0.5"
            >
              <span>{isExpanded ? "Show less" : "View all"}</span>
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {visiblePreview.map((st) => {
            const stName = getPersonDisplayName(st);
            return (
              <button
                key={st._id}
                type="button"
                onClick={() => setSelectedStudentDetail(st)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] text-left hover:border-[var(--color-primary)] transition-colors min-w-0"
              >
                <Avatar name={stName} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--color-primary)] truncate">
                    {stName}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)] truncate">
                    {st.email || "No email"}
                    {st.gradeTitle ? ` · ${st.gradeTitle}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {!isExpanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
          >
            +{remainingCount} more{" "}
            {remainingCount === 1 ? "student" : "students"} in{" "}
            {cls.title || "class"}
          </button>
        )}
      </div>
    );
  };

  const renderClassesBody = () => {
    if (visibleClasses.length === 0) {
      return (
        <EmptyState
          title="No class sessions yet"
          text={
            isTeacher
              ? "No classes in this subject are assigned to you yet."
              : "No classes with enrolled students are available for this subject yet."
          }
        />
      );
    }

    return (
      <div className="divide-y divide-[var(--color-card-border)]">
        {visibleClasses.map((cls) => {
          const sessionTitle = cls.title?.trim() || "Untitled Session";
          const assignedStudents = getAssignedStudentsForClass(cls);
          const isExpanded = expandedClassStudentsId === cls._id;

          return (
            <div key={cls._id} className="space-y-1">
              <ClassCard
                cls={{ ...cls, title: sessionTitle }}
                assignedStudents={assignedStudents}
                canManage={canManage}
                isAdmin={isAdmin}
                onOpen={() =>
                  navigate(
                    `/app/live/${cls._id}/${encodeURIComponent(
                      sessionTitle,
                    )}/${encodeURIComponent(subjectDisplayName)}`,
                  )
                }
                onEdit={() => handleEditSession(cls)}
                onDelete={() => openDeleteClass(cls._id)}
                onViewRecordings={() => setRecordingsClass(cls)}
                onToggleStudents={() =>
                  setExpandedClassStudentsId((prev) =>
                    prev === cls._id ? null : cls._id,
                  )
                }
                isStudentsExpanded={isExpanded}
                renderStudentsSection={() =>
                  renderClassStudentsPreview(
                    cls,
                    assignedStudents,
                    isExpanded,
                    () =>
                      setExpandedClassStudentsId((prev) =>
                        prev === cls._id ? null : cls._id,
                      ),
                  )
                }
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderResourcesBody = () => {
    if (resources.length === 0) {
      return (
        <EmptyState
          title={`No ${activeTab}s yet`}
          text={`No ${activeTab}s have been posted for this subject yet.`}
        />
      );
    }

    const Icon = resourceIcons[activeTab];

    return (
      <div className="divide-y divide-[var(--color-card-border)]">
        {resources.map((res) => {
          const resTitle = res.title?.trim() || `Untitled ${activeTab}`;
          return (
            <div
              key={res._id}
              className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="p-2 rounded-xl bg-[var(--row-bg)] text-[var(--color-primary)] shrink-0 mt-0.5">
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm text-[var(--color-primary)] break-words">
                      {resTitle}
                    </h4>
                    <span className="text-xs text-[var(--color-muted)] shrink-0">
                      {res.createdAt
                        ? new Date(res.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap break-words">
                    {res.description || "No details provided."}
                  </p>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditResource(res)}
                    aria-label={`Edit ${resTitle}`}
                    className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteResource(res._id)}
                    aria-label={`Delete ${resTitle}`}
                    className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTeachersBody = () => {
    if (!subject?.teachers || subject.teachers.length === 0) {
      return (
        <EmptyState
          title="No teachers assigned"
          text={
            isAdmin
              ? "Click Add to assign teachers to this subject."
              : "No teachers are currently assigned to this subject."
          }
        />
      );
    }

    return (
      <div className="divide-y divide-[var(--color-card-border)]">
        {subject.teachers.map((teacher) => {
          const fullName = getPersonDisplayName(teacher);
          return (
            <div
              key={teacher._id}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar name={fullName} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[var(--color-primary)] truncate">
                    {fullName}
                  </p>
                  {teacher.email && (
                    <p className="text-xs text-[var(--color-muted)] truncate">
                      {teacher.email}
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    requestRemoveMember("teacher", teacher._id, fullName)
                  }
                  aria-label={`Remove ${fullName}`}
                  title="Remove teacher from subject"
                  className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors shrink-0"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStudentsBody = () => {
    if (enrolledStudents.length === 0) {
      return (
        <EmptyState
          title="No students enrolled"
          text={
            isAdmin
              ? "Click Add to enroll students in this subject."
              : "No students are currently enrolled in this subject."
          }
        />
      );
    }

    const q = studentSearchQuery.trim().toLowerCase();
    const visibleStudents = q
      ? enrolledStudents.filter((st) => {
          const name = getPersonDisplayName(st).toLowerCase();
          const email = (st.email || "").toLowerCase();
          const grade = (st.gradeTitle || "").toLowerCase();
          return name.includes(q) || email.includes(q) || grade.includes(q);
        })
      : enrolledStudents;

    return (
      <div className="space-y-3">
        {enrolledStudents.length > 2 && (
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Filter assigned students…"
              className="w-full form-input !pl-8 !min-h-0 !py-1.5 text-xs"
            />
          </div>
        )}

        {visibleStudents.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)] py-4 text-center">
            No students match &ldquo;{studentSearchQuery.trim()}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-card-border)]">
            {visibleStudents.map((student) => {
              const fullName = getPersonDisplayName(student);
              const subjCount =
                student.subjectsCount ??
                (Array.isArray(student.subjects) ? student.subjects.length : 0);

              return (
                <div
                  key={student._id}
                  onClick={() => setSelectedStudentDetail(student)}
                  className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 cursor-pointer hover:bg-[var(--row-bg)]/50 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar name={fullName} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-[var(--color-primary)] truncate">
                          {fullName}
                        </p>
                        {student.gradeTitle && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-primary)] font-medium">
                            {student.gradeTitle}
                          </span>
                        )}
                      </div>

                      {student.email && (
                        <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">
                          {student.email}
                        </p>
                      )}

                      {student.phone && (
                        <p className="text-[11px] text-[var(--color-muted)] truncate">
                          {student.phone}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {student.isSubscribed !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] font-medium">
                            {student.isSubscribed ? (
                              <CheckCircle2 size={11} />
                            ) : (
                              <XCircle size={11} />
                            )}
                            {student.isSubscribed
                              ? "Subscribed"
                              : "Unsubscribed"}
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] font-medium">
                          {subjCount} {subjCount === 1 ? "subject" : "subjects"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestRemoveMember("student", student._id, fullName);
                      }}
                      aria-label={`Remove ${fullName}`}
                      title="Remove student from subject"
                      className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors shrink-0"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const existingMemberIds = new Set(
    memberModalRole === "teacher"
      ? (subject?.teachers || []).map((t) => t._id)
      : enrolledStudents.map((s) => s._id),
  );

  const filteredCandidates = availableMembers.filter((person) => {
    if (existingMemberIds.has(person._id)) return false;
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    const name = getPersonDisplayName(person).toLowerCase();
    const email = (person.email || "").toLowerCase();
    const grade = (person.gradeTitle || "").toLowerCase();
    return name.includes(q) || email.includes(q) || grade.includes(q);
  });

  const modalRecordings: ClassRecording[] = Array.isArray(
    recordingsClass?.recordings,
  )
    ? recordingsClass.recordings
    : [];

  return (
    <div className="page space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        {isAdmin && subject && !subjectError && (
          <button
            type="button"
            onClick={() => setIsDeleteSubjectOpen(true)}
            className="btn btn-danger !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Delete subject</span>
          </button>
        )}
      </div>

      {subject && !subjectError && (
        <PageHeader
          eyebrow={
            subject.code ? `${gradeTitle} · ${subject.code}` : gradeTitle
          }
          title={subjectDisplayName}
          highlight={subjectDisplayName}
          subtitle={subject.description || "Course sessions and resources."}
          actions={<StatusPill status={isActive ? "active" : "inactive"} />}
        />
      )}

      {anyError && !anyLoading && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{anyError}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {anyLoading ? (
        <Panel title="Subject details">
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading subject details…</p>
          </div>
        </Panel>
      ) : (
        <>
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <Panel
                title={`Class sessions (${visibleClasses.length})`}
                actions={
                  canManage ? (
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>New session</span>
                    </button>
                  ) : undefined
                }
              >
                {renderClassesBody()}
              </Panel>

              <Panel
                title="Course resources"
                actions={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      ["assignment", "note", "announcement"] as ResourceType[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTab(t)}
                        className={`btn !min-h-0 !py-1.5 !px-3 text-xs capitalize ${
                          activeTab === t ? "btn-primary" : "btn-secondary"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                    {canManage && (
                      <button
                        type="button"
                        onClick={openAddResource}
                        className="btn btn-secondary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span className="capitalize">Add {activeTab}</span>
                      </button>
                    )}
                  </div>
                }
              >
                {renderResourcesBody()}
              </Panel>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Panel title="Subject overview">
                <div className="divide-y divide-[var(--color-card-border)] text-sm">
                  <div className="py-2.5 first:pt-0 flex items-center justify-between gap-2">
                    <span className="text-[var(--color-muted)]">Grade</span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {gradeTitle}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-[var(--color-muted)]">Code</span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {subject?.code || "—"}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-[var(--color-muted)]">Sessions</span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {visibleClasses.length}
                    </span>
                  </div>
                  {isAdmin && (
                    <>
                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-[var(--color-muted)]">
                          Teachers
                        </span>
                        <span className="font-medium text-[var(--color-primary)]">
                          {subject?.teachers?.length || 0}
                        </span>
                      </div>
                      <div className="py-2.5 last:pb-0 flex items-center justify-between gap-2">
                        <span className="text-[var(--color-muted)]">
                          Students
                        </span>
                        <span className="font-medium text-[var(--color-primary)]">
                          {enrolledStudents.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Panel>

              {isAdmin && (
                <>
                  <Panel
                    title={`Teachers (${subject?.teachers?.length || 0})`}
                    actions={
                      <button
                        type="button"
                        onClick={() => openAddMemberModal("teacher")}
                        className="btn btn-secondary !min-h-0 !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    }
                  >
                    {renderTeachersBody()}
                  </Panel>

                  <Panel
                    title={`Enrolled students (${enrolledStudents.length})`}
                    actions={
                      <button
                        type="button"
                        onClick={() => openAddMemberModal("student")}
                        className="btn btn-secondary !min-h-0 !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    }
                  >
                    {renderStudentsBody()}
                  </Panel>
                </>
              )}
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {mobileTab === "classes" && (
              <Panel
                title={`Class sessions (${visibleClasses.length})`}
                actions={
                  canManage ? (
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>New</span>
                    </button>
                  ) : undefined
                }
              >
                {renderClassesBody()}
              </Panel>
            )}

            {mobileTab === "assignments" && (
              <Panel
                title="Course resources"
                actions={
                  canManage ? (
                    <button
                      type="button"
                      onClick={openAddResource}
                      className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span className="capitalize">Add {activeTab}</span>
                    </button>
                  ) : undefined
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(
                      ["assignment", "note", "announcement"] as ResourceType[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTab(t)}
                        className={`btn !min-h-0 !py-1.5 !px-3 text-xs capitalize whitespace-nowrap ${
                          activeTab === t ? "btn-primary" : "btn-secondary"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                  {renderResourcesBody()}
                </div>
              </Panel>
            )}

            {isAdmin && mobileTab === "teachers" && (
              <Panel
                title={`Teachers (${subject?.teachers?.length || 0})`}
                actions={
                  <button
                    type="button"
                    onClick={() => openAddMemberModal("teacher")}
                    className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                }
              >
                {renderTeachersBody()}
              </Panel>
            )}

            {isAdmin && mobileTab === "students" && (
              <Panel
                title={`Enrolled students (${enrolledStudents.length})`}
                actions={
                  <button
                    type="button"
                    onClick={() => openAddMemberModal("student")}
                    className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                }
              >
                {renderStudentsBody()}
              </Panel>
            )}
          </div>
        </>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-card-border)]">
        <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActiveTab = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                  isActiveTab
                    ? "text-[var(--color-primary)] font-semibold"
                    : "text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                }`}
              >
                <Icon size={17} />
                <span className="text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {selectedStudentDetail && (
          <Modal
            title="Student details"
            onClose={() => setSelectedStudentDetail(null)}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 pb-3 border-b border-[var(--color-card-border)]">
                <Avatar
                  name={getPersonDisplayName(selectedStudentDetail)}
                  size={46}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--color-primary)] truncate">
                    {getPersonDisplayName(selectedStudentDetail)}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Student ID: {selectedStudentDetail._id}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[var(--color-card-border)] text-sm">
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)] inline-flex items-center gap-1.5">
                    <Mail size={14} /> Email
                  </span>
                  <span className="font-medium text-[var(--color-primary)] truncate">
                    {selectedStudentDetail.email || "—"}
                  </span>
                </div>

                {selectedStudentDetail.phone && (
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-[var(--color-muted)]">Phone</span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {selectedStudentDetail.phone}
                    </span>
                  </div>
                )}

                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)] inline-flex items-center gap-1.5">
                    <GraduationCap size={14} /> Grade
                  </span>
                  <span className="font-medium text-[var(--color-primary)]">
                    {selectedStudentDetail.gradeTitle || gradeTitle || "—"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">
                    Subscription
                  </span>
                  <span className="font-medium text-[var(--color-primary)]">
                    {selectedStudentDetail.isSubscribed === undefined
                      ? "—"
                      : selectedStudentDetail.isSubscribed
                        ? "Active / Subscribed"
                        : "Unsubscribed"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">
                    Enrolled subjects
                  </span>
                  <span className="font-medium text-[var(--color-primary)]">
                    {selectedStudentDetail.subjectsCount ??
                      selectedStudentDetail.subjects?.length ??
                      0}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="btn btn-secondary !min-h-0 !py-2 !px-4 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {isAdmin && recordingsClass && (
          <Modal
            title={`Recordings · ${recordingsClass.title?.trim() || "Session"}`}
            onClose={() => setRecordingsClass(null)}
          >
            {modalRecordings.length === 0 ? (
              <EmptyState
                title="No recordings yet"
                text="No audio recordings have been saved for this session."
              />
            ) : (
              <div className="space-y-3">
                {modalRecordings.map((rec, idx) => {
                  const recKey = getRecordingKey(rec, idx);
                  const fileLabel = rec.fileName || `Recording ${idx + 1}`;
                  const durationText = formatDuration(rec.durationSec);
                  const isPlaying = playingRecordingKey === recKey;

                  return (
                    <div
                      key={recKey}
                      className="p-3.5 rounded-2xl border border-[var(--color-card-border)] bg-[var(--row-bg)]/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="p-2 rounded-xl bg-[var(--color-card)] text-[var(--color-primary)] shrink-0 mt-0.5">
                            <Volume2 size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] truncate">
                              {fileLabel}
                            </p>
                            <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                              {[
                                rec.recordedBy && `By ${rec.recordedBy}`,
                                durationText,
                                rec.recordedAt &&
                                  new Date(rec.recordedAt).toLocaleString(),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayRecording(recKey)}
                            className="btn btn-secondary !min-h-0 !py-1.5 !px-2.5 text-xs inline-flex items-center gap-1"
                          >
                            {isPlaying ? (
                              <>
                                <Pause size={13} />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play size={13} />
                                <span>Play</span>
                              </>
                            )}
                          </button>

                          <a
                            href={rec.url}
                            download={fileLabel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary !min-h-0 !py-1.5 !px-2.5 text-xs inline-flex items-center gap-1"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              setPendingRemoveRecording({
                                classId: recordingsClass._id,
                                recording: rec,
                                key: recKey,
                                label: fileLabel,
                              })
                            }
                            aria-label={`Remove ${fileLabel}`}
                            title="Remove recording"
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <audio
                        ref={(el) => {
                          audioElementsRef.current[recKey] = el;
                        }}
                        controls
                        preload="metadata"
                        src={rec.url}
                        onPlay={() => {
                          Object.entries(audioElementsRef.current).forEach(
                            ([key, el]) => {
                              if (key !== recKey && el && !el.paused) {
                                el.pause();
                              }
                            },
                          );
                          setPlayingRecordingKey(recKey);
                        }}
                        onPause={() => {
                          setPlayingRecordingKey((prev) =>
                            prev === recKey ? null : prev,
                          );
                        }}
                        onEnded={() => {
                          setPlayingRecordingKey((prev) =>
                            prev === recKey ? null : prev,
                          );
                        }}
                        className="w-full h-9"
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
        )}

        {pendingRemoveRecording && (
          <Modal
            title="Remove recording"
            onClose={() => {
              if (!removingRecording) setPendingRemoveRecording(null);
            }}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                  Remove {pendingRemoveRecording.label}?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This removes this recording from the session list.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingRemoveRecording(null)}
                  disabled={removingRecording}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveRecording}
                  disabled={removingRecording}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {removingRecording && (
                    <Loader2 className="animate-spin" size={15} />
                  )}
                  <span>Confirm remove</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {pendingRemoveMember && (
          <Modal
            title={`Remove ${pendingRemoveMember.role}`}
            onClose={closeRemoveMemberModal}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <UserMinus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                  Remove {pendingRemoveMember.name}?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This removes this {pendingRemoveMember.role} from{" "}
                  <span className="font-medium text-[var(--color-primary)]">
                    {subjectDisplayName}
                  </span>
                  .
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeRemoveMemberModal}
                  disabled={removingMember}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveMember}
                  disabled={removingMember}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {removingMember && (
                    <Loader2 className="animate-spin" size={15} />
                  )}
                  <span>Confirm remove</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {memberModalRole && (
          <Modal
            title={`Add ${memberModalRole === "teacher" ? "teachers" : "students"} to ${subjectDisplayName}`}
            onClose={closeAddMemberModal}
          >
            <form onSubmit={handleAddMembersSubmit} className="space-y-4">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={`Search ${memberModalRole}s by name, email, or grade…`}
                  className="w-full form-input !pl-8 !min-h-0 !py-2 text-xs"
                />
              </div>

              {loadingMembersList ? (
                <div className="flex items-center justify-center py-8 gap-2 text-xs text-[var(--color-muted)]">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading {memberModalRole}s…</span>
                </div>
              ) : filteredCandidates.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCandidates.map((person) => {
                    const checked = selectedMemberIds.includes(person._id);
                    const fullName = getPersonDisplayName(person);
                    return (
                      <label
                        key={person._id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? "border-[var(--color-primary)] bg-[var(--row-bg)]"
                            : "border-[var(--color-card-border)] hover:bg-[var(--row-bg)]/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCandidateSelection(person._id)}
                          className="rounded border-[var(--color-card-border)] accent-[var(--color-primary)]"
                        />
                        <Avatar name={fullName} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--color-primary)] truncate">
                            {fullName}
                          </p>
                          <p className="text-[11px] text-[var(--color-muted)] truncate">
                            {[person.email, person.gradeTitle]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-muted)] py-4 text-center">
                  No additional {memberModalRole}s available to add.
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeAddMemberModal}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMembers || selectedMemberIds.length === 0}
                  className="btn btn-primary flex-1 justify-center inline-flex items-center gap-2"
                >
                  {savingMembers ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                  <span>
                    Add{" "}
                    {memberModalRole === "teacher" ? "teachers" : "students"}
                  </span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {isDeleteSubjectOpen && (
          <Modal title="Delete subject" onClose={closeDeleteSubject}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                  Delete {subjectDisplayName}?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This permanently removes this subject and its associated data.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteSubject}
                  disabled={deletingSubject}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSubject}
                  disabled={deletingSubject}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {deletingSubject && (
                    <Loader2 className="animate-spin" size={15} />
                  )}
                  <span>Confirm delete</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {(isAddResourceOpen || isEditResourceOpen) && (
          <Modal
            title={`${isEditResourceOpen ? "Update" : "Add"} ${activeTab}`}
            onClose={isAddResourceOpen ? closeAddResource : closeEditResource}
          >
            <form onSubmit={handleSaveResource} className="space-y-4">
              <InputGroup
                label="Title"
                name="title"
                value={resourceForm.title}
                onChange={handleResourceChange}
                required
                placeholder="e.g. Lecture Notes #04"
              />
              {resourceSubmitted && !resourceForm.title.trim() && (
                <p className="text-xs font-medium text-[var(--color-danger)]">
                  Title is required.
                </p>
              )}
              <div className="space-y-1.5">
                <label className="form-label block">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={resourceForm.description}
                  onChange={handleResourceChange}
                  rows={4}
                  className="form-input w-full resize-none"
                  placeholder="Provide context or instructions…"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={
                    isAddResourceOpen ? closeAddResource : closeEditResource
                  }
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resourceSaving}
                  className="btn btn-primary flex-1 justify-center inline-flex items-center gap-2"
                >
                  {resourceSaving ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                  <span>
                    {isEditResourceOpen ? "Save changes" : `Post ${activeTab}`}
                  </span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {isDeleteClassOpen && (
          <Modal title="Remove session" onClose={closeDeleteClass}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                  Remove session?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This removes this class and its schedule rules from the
                  timetable.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteClass}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClass}
                  disabled={deletingClass}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {deletingClass && (
                    <Loader2 className="animate-spin" size={15} />
                  )}
                  <span>Confirm delete</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {isDeleteResourceOpen && (
          <Modal title={`Delete ${activeTab}`} onClose={closeDeleteResource}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] capitalize">
                  Delete {activeTab}?
                </h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  Once deleted, students can no longer access this item.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteResource}
                  className="btn btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteResource}
                  disabled={deletingResource}
                  className="btn btn-danger flex-1 justify-center inline-flex items-center gap-2"
                >
                  {deletingResource && (
                    <Loader2 className="animate-spin" size={15} />
                  )}
                  <span>Delete now</span>
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6"
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/45 backdrop-blur-xs"
    />
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 12 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--color-primary)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
    </motion.div>
  </div>
);

const InputGroup = ({
  label,
  ...props
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="form-label block">{label}</label>
    <input {...props} className="w-full form-input" />
  </div>
);

const ClassCard = ({
  cls,
  assignedStudents,
  canManage,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
  onViewRecordings,
  onToggleStudents,
  isStudentsExpanded,
  renderStudentsSection,
}: {
  cls: ClassSessionRecord;
  assignedStudents: StudentDetail[];
  canManage: boolean;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewRecordings: () => void;
  onToggleStudents: () => void;
  isStudentsExpanded: boolean;
  renderStudentsSection: () => ReactNode;
}) => {
  const status: string = cls.status || "upcoming";
  const isRecurring =
    Array.isArray(cls.schedules) &&
    cls.schedules.some((s) => {
      if (!s || typeof s !== "object") return false;
      const freq = (s as { frequency?: unknown }).frequency;
      return typeof freq === "string" && freq !== "none";
    });
  const studentCount = assignedStudents.length;
  const recordingsCount = Array.isArray(cls.recordings)
    ? cls.recordings.length
    : 0;
  const displayTitle = cls.title?.trim() || "Untitled Session";

  return (
    <div
      onClick={onOpen}
      className="py-3.5 first:pt-1 last:pb-1 flex flex-col justify-between gap-2.5 cursor-pointer hover:bg-[var(--row-bg)]/50 rounded-2xl px-2 -mx-2 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="p-2 rounded-xl bg-[var(--row-bg)] text-[var(--color-primary)] shrink-0 mt-0.5">
            {isRecurring ? <Repeat size={15} /> : <Calendar size={15} />}
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-[var(--color-primary)] break-words">
                {displayTitle}
              </h4>
              <StatusPill status={status} />
            </div>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {summarizeSchedules(cls.schedules)}
            </p>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStudents();
                  }}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors font-medium"
                >
                  <Users size={12} />
                  <span>
                    {studentCount} {studentCount === 1 ? "student" : "students"}
                  </span>
                  {isStudentsExpanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <Disc size={12} />
                  <span>
                    {recordingsCount}{" "}
                    {recordingsCount === 1 ? "recording" : "recordings"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 shrink-0 self-end sm:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isAdmin && (
            <button
              type="button"
              onClick={onViewRecordings}
              className="btn btn-secondary !min-h-0 !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
            >
              <Disc size={13} />
              <span>Recordings ({recordingsCount})</span>
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${displayTitle}`}
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${displayTitle}`}
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {renderStudentsSection()}
    </div>
  );
};
