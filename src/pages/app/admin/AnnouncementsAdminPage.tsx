import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DateInput";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Power, Pin } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchAdminList, createAnnouncement, toggleAnnouncement, deleteAnnouncement } from "../../../store/features/announcements/announcements.slice";
import type { AnnouncementKind, Severity, UserType } from "../../../store/models";
import { PageHeader, Panel, EmptyState, StatusPill } from "../../../components/ui";
import { day } from "../../../lib/format";
import { useConfirm } from "../../../contexts/ConfirmContext";

const KIND: Record<AnnouncementKind, string> = { announcement: "Announcement", maintenance: "Maintenance", banner: "Top banner" };
const AUDIENCE: UserType[] = ["student", "parent", "teacher", "admin"] as UserType[];
const blank = { kind: "banner" as AnnouncementKind, title: "", body: "", severity: "info" as Severity, linkUrl: "", linkLabel: "", startsAt: "", endsAt: "", audience: [] as UserType[], pinned: false, blocking: false, dismissible: true };

export default function AnnouncementsAdminPage() {
  const dispatch = useAppDispatch();
  const list = useAppSelector((s) => s.announcements.admin);
  const [tab, setTab] = useState<"" | AnnouncementKind>("");
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => void dispatch(fetchAdminList(tab ? { kind: tab } : undefined)), [dispatch, tab]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { ...f, startsAt: f.startsAt || null, endsAt: f.endsAt || null };
    if (!f.linkUrl) { delete body.linkUrl; delete body.linkLabel; }
    const r = await dispatch(createAnnouncement(body));
    if (createAnnouncement.fulfilled.match(r)) { toast.success("Published"); setF(blank); setOpen(false); } else toast.error(String(r.payload));
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Admin" title="Announcements" highlight="Announcements" subtitle="Top banners, maintenance notices and news. Everyone signed in sees changes immediately."
        actions={<button className="btn btn-primary" onClick={() => setOpen(!open)}><Plus size={16} /> New</button>} />

      {open && (
        <Panel variant="binder" title="Compose">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <label><span className="form-label">Type</span>
              <Select className="form-input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as AnnouncementKind })}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></label>
            <label><span className="form-label">Colour</span>
              <Select className="form-input" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as Severity })}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="critical">Critical</option></Select></label>
            <label className="md:col-span-2"><span className="form-label">Title</span><input required className="form-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
            <label className="md:col-span-2"><span className="form-label">Message</span><textarea className="form-input" rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
            <label><span className="form-label">Starts</span><DateInput type="datetime-local" className="form-input" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></label>
            <label><span className="form-label">Ends</span><DateInput type="datetime-local" className="form-input" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
            <label><span className="form-label">Link (optional)</span><input className="form-input" placeholder="https://…" value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} /></label>
            <label><span className="form-label">Link label</span><input className="form-input" value={f.linkLabel} onChange={(e) => setF({ ...f, linkLabel: e.target.value })} /></label>
            <fieldset className="md:col-span-2"><legend className="form-label">Who sees it (none = everyone)</legend>
              <div className="flex flex-wrap gap-2">{AUDIENCE.map((a) => { const on = f.audience.includes(a); return <button type="button" key={a} aria-pressed={on} className={`pill cursor-pointer ${on ? "pill--green" : ""}`} onClick={() => setF({ ...f, audience: on ? f.audience.filter((x) => x !== a) : [...f.audience, a] })}>{a}</button>; })}</div></fieldset>
            <div className="md:col-span-2 flex flex-wrap items-center gap-5 text-sm">
              <label className="inline-flex gap-2"><input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} /> Pin to top</label>
              <label className="inline-flex gap-2"><input type="checkbox" checked={f.dismissible} onChange={(e) => setF({ ...f, dismissible: e.target.checked })} /> Can be dismissed</label>
              {f.kind === "maintenance" && <label className="inline-flex gap-2"><input type="checkbox" checked={f.blocking} onChange={(e) => setF({ ...f, blocking: e.target.checked })} /> Block the app while it runs</label>}
            </div>
            <div className="md:col-span-2 flex justify-end"><button className="btn btn-primary">Publish</button></div>
          </form>
        </Panel>
      )}

      <div role="tablist" className="flex flex-wrap gap-2">
        {([["", "All"], ["banner", "Banners"], ["maintenance", "Maintenance"], ["announcement", "Announcements"]] as const).map(([k, l]) => (
          <button role="tab" aria-selected={tab === k} key={k} onClick={() => setTab(k as any)} className={`pill cursor-pointer ${tab === k ? "pill--green" : ""}`}>{l}</button>))}
      </div>

      <Panel>
        {list.length === 0 ? <EmptyState title="Nothing here yet" /> : (
          <ul className="divide-y divide-[var(--color-card-border)]">
            {list.map((a) => (
              <li key={a._id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[12rem]">
                  <p className="font-semibold flex items-center gap-2">{a.pinned && <Pin size={13} />}{a.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">{KIND[a.kind]} · {a.audience.length ? a.audience.join(", ") : "everyone"} · {day(a.startsAt || a.createdAt)}{a.endsAt ? ` to ${day(a.endsAt)}` : ""}</p>
                </div>
                <StatusPill status={a.status || (a.isActive ? "live" : "off")} />
                <button aria-label="Toggle" className="p-2" onClick={() => dispatch(toggleAnnouncement({ id: a._id }))}><Power size={15} /></button>
                <button
                  aria-label="Delete"
                  className="p-2 hover:text-red-600"
                  onClick={async () => {
                    if (await confirm({ title: "Delete announcement", message: "Delete this?", cancelLabel: "Cancel", confirmLabel: "Delete", danger: true })) {
                      dispatch(deleteAnnouncement(a._id));
                    }
                  }}
                ><Trash2 size={15} /></button>
              </li>))}
          </ul>)}
      </Panel>
    </div>
  );
}
