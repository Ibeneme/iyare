import { useEffect,  } from "react";
import { Plus, Trash2, Users2, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  fetchWards,
  fetchCatalogue,
  removeWard,
} from "../../../store/features/wards/wards.slice";
import { fetchWardAccess } from "../../../store/features/access/access.slice";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusPill,
  Avatar,
} from "../../../components/ui";
import { day } from "../../../lib/format";
import { useConfirm } from "../../../contexts/ConfirmContext";

export default function WardsPage() {
  const dispatch = useAppDispatch();
  const { items,  status } = useAppSelector((s) => s.wards);
  const wardAccess = useAppSelector((s) => s.access.wards);
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  useEffect(() => {
    dispatch(fetchWards());
    dispatch(fetchCatalogue());
    dispatch(fetchWardAccess());
  }, [dispatch]);

  const accessFor = (id: string) => wardAccess.find((w) => w.studentId === id);

  const isWardPaid = (ward: any, access: any) => {
    if (ward?.isPaid || ward?.isSubscribed) return true;
    if (access?.needsRenewal === false && access?.access?.reason === "paid")
      return true;
    return false;
  };

  const handlePayForWard = (ward: any) => {
    navigate(PATHS.transactions || "/app/payments", {
      state: {
        childId: ward._id,
        studentIds: [ward._id],
      },
    });
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Family"
        title="My children"
        highlight="children"
        subtitle="Add each child once, choose their class and subjects, then pay from the Payments page."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => navigate(PATHS.wardNew)}
          >
            <Plus size={16} /> Add a child
          </button>
        }
      />

      {items.length === 0 && status !== "loading" ? (
        <Panel>
          <EmptyState
            icon={Users2}
            title="No children yet"
            text="Add your first child to start their free trial."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((w) => {
            const a = accessFor(w._id);
            const alreadyPaid = isWardPaid(w, a);
            return (
              <article key={w._id} className="panel">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={`${w.firstName} ${w.lastName}`}
                      email={w.email}
                      src={(w as any).avatarUrl}
                      size={48}
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--color-primary)] truncate">
                        {w.firstName} {w.lastName}
                      </h3>
                      <p className="text-sm text-[var(--color-muted)] truncate">
                        {w.email}
                      </p>
                    </div>
                  </div>
                  {a && <StatusPill status={a.access.reason} />}
                </div>
                <p className="text-sm mt-3 text-[var(--color-secondary)]">
                  {typeof w.gradeId === "object" && w.gradeId
                    ? w.gradeId.title
                    : "No class"}{" "}
                  · {w.subjects.length} subject
                  {w.subjects.length === 1 ? "" : "s"}
                </p>
                {a && a.access.until && (
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    {a.access.reason === "trial"
                      ? "Trial ends"
                      : "Access until"}{" "}
                    {day(a.access.until)}
                    {a.daysLeft != null &&
                      ` (${a.daysLeft} day${a.daysLeft === 1 ? "" : "s"})`}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 mt-4">
                  {!alreadyPaid && (
                    <button
                      type="button"
                      className="btn btn-primary !min-h-0 !py-1.5 text-sm"
                      onClick={() => handlePayForWard(w)}
                    >
                      <CreditCard size={14} /> Pay for {w.firstName}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary !min-h-0 !py-1.5 text-sm"
                    onClick={async () => {
                      if (
                        !(await confirm({
                          title: "Remove ward",
                          message: `Remove ${w.firstName}? This cannot be undone.`,
                          cancelLabel: "Cancel",
                          confirmLabel: "Remove",
                          danger: true,
                        }))
                      )
                        return;
                      const r = await dispatch(removeWard(w._id));
                      if (removeWard.rejected.match(r))
                        toast.error(String(r.payload));
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
