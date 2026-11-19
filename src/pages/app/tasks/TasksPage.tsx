import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DateInput";
import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarClock, Flag, Loader2, KanbanSquare } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchMyBoard, createOwnTask, updateTask, deleteTask, moveLocal } from "../../../store/features/tasks/tasks.slice";
import type { Task, TaskPriority, TaskStatus } from "../../../store/models";
import { PageHeader, Panel, EmptyState, StatCard } from "../../../components/ui";
import { day } from "../../../lib/format";

const COLS: { key: TaskStatus; label: string; tone: string }[] = [
  { key: "todo", label: "To do", tone: "pill--yellow" },
  { key: "in_progress", label: "In progress", tone: "pill--green" },
  { key: "done", label: "Done", tone: "pill--green" },
];
const PRIORITY: Record<TaskPriority, string> = { low: "badge-gray", medium: "badge-yellow", high: "badge-red" };

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { board, status } = useAppSelector((s) => s.tasks);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as TaskPriority, dueDate: "" });
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => void dispatch(fetchMyBoard()), [dispatch]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const r = await dispatch(createOwnTask({ title: form.title.trim(), description: form.description || undefined, priority: form.priority, dueDate: form.dueDate || undefined }));
    if (createOwnTask.fulfilled.match(r)) {
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
      dispatch(fetchMyBoard());
      toast.success("Task added");
    } else toast.error(String(r.payload));
  };

  const move = async (t: Task, to: TaskStatus) => {
    if (t.status === to) return;
    dispatch(moveLocal({ id: t._id, to }));
    const r = await dispatch(updateTask({ id: t._id, changes: { status: to } }));
    if (updateTask.rejected.match(r)) {
      toast.error(String(r.payload));
      dispatch(fetchMyBoard()); // put it back where the server has it
    }
  };

  const remove = async (t: Task) => {
    const r = await dispatch(deleteTask(t._id));
    if (deleteTask.rejected.match(r)) toast.error(String(r.payload));
  };

  const total = board.todo.length + board.in_progress.length + board.done.length;

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" title="My tasks" highlight="tasks" subtitle="Your own to-dos and anything the admin has assigned to you." />

      <div className="grid-stats">
        <StatCard label="All tasks" value={total} tone="plain" icon={KanbanSquare} />
        <StatCard label="To do" value={board.todo.length} tone="yellow" />
        <StatCard label="In progress" value={board.in_progress.length} tone="green" />
        <StatCard label="Done" value={board.done.length} tone="sand" />
      </div>

      <Panel title="Add a task">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_1fr_auto] items-end">
          <label><span className="form-label">Title</span><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mark Primary 4 maths tests" /></label>
          <label><span className="form-label">Details</span><input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></label>
          <label><span className="form-label">Priority</span>
            <Select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </Select>
          </label>
          <label><span className="form-label">Due</span><DateInput type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          <button className="btn btn-primary" type="submit"><Plus size={16} /> Add</button>
        </form>
      </Panel>

      {status === "loading" && !total ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLS.map((c) => (
            <section
              key={c.key}
              className="panel !p-4 min-h-[14rem]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const t = Object.values(board).flat().find((x) => x._id === dragId);
                if (t) move(t, c.key);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`pill ${c.tone}`}>{c.label}</span>
                <span className="text-xs text-[var(--color-muted)]">{board[c.key].length}</span>
              </div>
              <div className="space-y-3">
                {board[c.key].length === 0 && <EmptyState title="Nothing here" text="Drag a card in or add a task." />}
                {board[c.key].map((t) => (
                  <article key={t._id} draggable onDragStart={() => setDragId(t._id)} className="card !p-3.5 cursor-grab active:cursor-grabbing">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[var(--color-primary)]">{t.title}</h3>
                      {!t.assignedByAdmin && (
                        <button aria-label="Delete task" className="text-[var(--color-muted)] hover:text-red-600" onClick={() => remove(t)}><Trash2 size={14} /></button>
                      )}
                    </div>
                    {t.description && <p className="text-xs text-[var(--color-muted)] mt-1">{t.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                      <span className={`badge ${PRIORITY[t.priority]}`}><Flag size={11} /> {t.priority}</span>
                      {t.dueDate && <span className="inline-flex items-center gap-1 text-[var(--color-muted)]"><CalendarClock size={12} />{day(t.dueDate)}</span>}
                      {t.assignedByAdmin && <span className="pill pill--yellow">From admin</span>}
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      {COLS.filter((x) => x.key !== t.status).map((x) => (
                        <button key={x.key} className="btn btn-secondary !min-h-0 !py-1 !px-3 text-xs" onClick={() => move(t, x.key)}>{x.label}</button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
