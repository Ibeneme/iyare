import Select from "../../../components/ui/Select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, ShieldOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchStudentAccess, grantGrace, revokeGrace, type AccessFilter } from "../../../store/features/access/access.slice";
import { fetchPlatformSettings, updateTrial } from "../../../store/features/platform/platformSettings.slice";
import type { GraceDuration } from "../../../store/models";
import { PageHeader, Panel, EmptyState, StatusPill } from "../../../components/ui";
import { day, GRACE_LABEL, trialLabel } from "../../../lib/format";

export default function AccessPage() {
  const dispatch = useAppDispatch();
  const { students, graceOptions } = useAppSelector((s) => s.access);
  const { settings, trialPresets } = useAppSelector((s) => s.platform);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"" | AccessFilter>("");
  const [custom, setCustom] = useState("");

  useEffect(() => void dispatch(fetchPlatformSettings()), [dispatch]);
  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchStudentAccess({ q: q || undefined, state: state || undefined })), 250);
    return () => clearTimeout(t);
  }, [dispatch, q, state]);

  const trial = settings?.trial;
  const saveTrial = async (changes: { enabled?: boolean; days?: number }) => {
    const r = await dispatch(updateTrial(changes));
    if (updateTrial.rejected.match(r)) toast.error(String(r.payload)); else toast.success("Trial settings saved");
  };
  const grant = async (id: string, duration: GraceDuration) => {
    const r = await dispatch(grantGrace({ id, duration }));
    if (grantGrace.rejected.match(r)) toast.error(String(r.payload)); else toast.success(`Access allowed for ${GRACE_LABEL[duration]}`);
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Admin" title="Access & free trial" highlight="trial" subtitle="Switch the free trial on or off, and let a student keep learning for a while without paying." />

      <Panel title="Free trial" subtitle="Starts when a child is first added. Students see no mention of fees.">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-3 font-medium">
            <input type="checkbox" role="switch" checked={!!trial?.enabled} onChange={(e) => saveTrial({ enabled: e.target.checked })} />
            {trial?.enabled ? "Trial is on" : "Trial is off"}
          </label>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Trial length">
            {trialPresets.map((d) => (
              <button key={d} onClick={() => saveTrial({ days: d })} aria-pressed={trial?.days === d} className={`pill cursor-pointer ${trial?.days === d ? "pill--green" : ""}`}>{trialLabel(d)}</button>
            ))}
            <input type="number" min={1} placeholder="Days" className="form-input !w-24 !min-h-0 !py-1.5" value={custom} onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && Number(custom) > 0 && saveTrial({ days: Number(custom) })} aria-label="Custom trial days" />
          </div>
        </div>
      </Panel>

      <Panel title="Students" actions={
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" /><input className="form-input !w-56 !pl-9 !min-h-0 !py-1.5" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select className="form-input !w-auto !min-h-0 !py-1.5" value={state} onChange={(e) => setState(e.target.value as any)}>
            <option value="">All</option><option value="trial">On trial</option><option value="paid">Paid</option><option value="grace">Admin grace</option><option value="expiry_grace">Expiry grace</option><option value="lapsed">View only</option><option value="trial_ended">Trial ended</option>
          </Select>
        </div>}>
        {students.length === 0 ? <EmptyState title="No students found" /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left"><th>Student</th><th>Status</th><th>Until</th><th>Allow learning for</th></tr></thead>
            <tbody>{students.map((s) => (
              <tr key={s._id}>
                <td><span className="font-medium">{s.firstName} {s.lastName}</span><span className="block text-xs text-[var(--color-muted)]">{s.email}</span></td>
                <td><StatusPill status={s.access.reason} /></td>
                <td>{day(s.access.until || s.adminGraceUntil)}</td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {graceOptions.map((g) => <button key={g} className="pill cursor-pointer hover:bg-[var(--lp-yellow-soft)]" onClick={() => grant(s._id, g)}>{GRACE_LABEL[g]}</button>)}
                    {s.adminGraceUntil && <button className="pill cursor-pointer" onClick={() => dispatch(revokeGrace(s._id))}><ShieldOff size={12} /> End</button>}
                  </div>
                </td>
              </tr>))}</tbody></table></div>)}
      </Panel>
    </div>
  );
}
