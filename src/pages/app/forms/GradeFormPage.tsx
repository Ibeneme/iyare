import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../../store";
import { createGrade, updateGrade, fetchGradeById } from "../../../store/features/grades/grades.slice";
import { FormShell } from "../../../components/ui";
import { PATHS } from "../../../routes/paths";

/** Dedicated page to add or edit a class level (grade). */
export default function GradeFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [f, setF] = useState({ title: "", description: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchGradeById(id)).then((r: any) => r.payload?._id && setF({ title: r.payload.title || "", description: r.payload.description || "" }));
  }, [dispatch, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (id) await dispatch(updateGrade({ id, data: f })).unwrap();
      else await dispatch(createGrade(f)).unwrap();
      toast.success(id ? "Level updated" : "Level created");
      nav(PATHS.grades);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell backTo={PATHS.grades} backLabel="Back to levels" eyebrow="Levels" title={id ? "Edit level" : "Add a level"} highlight="level">
      <form onSubmit={submit} className="grid gap-4">
        <label><span className="form-label">Title</span><input required className="form-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Primary 4" /></label>
        <label><span className="form-label">Description</span><textarea rows={4} className="form-input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <div className="flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => nav(PATHS.grades)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Create level"}</button></div>
      </form>
    </FormShell>
  );
}
