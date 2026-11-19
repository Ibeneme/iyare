import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  fetchAllAwards,
  issueAward,
} from "../../../store/features/awards/awardGrants.slice";
import { fetchAllUsersByType } from "../../../store/features/users/users.slice";
import type { PerkKind } from "../../../store/models";
import { FormShell, Select, DateInput, Avatar } from "../../../components/ui";
import { PATHS } from "../../../routes/paths";

interface StudentOption {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

const getStudentDisplayName = (s: StudentOption) =>
  s.name?.trim() ||
  `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
  s.email;

const PERKS: { kind: PerkKind; label: string; hint: string }[] = [
  {
    kind: "none",
    label: "Recognition only",
    hint: "A certificate-style award with no reward.",
  },
  {
    kind: "free_month",
    label: "1 free month",
    hint: "The parent can claim one month of free lessons.",
  },
  {
    kind: "discount",
    label: "Discount",
    hint: "A percentage off the next payment, applied at checkout.",
  },
  {
    kind: "custom",
    label: "Custom reward",
    hint: "Describe any other reward.",
  },
];

/** Dedicated page: issue a new award, or edit one that has not been redeemed. */
export default function AwardFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const students = useAppSelector(
    (s) => (s.users as any).allUsers?.student ?? [],
  ) as StudentOption[];
  const existing = useAppSelector((s) =>
    s.awardGrants.items.find((a) => a._id === id),
  );
  const [f, setF] = useState({
    studentId: "",
    title: "",
    description: "",
    kind: "none" as PerkKind,
    pct: "50",
    note: "",
    expiresAt: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUsersByType("student"));
    if (editing && !existing) dispatch(fetchAllAwards());
  }, [dispatch, editing, existing]);

  useEffect(() => {
    if (!existing) return;
    const sid =
      typeof existing.studentId === "string"
        ? existing.studentId
        : existing.studentId._id;
    setF({
      studentId: sid,
      title: existing.title,
      description: existing.description,
      kind: existing.perk.kind,
      pct: String(existing.perk.discountPercent ?? 50),
      note: existing.perk.note ?? "",
      expiresAt: existing.perk.expiresAt?.slice(0, 10) ?? "",
    });
  }, [existing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const perk = {
      kind: f.kind,
      discountPercent: f.kind === "discount" ? Number(f.pct) : undefined,
      note: f.note,
      expiresAt: f.expiresAt || null,
    };
    const r = editing
      ? await dispatch(
          (
            await import("../../../store/features/awards/awardGrants.slice")
          ).updateAward({
            id: id!,
            changes: { title: f.title, description: f.description, perk },
          }),
        )
      : await dispatch(
          issueAward({
            studentId: f.studentId,
            title: f.title,
            description: f.description,
            perk,
          }),
        );
    setBusy(false);
    if ((r as any).error)
      return toast.error(String((r as any).payload || "Could not save"));
    toast.success(
      editing ? "Award updated" : "Award issued. The family has been notified.",
    );
    nav(PATHS.awards);
  };

  const locked = !!existing?.perk.redeemedAt;
  const selectedStudent = f.studentId
    ? students.find((x) => x._id === f.studentId)
    : undefined;
  const selectedStudentName = selectedStudent
    ? getStudentDisplayName(selectedStudent)
    : "";

  return (
    <FormShell
      backTo={PATHS.awards}
      backLabel="Back to awards"
      eyebrow="Awards"
      title={editing ? "Edit award" : "Issue an award"}
      highlight="award"
      subtitle="The student and their parent are told by email and in the app."
    >
      <form onSubmit={submit} className="grid gap-5">
        <label>
          <span className="form-label">Student</span>
          <Select
            required
            disabled={editing}
            value={f.studentId}
            onChange={(e) => setF({ ...f, studentId: e.target.value })}
          >
            <option value="">Choose a student…</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {getStudentDisplayName(s)}
              </option>
            ))}
          </Select>
        </label>
        {selectedStudent && (
          <div className="flex items-center gap-3">
            <Avatar
              name={selectedStudentName}
              email={selectedStudent.email}
              size={44}
            />
            <span className="text-sm text-[var(--color-muted)]">
              {selectedStudent.email}
            </span>
          </div>
        )}
        <label>
          <span className="form-label">Award title</span>
          <input
            required
            className="form-input"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="Maths Star of the Month"
          />
        </label>
        <label>
          <span className="form-label">Why they earned it</span>
          <textarea
            rows={3}
            className="form-input"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </label>

        <fieldset disabled={locked}>
          <legend className="form-label">Reward</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERKS.map((p) => (
              <label
                key={p.kind}
                className={`flex gap-3 rounded-2xl border p-3.5 cursor-pointer ${f.kind === p.kind ? "border-[var(--lp-green)] bg-[var(--lp-green-soft)]" : "border-[var(--color-card-border)]"}`}
              >
                <input
                  type="radio"
                  name="perk"
                  checked={f.kind === p.kind}
                  onChange={() => setF({ ...f, kind: p.kind })}
                />
                <span>
                  <span className="font-semibold block">{p.label}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {p.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {locked && (
            <p className="text-xs mt-2 text-[var(--color-muted)]">
              This reward has been used, so it can no longer be changed.
            </p>
          )}
        </fieldset>

        {f.kind === "discount" && (
          <label>
            <span className="form-label">Discount (%)</span>
            <input
              type="number"
              min={1}
              max={100}
              required
              className="form-input"
              value={f.pct}
              onChange={(e) => setF({ ...f, pct: e.target.value })}
            />
          </label>
        )}
        {f.kind === "custom" && (
          <label>
            <span className="form-label">Describe the reward</span>
            <input
              required
              className="form-input"
              value={f.note}
              onChange={(e) => setF({ ...f, note: e.target.value })}
            />
          </label>
        )}
        {f.kind !== "none" && (
          <label>
            <span className="form-label">Use by (optional)</span>
            <DateInput
              type="date"
              value={f.expiresAt}
              onChange={(e) => setF({ ...f, expiresAt: e.target.value })}
            />
          </label>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => nav(PATHS.awards)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Issue award"}
          </button>
        </div>
      </form>
    </FormShell>
  );
}
