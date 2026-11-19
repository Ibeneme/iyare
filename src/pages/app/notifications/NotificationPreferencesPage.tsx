import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchPrefs, savePrefs } from "../../../store/features/notifications/preferences.slice";
import type { NotificationPrefs } from "../../../store/models";
import { PageHeader, Panel, EmptyState, Avatar } from "../../../components/ui";
import { PATHS } from "../../../routes/paths";

const Row = ({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-4 py-3.5 cursor-pointer">
    <span><span className="font-semibold block">{title}</span><span className="text-sm text-[var(--color-muted)]">{hint}</span></span>
    <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

/** Parents choose what they hear about, and how, per child. */
export default function NotificationPreferencesPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const stored = useAppSelector((s) => s.notificationPrefs.prefs);
  const [p, setP] = useState<NotificationPrefs | null>(null);

  useEffect(() => void dispatch(fetchPrefs()), [dispatch]);
  useEffect(() => setP(stored), [stored]);

  const save = async () => {
    if (!p) return;
    const r = await dispatch(savePrefs(p));
    if (savePrefs.rejected.match(r)) toast.error(String(r.payload)); else toast.success("Preferences saved");
  };
  const setWard = (id: string, patch: Partial<NotificationPrefs["wards"][number]>) => setP((x) => (x ? { ...x, wards: x.wards.map((w) => (w.studentId === id ? { ...w, ...patch } : w)) } : x));

  return (
    <div className="page !max-w-3xl">
      <PageHeader eyebrow="Notifications" title="Alert settings" highlight="Alert" subtitle="Choose what we tell you, and for which child." actions={<button className="btn btn-secondary" onClick={() => nav(PATHS.notifications)}>Back to inbox</button>} />
      {!p ? null : (
        <>
          <Panel title="What to send me" variant="binder">
            <div className="divide-y divide-[var(--color-card-border)]">
              <Row title="Emails" hint="Turn off to keep everything inside the app." checked={p.email} onChange={(v) => setP({ ...p, email: v })} />
              <Row title="Class reminders" hint="A reminder before a class starts." checked={p.classReminders} onChange={(v) => setP({ ...p, classReminders: v })} />
              <Row title="Subscription notices" hint="Renewals, expiry and receipts." checked={p.feeNotices} onChange={(v) => setP({ ...p, feeNotices: v })} />
              <Row title="Awards" hint="When one of your children earns an award." checked={p.awards} onChange={(v) => setP({ ...p, awards: v })} />
            </div>
          </Panel>
          <Panel title="Per child" subtitle="Class reminders and join alerts for each child.">
            {p.wards.length === 0 ? <EmptyState icon={BellRing} title="No children yet" text="Add a child to manage their alerts." /> : (
              <ul className="divide-y divide-[var(--color-card-border)]">
                {p.wards.map((w) => (
                  <li key={w.studentId} className="py-4">
                    <div className="flex items-center gap-3 mb-1"><Avatar name={w.name} size={36} /><span className="font-semibold">{w.name}</span></div>
                    <Row title="Class reminders" hint="Remind me before this child's classes." checked={w.classReminders} onChange={(v) => setWard(w.studentId, { classReminders: v })} />
                    <Row title="Join alerts" hint="Tell me when this child joins a live class." checked={w.joinAlerts} onChange={(v) => setWard(w.studentId, { joinAlerts: v })} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <div className="flex justify-end"><button className="btn btn-primary" onClick={save}>Save preferences</button></div>
        </>
      )}
    </div>
  );
}
