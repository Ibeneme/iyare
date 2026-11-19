import Select from "../../../components/ui/Select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Crown, UserPlus, Ban, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchAdmins, createAdmin, suspendAdmin, removeAdmin, fetchTransferCandidates, transferSuperAdmin } from "../../../store/features/superAdmin/superAdmin.slice";
import { PageHeader, Panel, EmptyState, StatusPill, Avatar } from "../../../components/ui";
import { useConfirm } from "../../../contexts/ConfirmContext";

export default function SuperAdminPage() {
  const dispatch = useAppDispatch();
  const { admins, candidates } = useAppSelector((s) => s.superAdmin);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [target, setTarget] = useState("");
  const { confirm } = useConfirm();

  useEffect(() => {
    dispatch(fetchAdmins());
    dispatch(fetchTransferCandidates());
  }, [dispatch]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await dispatch(createAdmin(f));
    if (createAdmin.fulfilled.match(r)) { toast.success("Admin created"); setF({ firstName: "", lastName: "", email: "", password: "" }); } else toast.error(String(r.payload));
  };
  const transfer = async () => {
    if (!target) return;
    const ok = await confirm({
      title: "Transfer Super Admin",
      message: "You will stop being Super Admin as soon as this goes through. Continue?",
      cancelLabel: "Cancel",
      confirmLabel: "Transfer",
      danger: true,
    });
    if (!ok) return;
    const r = await dispatch(transferSuperAdmin(target));
    if (transferSuperAdmin.fulfilled.match(r)) { toast.success("Ownership transferred"); setTimeout(() => window.location.assign("/app/subjects"), 800); } else toast.error(String(r.payload));
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Super Admin" title="Administrators" highlight="Administrators" subtitle="Only you can add, suspend or remove admins, or hand over the Super Admin role." />
      <Panel title="Add an admin">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-5 items-end">
          {(["firstName", "lastName", "email", "password"] as const).map((k) => (
            <label key={k}><span className="form-label">{k === "firstName" ? "First name" : k === "lastName" ? "Last name" : k[0].toUpperCase() + k.slice(1)}</span>
              <input required minLength={k === "password" ? 8 : undefined} type={k === "password" ? "password" : k === "email" ? "email" : "text"} className="form-input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>))}
          <button className="btn btn-primary"><UserPlus size={16} /> Add</button>
        </form>
      </Panel>
      <Panel title="All admins">
        {admins.length === 0 ? <EmptyState title="No admins" /> : (
          <ul className="divide-y divide-[var(--color-card-border)]">{admins.map((a) => (
            <li key={a._id} className="py-3 flex flex-wrap items-center gap-3"><Avatar name={`${a.firstName} ${a.lastName}`} email={a.email} src={(a as any).avatarUrl} size={40} />
              <div className="flex-1 min-w-[12rem]"><p className="font-semibold flex items-center gap-2">{a.role === "superadmin" && <Crown size={14} className="text-[var(--lp-yellow-text)]" />}{a.firstName} {a.lastName}</p><p className="text-xs text-[var(--color-muted)]">{a.email}</p></div>
              <StatusPill status={a.isSuspended ? "failed" : "active"} label={a.isSuspended ? "Suspended" : a.role === "superadmin" ? "Super Admin" : "Active"} />
              {a.role !== "superadmin" && <>
                <button className="btn btn-secondary !min-h-0 !py-1.5 text-sm" onClick={() => dispatch(suspendAdmin({ id: a._id, suspended: !a.isSuspended }))}><Ban size={14} /> {a.isSuspended ? "Restore" : "Suspend"}</button>
                <button
                  aria-label="Remove admin"
                  className="p-2 hover:text-red-600"
                  onClick={async () => {
                    if (await confirm({ title: "Remove admin", message: `Remove ${a.firstName}?`, cancelLabel: "Cancel", confirmLabel: "Remove", danger: true })) {
                      dispatch(removeAdmin(a._id));
                    }
                  }}
                ><Trash2 size={15} /></button>
              </>}
            </li>))}</ul>)}
      </Panel>
      <Panel title="Hand over Super Admin" subtitle="Choose a teacher to take over. You become a regular admin.">
        <div className="flex flex-wrap gap-3">
          <Select className="form-input !w-auto min-w-[16rem]" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose a teacher…</option>{candidates.map((c) => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>)}
          </Select>
          <button className="btn btn-primary" disabled={!target} onClick={transfer}><Crown size={16} /> Transfer</button>
        </div>
      </Panel>
    </div>
  );
}
