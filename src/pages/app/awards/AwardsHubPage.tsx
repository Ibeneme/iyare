import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Gift, Percent, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchAllAwards, fetchMyAwards, deleteAward, redeemFreeMonth } from "../../../store/features/awards/awardGrants.slice";
import type { AwardGrant } from "../../../store/models";
import useAuth from "../../../hooks/useAuth";
import { PageHeader, EmptyState, Avatar, StatusPill } from "../../../components/ui";
import { day, personName } from "../../../lib/format";
import { buildPath, PATHS } from "../../../routes/paths";
import { useConfirm } from "../../../contexts/ConfirmContext";

const perkLine = (a: AwardGrant) =>
  a.perk.kind === "free_month" ? "1 month of free lessons" : a.perk.kind === "discount" ? `${a.perk.discountPercent}% off your next payment` : a.perk.kind === "custom" ? a.perk.note || "Special reward" : "";
const PerkIcon = ({ k }: { k: string }) => (k === "free_month" ? <Gift size={16} /> : k === "discount" ? <Percent size={16} /> : <Sparkles size={16} />);

/** Admin: issue and manage awards. Student and parent: see awards and their rewards. */
export default function AwardsHubPage() {
  const dispatch = useAppDispatch();
  const { confirm } = useConfirm();
  const nav = useNavigate();
  const { isAdmin, isParent } = useAuth();
  const { items, status } = useAppSelector((s) => s.awardGrants);

  useEffect(() => void dispatch(isAdmin ? fetchAllAwards() : fetchMyAwards()), [dispatch, isAdmin]);

  const redeem = async (id: string) => {
    const r = await dispatch(redeemFreeMonth(id));
    if (redeemFreeMonth.rejected.match(r)) toast.error(String(r.payload)); else toast.success("Free month added");
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Recognition" title="Awards" highlight="Awards"
        subtitle={isAdmin ? "Celebrate students and give rewards that families can use." : "Awards earned, and the rewards that come with them."}
        actions={isAdmin ? <button className="btn btn-primary" onClick={() => nav(PATHS.awardNew)}><Plus size={16} /> Issue award</button> : undefined} />

      {items.length === 0 && status !== "loading" ? (
        <div className="panel"><EmptyState icon={Award} title="No awards yet" text={isAdmin ? "Issue the first award to a student." : "Awards will show up here as soon as they are given."} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const stu = typeof a.studentId === "object" ? a.studentId : null;
            const used = !!a.perk.redeemedAt;
            const gone = a.perk.expiresAt && new Date(a.perk.expiresAt) < new Date();
            return (
              <article key={a._id} className="panel flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={personName(stu)} email={(stu as any)?.email} size={44} />
                  <div className="min-w-0"><p className="font-semibold truncate">{personName(stu) || "Student"}</p><p className="text-xs text-[var(--color-muted)]">{day(a.createdAt)}</p></div>
                  <span className="ml-auto stat-icon !bg-[var(--lp-yellow)] !text-[var(--lp-on-yellow)]"><Award size={16} /></span>
                </div>
                <div><h3 className="text-lg font-semibold text-[var(--color-primary)] leading-snug">{a.title}</h3>{a.description && <p className="text-sm text-[var(--color-muted)] mt-1">{a.description}</p>}</div>
                {a.perk.kind !== "none" && (
                  <div className="rounded-2xl bg-[var(--lp-yellow-soft)] text-[var(--lp-on-yellow)] px-3.5 py-2.5 text-sm flex items-center gap-2"><PerkIcon k={a.perk.kind} /><span className="font-medium">{perkLine(a)}</span>
                    <span className="ml-auto">{used ? <StatusPill status="ended" label="Used" /> : gone ? <StatusPill status="ended" label="Expired" /> : a.perk.expiresAt ? <span className="text-xs">by {day(a.perk.expiresAt)}</span> : null}</span></div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {isParent && a.perk.kind === "free_month" && !used && !gone && <button className="btn btn-primary !min-h-0 !py-2 text-sm" onClick={() => redeem(a._id)}>Claim free month</button>}
                  {isParent && a.perk.kind === "discount" && !used && !gone && <Link to={PATHS.transactions} className="btn btn-secondary !min-h-0 !py-2 text-sm">Use at checkout</Link>}
                  {isAdmin && <>
                    <Link to={buildPath(PATHS.awardEdit, { id: a._id })} className="btn btn-secondary !min-h-0 !py-2 text-sm"><Pencil size={14} /> Edit</Link>
                    <button
                      className="btn btn-secondary !min-h-0 !py-2 text-sm"
                      onClick={async () => {
                        if (await confirm({ title: "Delete award", message: "Delete this award?", cancelLabel: "Cancel", confirmLabel: "Delete", danger: true })) {
                          dispatch(deleteAward(a._id));
                        }
                      }}
                    ><Trash2 size={14} /> Delete</button>
                  </>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
