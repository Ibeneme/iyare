import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DateInput";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  fetchTracker,
  assignTask,
} from "../../../store/features/tasks/tasks.slice";
import {
  fetchAllUsersByType,
  fetchUserById,
} from "../../../store/features/users/users.slice";
import type { TaskPriority, TaskStatus } from "../../../store/models";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";
import { day, personName } from "../../../lib/format";

type AssigneeKind = "teacher" | "admin" | "student" | "parent";

interface UserRecord {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  userType?: string;
  role?: string;
  isSuspended?: boolean;
}

interface AssigneeDetails {
  name: string;
  email: string;
  userType: string;
}

const getFullName = (person: any): string => {
  if (!person || typeof person === "string") return "";
  if (person.name && String(person.name).trim()) {
    return String(person.name).trim();
  }
  return `${person.firstName || ""} ${person.lastName || ""}`.trim();
};

const extractAssigneeDetails = (
  rawAssignee: any,
  fallbackType?: string,
): Partial<AssigneeDetails> => {
  if (!rawAssignee || typeof rawAssignee === "string") {
    return { userType: fallbackType || "" };
  }
  const fullName = getFullName(rawAssignee);
  const email = rawAssignee.email ? String(rawAssignee.email).trim() : "";
  const userType = String(
    rawAssignee.userType || rawAssignee.role || fallbackType || "",
  ).trim();

  return {
    name: fullName || email || "",
    email,
    userType,
  };
};

export default function TaskTrackerPage() {
  const dispatch = useAppDispatch();
  const { tracker, perAssignee } = useAppSelector((s) => s.tasks);
  const allUsersMap = useAppSelector(
    (s) => (s.users as any).allUsers ?? {},
  ) as Partial<Record<AssigneeKind, UserRecord[]>>;

  const teachers = useMemo(
    () => (allUsersMap.teacher ?? []).filter((t) => !t?.isSuspended),
    [allUsersMap.teacher],
  );

  const [fetchedUsers, setFetchedUsers] = useState<
    Record<string, AssigneeDetails>
  >({});
  const [filter, setFilter] = useState<{
    status: "" | TaskStatus;
    overdue: boolean;
  }>({
    status: "",
    overdue: false,
  });
  const [form, setForm] = useState({
    assigneeId: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
  });

  const load = () =>
    dispatch(
      fetchTracker({
        status: filter.status || undefined,
        overdue: filter.overdue || undefined,
      }),
    );

  useEffect(() => {
    void dispatch(fetchAllUsersByType("teacher"));
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [filter.status, filter.overdue]); // eslint-disable-line

  const usersById = useMemo(() => {
    const map: Record<string, AssigneeDetails> = {};
    const kinds: AssigneeKind[] = ["teacher", "admin", "student", "parent"];

    kinds.forEach((kind) => {
      const list = allUsersMap[kind] ?? [];
      list.forEach((u) => {
        if (!u?._id) return;
        const fullName = getFullName(u);
        const email = u.email ? String(u.email).trim() : "";
        map[u._id] = {
          name: fullName || email || u._id,
          email,
          userType: String(u.userType || u.role || kind).trim(),
        };
      });
    });

    return map;
  }, [allUsersMap]);

  // Fetch full details for any task assignee whose name/email is missing
  useEffect(() => {
    const missing: Array<{ id: string; userType: AssigneeKind }> = [];

    tracker.forEach((t) => {
      const raw = t.assignedTo?.id;
      const id = typeof raw === "string" ? raw : raw?._id || "";
      if (!id) return;

      const inline = extractAssigneeDetails(raw, t.assignedTo?.type);
      const storeUser = usersById[id];
      const cached = fetchedUsers[id];

      const hasName = Boolean(
        personName(raw) || inline.name || storeUser?.name || cached?.name,
      );
      const hasEmail = Boolean(
        inline.email || storeUser?.email || cached?.email,
      );

      if (!hasName || !hasEmail) {
        const inferredType = (t.assignedTo?.type ||
          inline.userType ||
          storeUser?.userType ||
          "teacher") as AssigneeKind;
        missing.push({ id, userType: inferredType });
      }
    });

    const uniqueMissing = Array.from(
      new Map(missing.map((item) => [item.id, item])).values(),
    );

    if (uniqueMissing.length === 0) return;

    let cancelled = false;
    Promise.all(
      uniqueMissing.map(async ({ id, userType }) => {
        try {
          const res: any = await dispatch(
            fetchUserById({ id, userType }),
          ).unwrap();
          const u = res?.data || res;
          if (!u?._id) return null;
          const fullName = getFullName(u);
          const email = u.email ? String(u.email).trim() : "";
          return {
            id: u._id,
            details: {
              name: fullName || email || u._id,
              email,
              userType: String(u.userType || u.role || userType).trim(),
            },
          };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, AssigneeDetails> = {};
      results.forEach((item) => {
        if (item) next[item.id] = item.details;
      });
      if (Object.keys(next).length > 0) {
        setFetchedUsers((prev) => ({ ...prev, ...next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tracker, usersById, fetchedUsers, dispatch]);

  const resolveAssignee = (
    rawAssignee: any,
    fallbackType?: string,
  ): AssigneeDetails => {
    const id =
      typeof rawAssignee === "string" ? rawAssignee : rawAssignee?._id || "";
    const inline = extractAssigneeDetails(rawAssignee, fallbackType);
    const storeUser = id ? usersById[id] : undefined;
    const fetchedUser = id ? fetchedUsers[id] : undefined;

    const resolvedName =
      personName(rawAssignee) ||
      inline.name ||
      storeUser?.name ||
      fetchedUser?.name ||
      id ||
      "-";

    const resolvedEmail =
      inline.email || storeUser?.email || fetchedUser?.email || "";

    const resolvedType =
      inline.userType ||
      storeUser?.userType ||
      fetchedUser?.userType ||
      fallbackType ||
      "teacher";

    return {
      name: resolvedName,
      email: resolvedEmail,
      userType: resolvedType,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assigneeId || !form.title.trim()) {
      return toast.error("Pick a teacher and give the task a title");
    }
    const r = await dispatch(
      assignTask({
        ...form,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
        assigneeType: "teacher",
      }),
    );
    if (assignTask.fulfilled.match(r)) {
      toast.success("Task assigned");
      setForm({ ...form, title: "", description: "", dueDate: "" });
      load();
    } else {
      toast.error(String(r.payload));
    }
  };

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Task tracker"
        highlight="tracker"
        subtitle="Assign work to teachers and see where everything stands."
      />

      <Panel title="Assign a task">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_2fr_1fr_1fr_auto] gap-3 sm:gap-4 lg:items-end"
        >
          <label className="min-w-0">
            <span className="form-label">Teacher</span>
            <Select
              className="form-input w-full"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">Choose…</option>
              {teachers.map((t) => {
                const label = getFullName(t) || t.email || t._id;
                return (
                  <option key={t._id} value={t._id}>
                    {label}
                    {t.email && !label.includes(t.email) ? ` (${t.email})` : ""}
                  </option>
                );
              })}
            </Select>
          </label>
          <label className="min-w-0">
            <span className="form-label">Title</span>
            <input
              className="form-input w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="min-w-0">
            <span className="form-label">Priority</span>
            <Select
              className="form-input w-full"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as TaskPriority })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </label>
          <label className="min-w-0">
            <span className="form-label">Due</span>
            <DateInput
              type="date"
              className="form-input w-full"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
          <button
            className="btn btn-primary w-full lg:w-auto justify-center shrink-0"
            type="submit"
          >
            <Send size={16} /> Assign
          </button>
        </form>
      </Panel>

      <Panel
        title="All tasks"
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <Select
              className="form-input w-full sm:!w-auto !min-h-0 !py-1.5"
              value={filter.status}
              onChange={(e) =>
                setFilter({ ...filter, status: e.target.value as any })
              }
            >
              <option value="">Any status</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={filter.overdue}
                onChange={(e) =>
                  setFilter({ ...filter, overdue: e.target.checked })
                }
              />{" "}
              Overdue only
            </label>
          </div>
        }
      >
        {tracker.length === 0 ? (
          <EmptyState
            title="No tasks match"
            text="Try clearing the filters or assign a task above."
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[var(--color-card-border)]">
              {tracker.map((t) => {
                const rawAssignee = t.assignedTo?.id;
                const id =
                  typeof rawAssignee === "string"
                    ? rawAssignee
                    : rawAssignee?._id || "";
                const counts = perAssignee[id];
                const assignee = resolveAssignee(
                  rawAssignee,
                  t.assignedTo?.type,
                );

                return (
                  <div
                    key={t._id}
                    className="py-3.5 first:pt-1 last:pb-1 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm break-words">
                        {t.title}
                      </p>
                      <span className="text-xs text-[var(--color-muted)] shrink-0">
                        {day(t.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Avatar name={assignee.name} size={28} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {assignee.name}
                          </span>
                          {assignee.userType && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)]">
                              {assignee.userType}
                            </span>
                          )}
                          {counts && (
                            <span className="text-[11px] text-[var(--color-muted)]">
                              {counts.done ?? 0}/
                              {(counts.todo ?? 0) +
                                (counts.in_progress ?? 0) +
                                (counts.done ?? 0)}{" "}
                              done
                            </span>
                          )}
                        </div>
                        {assignee.email && (
                          <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">
                            {assignee.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <StatusPill status={t.priority} />
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Task</th>
                    <th className="py-2 px-4">Assigned to</th>
                    <th className="py-2 px-4 whitespace-nowrap">Due</th>
                    <th className="py-2 px-4 whitespace-nowrap">Priority</th>
                    <th className="py-2 pl-4 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-card-border)]">
                  {tracker.map((t) => {
                    const rawAssignee = t.assignedTo?.id;
                    const id =
                      typeof rawAssignee === "string"
                        ? rawAssignee
                        : rawAssignee?._id || "";
                    const counts = perAssignee[id];
                    const assignee = resolveAssignee(
                      rawAssignee,
                      t.assignedTo?.type,
                    );

                    return (
                      <tr key={t._id}>
                        <td className="py-3 pr-4 font-medium">{t.title}</td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-2.5 align-middle">
                            <Avatar name={assignee.name} size={26} />
                            <div className="leading-tight">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {assignee.name}
                                </span>
                                {assignee.userType && (
                                  <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)]">
                                    {assignee.userType}
                                  </span>
                                )}
                                {counts && (
                                  <span className="text-xs text-[var(--color-muted)]">
                                    {counts.done ?? 0}/
                                    {(counts.todo ?? 0) +
                                      (counts.in_progress ?? 0) +
                                      (counts.done ?? 0)}{" "}
                                    done
                                  </span>
                                )}
                              </div>
                              {assignee.email && (
                                <div className="text-xs text-[var(--color-muted)] break-all">
                                  {assignee.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {day(t.dueDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusPill status={t.priority} />
                        </td>
                        <td className="py-3 pl-4 whitespace-nowrap">
                          <StatusPill status={t.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
