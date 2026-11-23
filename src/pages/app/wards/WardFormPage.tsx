import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchCatalogue, addWard } from "../../../store/features/wards/wards.slice";
import { FormShell, Select } from "../../../components/ui";
import { PATHS } from "../../../routes/paths";

/** Dedicated page: add a child, choose their class and subjects. */
export default function WardFormPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const catalogue = useAppSelector((s) => s.wards.catalogue);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", gradeId: "", subjects: [] as string[] });
  const [busy, setBusy] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const eyeIconRef = useRef<SVGSVGElement>(null);
  const eyeOffIconRef = useRef<SVGSVGElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => void dispatch(fetchCatalogue()), [dispatch]);

  const handleTogglePassword = () => {
    const input = passwordInputRef.current;
    if (!input) return;
    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    toggleBtnRef.current?.setAttribute("aria-pressed", String(!isVisible));
    toggleBtnRef.current?.setAttribute(
      "aria-label",
      !isVisible ? "Hide password" : "Show password",
    );
    if (eyeIconRef.current) {
      eyeIconRef.current.style.display = !isVisible ? "none" : "";
    }
    if (eyeOffIconRef.current) {
      eyeOffIconRef.current.style.display = !isVisible ? "" : "none";
    }
  };

  const subs = (catalogue?.subjects ?? []).filter((s: any) => !f.gradeId || !s.gradeLevel || String(s.gradeLevel) === f.gradeId);
  const toggle = (id: string) => setF((x) => ({ ...x, subjects: x.subjects.includes(id) ? x.subjects.filter((y) => y !== id) : [...x.subjects, id] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await dispatch(addWard(f as any));
    setBusy(false);
    if (addWard.fulfilled.match(r)) { toast.success(`${f.firstName} added`); nav(PATHS.wards); } else toast.error(String(r.payload));
  };

  return (
    <FormShell backTo={PATHS.wards} backLabel="Back to my children" eyebrow="Family" title="Add a child" highlight="child" subtitle="They sign in with the email and password you set here.">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label><span className="form-label">First name</span><input required className="form-input" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
        <label><span className="form-label">Last name</span><input required className="form-input" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></label>
        <label><span className="form-label">Email</span><input required type="email" className="form-input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block">
          <span className="form-label">Password</span>
          <div className="relative">
            <input
              ref={passwordInputRef}
              required
              minLength={8}
              type="password"
              className="form-input w-full pr-10"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
            <button
              ref={toggleBtnRef}
              type="button"
              onClick={handleTogglePassword}
              aria-label="Show password"
              aria-pressed={false}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Eye ref={eyeIconRef} size={16} />
              <EyeOff ref={eyeOffIconRef} size={16} style={{ display: "none" }} />
            </button>
          </div>
        </label>
        <label className="md:col-span-2"><span className="form-label">Class</span>
          <Select required value={f.gradeId} onChange={(e) => setF({ ...f, gradeId: e.target.value, subjects: [] })}>
            <option value="">Choose a class…</option>
            {catalogue?.grades.map((g) => <option key={g._id} value={g._id}>{g.title}</option>)}
          </Select></label>
        <fieldset className="md:col-span-2"><legend className="form-label">Subjects</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {subs.length === 0 && <p className="text-sm text-[var(--color-muted)]">Pick a class to see its subjects.</p>}
            {subs.map((s) => (
              <label key={s._id} className="flex items-center gap-3 rounded-2xl border border-[var(--color-card-border)] px-4 py-2.5 cursor-pointer"><input type="checkbox" checked={f.subjects.includes(s._id)} onChange={() => toggle(s._id)} />{s.name}</label>
            ))}
          </div></fieldset>
        <div className="md:col-span-2 flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => nav(PATHS.wards)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save child"}</button></div>
      </form>
    </FormShell>
  );
}