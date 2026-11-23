import { useEffect, useState, FormEvent } from "react";
import {
  Plus,
  Trash2,
  Users2,
  CreditCard,
  Pencil,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  fetchWards,
  fetchCatalogue,
  updateWard,
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
  Select,
} from "../../../components/ui";
import { day } from "../../../lib/format";
import { useConfirm } from "../../../contexts/ConfirmContext";

interface EditWardForm {
  id: string;
  firstName: string;
  lastName: string;
  gradeId: string;
  subjectIds: string[];
}

const extractId = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return String(val._id || val.id || "");
  return "";
};

const subjectMatchesGrade = (subj: any, gradeId: string): boolean => {
  if (!gradeId) return true;
  if (Array.isArray(subj?.gradeLevel) && subj.gradeLevel.length > 0) {
    return subj.gradeLevel.map(extractId).includes(String(gradeId));
  }
  const singleGrade = extractId(subj?.gradeLevel ?? subj?.gradeId);
  return !singleGrade || singleGrade === String(gradeId);
};

export default function WardsPage() {
  const dispatch = useAppDispatch();
  const { items, status, catalogue } = useAppSelector((s) => s.wards);
  const wardAccess = useAppSelector((s) => s.access.wards);
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [editingWard, setEditingWard] = useState<EditWardForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEditModal = (ward: any) => {
    const gradeId = extractId(ward?.gradeId);
    const subjectIds = Array.isArray(ward?.subjects)
      ? ward.subjects.map(extractId).filter(Boolean)
      : [];

    setEditingWard({
      id: ward._id,
      firstName: ward.firstName || "",
      lastName: ward.lastName || "",
      gradeId,
      subjectIds,
    });
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingWard(null);
  };

  const handleEditGradeChange = (nextGradeId: string) => {
    setEditingWard((prev) => {
      if (!prev) return prev;
      const validSubjectsForGrade = prev.subjectIds.filter((subId) => {
        const subjObj = (catalogue?.subjects ?? []).find(
          (s: any) => String(s._id) === String(subId),
        );
        return !subjObj || subjectMatchesGrade(subjObj, nextGradeId);
      });
      return {
        ...prev,
        gradeId: nextGradeId,
        subjectIds: validSubjectsForGrade,
      };
    });
  };

  const toggleEditSubject = (subjectId: string) => {
    setEditingWard((prev) => {
      if (!prev) return prev;
      const exists = prev.subjectIds.includes(subjectId);
      return {
        ...prev,
        subjectIds: exists
          ? prev.subjectIds.filter((id) => id !== subjectId)
          : [...prev.subjectIds, subjectId],
      };
    });
  };

  const handleSaveWardEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingWard) return;

    if (!editingWard.firstName.trim() || !editingWard.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setSavingEdit(true);
    try {
      const result = await dispatch(
        updateWard({
          id: editingWard.id,
          data: {
            firstName: editingWard.firstName.trim(),
            lastName: editingWard.lastName.trim(),
            gradeId: editingWard.gradeId || null,
            subjectIds: editingWard.subjectIds,
          },
          // Fallback shape in case your slice expects flat fields instead of { id, data }
          firstName: editingWard.firstName.trim(),
          lastName: editingWard.lastName.trim(),
          gradeId: editingWard.gradeId || null,
          subjectIds: editingWard.subjectIds,
        } as any),
      );

      if (updateWard.fulfilled.match(result)) {
        toast.success(`${editingWard.firstName.trim()} updated`);
        setEditingWard(null);
        dispatch(fetchWards());
      } else {
        toast.error(String(result.payload || "Failed to update child"));
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const availableSubjectsForEdit = (catalogue?.subjects ?? []).filter(
    (s: any) => subjectMatchesGrade(s, editingWard?.gradeId || ""),
  );

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
            const gradeTitle =
              typeof w.gradeId === "object" && w.gradeId
                ? w.gradeId.title
                : (catalogue?.grades ?? []).find(
                    (g: any) => String(g._id) === String(w.gradeId),
                  )?.title || "No class";

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
                  {gradeTitle} · {w.subjects.length} subject
                  {w.subjects.length === 1 ? "" : "s"}
                </p>

                {Array.isArray(w.subjects) && w.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {w.subjects.map((sub: any, idx: number) => {
                      const subId = extractId(sub);
                      const subName =
                        typeof sub === "object" && sub?.name
                          ? sub.name
                          : (catalogue?.subjects ?? []).find(
                              (s: any) => String(s._id) === subId,
                            )?.name || "Subject";
                      return (
                        <span
                          key={subId || idx}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-primary)] font-medium"
                        >
                          {subName}
                        </span>
                      );
                    })}
                  </div>
                )}

                {a && a.access.until && (
                  <p className="text-xs text-[var(--color-muted)] mt-2">
                    {a.access.reason === "trial"
                      ? "Trial ends"
                      : "Access until"}{" "}
                    {day(a.access.until)}
                    {a.daysLeft != null &&
                      ` (${a.daysLeft} day${a.daysLeft === 1 ? "" : "s"})`}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
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
                    type="button"
                    className="btn btn-secondary !min-h-0 !py-1.5 text-sm"
                    onClick={() => openEditModal(w)}
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
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

      {editingWard && (
        <div
          onClick={closeEditModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[var(--color-card)] border border-[var(--color-card-border)] p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                  Edit {editingWard.firstName} {editingWard.lastName}
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Change their class/grade or add/remove subjects.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit modal"
                className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWardEdit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="form-label">First name</span>
                  <input
                    required
                    className="form-input w-full"
                    value={editingWard.firstName}
                    onChange={(e) =>
                      setEditingWard({
                        ...editingWard,
                        firstName: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="block">
                  <span className="form-label">Last name</span>
                  <input
                    required
                    className="form-input w-full"
                    value={editingWard.lastName}
                    onChange={(e) =>
                      setEditingWard({
                        ...editingWard,
                        lastName: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="block">
                <span className="form-label">Grade / Class</span>
                <Select
                  value={editingWard.gradeId}
                  onChange={(e) => handleEditGradeChange(e.target.value)}
                >
                  <option value="">No class</option>
                  {(catalogue?.grades ?? []).map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </Select>
              </label>

              <fieldset className="space-y-2">
                <legend className="form-label">
                  Subjects ({editingWard.subjectIds.length} selected)
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                  {availableSubjectsForEdit.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)] col-span-2 py-2">
                      No subjects available for the selected grade.
                    </p>
                  ) : (
                    availableSubjectsForEdit.map((s: any) => {
                      const checked = editingWard.subjectIds.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                            checked
                              ? "border-[var(--color-primary)] bg-[var(--row-bg)]"
                              : "border-[var(--color-card-border)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditSubject(s._id)}
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </fieldset>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="btn btn-secondary !min-h-0 !py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary !min-h-0 !py-2 px-4 text-sm inline-flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>{savingEdit ? "Saving…" : "Save changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
