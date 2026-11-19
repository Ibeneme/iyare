import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../../store";
import { createClass, updateClass } from "../../../store/features/classes/legacyAdminClasses.slice";
import { useUserActions } from "../../../hooks/useUsers";
import { FormShell, Select, DateInput } from "../../../components/ui";

type Opt = { _id: string; title?: string; name?: string; firstName?: string; lastName?: string };
const nameOf = (o: Opt) => o.title || o.name || `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim();

/** Dedicated page to schedule a class (and to edit one). */
export default function ClassFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { getAllUsersByType } = useUserActions();
  const [teachers, setTeachers] = useState<Opt[]>([]);
  const [courses, setCourses] = useState<Opt[]>([]);
  const [f, setF] = useState({ title: "", courseId: "", teacherId: "", date: "", time: "", duration: "60" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAllUsersByType("teacher").then((r: any) => r.success && setTeachers(r.data || []));
    getAllUsersByType("course").then((r: any) => r.success && setCourses(r.data || []));
  }, []); // eslint-disable-line

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c._id === f.courseId);
    if (!course) return toast.error("Choose a course");
    setBusy(true);
    const body = { ...f, course: nameOf(course), duration: Number(f.duration) } as any;
    const r: any = id ? await dispatch(updateClass({ id, data: body })) : await dispatch(createClass(body));
    setBusy(false);
    if (r.error) return toast.error(String(r.payload || "Could not save"));
    toast.success(id ? "Class updated" : "Class scheduled");
    nav("/app/manage/classes/all");
  };

  return (
    <FormShell backTo="/app/manage/classes/all" backLabel="Back to classes" eyebrow="Classes" title={id ? "Edit class" : "Schedule a class"} highlight="class">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2"><span className="form-label">Class title</span><input required className="form-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label><span className="form-label">Course</span><Select required value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}><option value="">Choose…</option>{courses.map((c) => <option key={c._id} value={c._id}>{nameOf(c)}</option>)}</Select></label>
        <label><span className="form-label">Teacher</span><Select required value={f.teacherId} onChange={(e) => setF({ ...f, teacherId: e.target.value })}><option value="">Choose…</option>{teachers.map((c) => <option key={c._id} value={c._id}>{nameOf(c)}</option>)}</Select></label>
        <label><span className="form-label">Date</span><DateInput required type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label><span className="form-label">Start time</span><DateInput required type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></label>
        <label><span className="form-label">Duration (minutes)</span><input required type="number" min={10} className="form-input" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></label>
        <div className="md:col-span-2 flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => nav("/app/manage/classes/all")}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Schedule class"}</button></div>
      </form>
    </FormShell>
  );
}
