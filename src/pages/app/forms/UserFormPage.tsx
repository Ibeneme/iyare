import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronDown, Search, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import { createUser, updateUser, fetchUserById, fetchAllUsersByType } from "../../../store/features/users/users.slice";
import { addAdmin } from "../../../store/features/auth/auth.slice";
import { fetchGrades, fetchSubjectsByGrade } from "../../../store/features/grades/grades.slice";
import { FormShell, Avatar } from "../../../components/ui";
import { buildPath, PATHS } from "../../../routes/paths";

type Kind = "admin" | "teacher" | "student" | "parent";
const LABEL: Record<Kind, string> = { admin: "admin", teacher: "teacher", student: "student", parent: "parent" };

interface ParentOption {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isSuspended?: boolean;
}

const getParentDisplayName = (p?: Partial<ParentOption> | null): string => {
  if (!p) return "";
  if (p.name && p.name.trim()) return p.name.trim();
  const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
  return fullName || p.email || p.phoneNumber || "Unnamed parent";
};

function SearchableParentSelect({
  value,
  onChange,
  parents,
}: {
  value: string;
  onChange: (nextId: string) => void;
  parents: Array<ParentOption & { displayName: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedParent = useMemo(
    () => parents.find((p) => p._id === value) || null,
    [parents, value]
  );

  const filteredParents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => {
      const hay = `${p.displayName} ${p.name || ""} ${p.firstName || ""} ${p.lastName || ""} ${p.email || ""} ${p.phoneNumber || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [parents, query]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const pick = (nextId: string) => {
    onChange(nextId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="form-input w-full flex items-center justify-between gap-3 text-left pr-4"
      >
        <span className={selectedParent ? "text-[var(--color-primary)] font-medium truncate" : "text-[var(--color-muted)] truncate"}>
          {selectedParent
            ? `${selectedParent.displayName}${selectedParent.email ? ` (${selectedParent.email})` : ""}`
            : "No parent yet"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-muted)] shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 rounded-2xl bg-[var(--color-card)] border border-[var(--color-card-border)] shadow-[var(--shadow-elevated)] overflow-hidden">
          <div className="p-2.5 border-b border-[var(--color-card-border)]">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parent by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick("")}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                value === ""
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
              }`}
            >
              <span>No parent yet</span>
              {value === "" && <Check className="w-4 h-4 shrink-0" />}
            </button>

            {filteredParents.length === 0 ? (
              <p className="px-4 py-4 text-sm text-[var(--color-muted)] text-center">No matching parents</p>
            ) : (
              filteredParents.map((p) => {
                const active = p._id === value;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => pick(p._id)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-colors ${
                      active
                        ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate">{p.displayName}</p>
                      {p.email && <p className="text-xs text-[var(--color-muted)] truncate">{p.email}</p>}
                    </div>
                    {active && <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Dedicated page to add or edit a person (admin, teacher, student, parent). */
export default function UserFormPage() {
  const { userType = "teacher", id } = useParams();
  const kind = userType as Kind;
  const editing = !!id;
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const back = buildPath(PATHS.users, { userType: kind, filter: "all" });
  const grades = useAppSelector((s) => (s as any).grades.grades) as Array<{ _id: string; title: string }>;
  const rawParents = useAppSelector((s) => (s.users as any).allUsers?.parent ?? []) as ParentOption[];
  const parents = useMemo(
    () =>
      rawParents
        .filter((p) => !p?.isSuspended)
        .map((p) => ({
          ...p,
          displayName: getParentDisplayName(p),
        })),
    [rawParents]
  );
  const [subjects, setSubjects] = useState<Array<{ _id: string; name: string }>>([]);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "", parentId: "", gradeIds: [] as string[], subjectIds: [] as string[] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind === "teacher") dispatch(fetchGrades());
    if (kind === "student") dispatch(fetchAllUsersByType("parent"));
    if (editing) {
      dispatch(fetchUserById({ id: id!, userType: kind })).then((r: any) => {
        const u = r.payload?.data || r.payload;
        if (u?._id) {
          const [fallbackFirst = "", ...fallbackRest] = (u.name || "").trim().split(/\s+/);
          setF((x) => ({
            ...x,
            firstName: u.firstName || fallbackFirst,
            lastName: u.lastName || fallbackRest.join(" "),
            email: u.email || "",
            phoneNumber: u.phoneNumber || "",
            parentId: u.parentId || "",
            gradeIds: (u.gradeIds || []).map(String),
            subjectIds: (u.subjectIds || []).map(String),
          }));
        }
      });
    }
  }, [dispatch, kind, id, editing]);

  useEffect(() => {
    if (kind !== "teacher") return;
    Promise.all(f.gradeIds.map((g) => dispatch(fetchSubjectsByGrade(g)).then((r: any) => r.payload || []))).then((lists) => {
      const m = new Map<string, any>();
      lists.flat().forEach((s: any) => m.set(s._id, s));
      setSubjects([...m.values()]);
    });
  }, [dispatch, kind, f.gradeIds.join(",")]); // eslint-disable-line

  const toggle = (key: "gradeIds" | "subjectIds", v: string) => setF((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "teacher" && !f.gradeIds.length) return toast.error("Pick at least one class level");
    setBusy(true);
    try {
      if (editing) {
        await dispatch(updateUser({ id: id!, userType: kind, updateData: { firstName: f.firstName, lastName: f.lastName, phoneNumber: f.phoneNumber, ...(kind === "teacher" && { gradeIds: f.gradeIds, subjectIds: f.subjectIds }) } })).unwrap();
      } else if (kind === "admin") {
        const r: any = await dispatch(addAdmin({ email: f.email, password: f.password, role: "admin", firstName: f.firstName, lastName: f.lastName })).unwrap();
        if (r?.success === false) throw new Error(r.message);
      } else {
        const r: any = await dispatch(createUser({ firstName: f.firstName, lastName: f.lastName, email: f.email, phoneNumber: f.phoneNumber, userType: kind, ...(kind === "student" && f.parentId && { parentId: f.parentId }), ...(kind === "teacher" && { gradeIds: f.gradeIds, subjectIds: f.subjectIds }) })).unwrap();
        if (r?.success === false) throw new Error(r.message);
      }
      toast.success(editing ? "Saved" : `${LABEL[kind]} added`);
      nav(back);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell backTo={back} backLabel={`Back to ${LABEL[kind]}s`} eyebrow="People" title={editing ? `Edit ${LABEL[kind]}` : `Add a ${LABEL[kind]}`} highlight={LABEL[kind]} subtitle={editing ? undefined : kind === "admin" ? "Only the Super Admin can add admins." : "They receive their sign-in details by email."}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center gap-3"><Avatar name={`${f.firstName} ${f.lastName}`.trim() || "New person"} email={f.email} size={56} /><span className="text-sm text-[var(--color-muted)]">A friendly avatar is used until a photo is uploaded.</span></div>
        <label><span className="form-label">First name</span><input required className="form-input" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
        <label><span className="form-label">Last name</span><input required className="form-input" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></label>
        <label><span className="form-label">Email</span><input required disabled={editing} type="email" className="form-input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        {kind !== "admin" && <label><span className="form-label">Phone number</span><input required className="form-input" value={f.phoneNumber} onChange={(e) => setF({ ...f, phoneNumber: e.target.value })} /></label>}
        {kind === "admin" && !editing && <label><span className="form-label">Password</span><input required minLength={8} type="password" className="form-input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>}
        {kind === "student" && !editing && (
          <div className="md:col-span-2 space-y-1.5">
            <span className="form-label block">Parent (optional)</span>
            <SearchableParentSelect
              value={f.parentId}
              onChange={(parentId) => setF((x) => ({ ...x, parentId }))}
              parents={parents}
            />
          </div>
        )}
        {kind === "teacher" && (
          <>
            <fieldset className="md:col-span-2"><legend className="form-label">Class levels</legend>
              <div className="grid gap-2 sm:grid-cols-3">{grades.map((g) => <label key={g._id} className="flex items-center gap-3 rounded-2xl bg-[var(--row-bg)] px-4 py-2.5 cursor-pointer"><input type="checkbox" checked={f.gradeIds.includes(g._id)} onChange={() => toggle("gradeIds", g._id)} />{g.title}</label>)}</div></fieldset>
            {subjects.length > 0 && <fieldset className="md:col-span-2"><legend className="form-label">Subjects</legend>
              <div className="grid gap-2 sm:grid-cols-3">{subjects.map((s) => <label key={s._id} className="flex items-center gap-3 rounded-2xl bg-[var(--row-bg)] px-4 py-2.5 cursor-pointer"><input type="checkbox" checked={f.subjectIds.includes(s._id)} onChange={() => toggle("subjectIds", s._id)} />{s.name}</label>)}</div></fieldset>}
          </>
        )}
        <div className="md:col-span-2 flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => nav(back)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : `Add ${LABEL[kind]}`}</button></div>
      </form>
    </FormShell>
  );
}