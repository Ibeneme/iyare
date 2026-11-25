import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  fetchPricing,
  savePricing,
  updatePricing,
  deletePricing,
} from "../../../store/features/pricing/pricing.slice";
import type { Pricing } from "../../../store/models";
import { PageHeader, Panel, EmptyState } from "../../../components/ui";
import { money } from "../../../lib/format";
import { useConfirm } from "../../../contexts/ConfirmContext";

const EMPTY_FORM = {
  name: "",
  ngn: "",
  usd: "",
  durationDays: "30",
  featuresText: "",
};

const parseFeatures = (raw: string): string[] =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export default function PricingPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.pricing.items);
  const [f, setF] = useState(EMPTY_FORM);
  const [editingPlan, setEditingPlan] = useState<Pricing | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    void dispatch(fetchPricing({ kind: "subscription" }));
  }, [dispatch]);

  useEffect(() => {
    if (!editingPlan) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingPlan]); // eslint-disable-line

  const toPlanKey = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "subscription";

  const openEditModal = (plan: Pricing) => {
    const existingFeatures = Array.isArray(plan.meta?.features)
      ? plan.meta.features
      : [];
    setEditingPlan(plan);
    setEditForm({
      name: plan.name ?? "",
      ngn: String(plan.prices?.NGN ?? ""),
      usd: String(plan.prices?.USD ?? ""),
      durationDays: String(plan.durationDays ?? 30),
      featuresText: existingFeatures.join("\n"),
    });
  };

  const closeEditModal = () => {
    setEditingPlan(null);
    setEditForm(EMPTY_FORM);
    setSavingEdit(false);
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = f.name.trim();
    if (!trimmedName) return toast.error("Enter a subscription plan name");

    const features = parseFeatures(f.featuresText);
    const r = await dispatch(
      savePricing({
        kind: "subscription",
        planKey: toPlanKey(trimmedName),
        name: trimmedName,
        prices: { NGN: Number(f.ngn), USD: Number(f.usd) },
        durationDays: Number(f.durationDays),
        isActive: true,
        ...(features.length > 0 ? { meta: { features } } : {}),
      }),
    );

    if (savePricing.fulfilled.match(r)) {
      toast.success("Subscription price saved");
      setF(EMPTY_FORM);
    } else {
      toast.error(String(r.payload));
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const trimmedName = editForm.name.trim();
    if (!trimmedName) return toast.error("Enter a subscription plan name");

    const features = parseFeatures(editForm.featuresText);
    setSavingEdit(true);
    const r = await dispatch(
      updatePricing({
        id: editingPlan._id,
        changes: {
          name: trimmedName,
          planKey: toPlanKey(trimmedName),
          prices: { NGN: Number(editForm.ngn), USD: Number(editForm.usd) },
          durationDays: Number(editForm.durationDays),
          meta: {
            ...(editingPlan.meta ?? {}),
            features,
          },
        },
      }),
    );
    setSavingEdit(false);

    if (updatePricing.fulfilled.match(r)) {
      toast.success("Subscription price updated");
      closeEditModal();
    } else {
      toast.error(String(r.payload));
    }
  };

  const handleToggleActive = async (plan: Pricing) => {
    const otherActiveCount = items.filter(
      (item) => item._id !== plan._id && item.isActive,
    ).length;

    if (plan.isActive && otherActiveCount === 0) {
      toast.error(
        "You can't turn off all plans. At least one subscription plan must stay on.",
      );
      return;
    }

    const turningOn = !plan.isActive;
    const confirmed = await confirm({
      title: turningOn
        ? "Turn on subscription plan"
        : "Turn off subscription plan",
      message: turningOn
        ? `Turn on ${plan.name}? Customers will be able to select this plan.`
        : `Turn off ${plan.name}? Customers will no longer be able to select this plan.`,
      cancelLabel: "Cancel",
      confirmLabel: turningOn ? "Turn on" : "Turn off",
      danger: !turningOn,
    });

    if (!confirmed) return;

    const r = await dispatch(
      updatePricing({
        id: plan._id,
        changes: { isActive: turningOn },
      }),
    );

    if (updatePricing.fulfilled.match(r)) {
      toast.success(
        turningOn ? `${plan.name} turned on` : `${plan.name} turned off`,
      );
    } else {
      toast.error(String(r.payload));
    }
  };

  const handleDeletePlan = async (plan: Pricing) => {
    const otherActiveCount = items.filter(
      (item) => item._id !== plan._id && item.isActive,
    ).length;

    if (plan.isActive && otherActiveCount === 0) {
      toast.error(
        "You can't turn off all plans. Turn on another plan first before removing this one.",
      );
      return;
    }

    if (
      await confirm({
        title: "Delete subscription tier",
        message: `Delete ${plan.name}?`,
        cancelLabel: "Cancel",
        confirmLabel: "Delete",
        danger: true,
      })
    ) {
      if (editingPlan?._id === plan._id) closeEditModal();
      const r = await dispatch(deletePricing(plan._id));
      if (deletePricing.fulfilled.match(r)) {
        toast.success(`${plan.name} deleted`);
      } else {
        toast.error(String(r.payload));
      }
    }
  };

  const activeCount = items.filter((item) => item.isActive).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin"
        title="Pricing"
        highlight="Pricing"
        subtitle="Product subscription prices in naira and dollars. Checkout is always priced from this list, never from the browser."
      />

      <Panel
        title="Add a subscription price"
        subtitle="Set a new subscription price for the product. Click any row below to edit an existing plan in a modal."
      >
        <form
          onSubmit={submitNew}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_0.8fr] items-end"
        >
          <label className="min-w-0">
            <span className="form-label">Subscription plan</span>
            <input
              required
              type="text"
              placeholder="e.g. 1 Month, 3 Months, 6 Months"
              className="form-input w-full"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </label>

          <label className="min-w-0">
            <span className="form-label">₦ NGN</span>
            <input
              required
              type="number"
              min={0}
              step="any"
              className="form-input w-full"
              value={f.ngn}
              onChange={(e) => setF({ ...f, ngn: e.target.value })}
            />
          </label>

          <label className="min-w-0">
            <span className="form-label">$ USD</span>
            <input
              required
              type="number"
              min={0}
              step="any"
              className="form-input w-full"
              value={f.usd}
              onChange={(e) => setF({ ...f, usd: e.target.value })}
            />
          </label>

          <label className="min-w-0">
            <span className="form-label">Days</span>
            <input
              required
              type="number"
              min={1}
              step="1"
              className="form-input w-full"
              value={f.durationDays}
              onChange={(e) => setF({ ...f, durationDays: e.target.value })}
            />
          </label>

          <label className="min-w-0 sm:col-span-2 lg:col-span-4">
            <span className="form-label">Features (one per line)</span>
            <textarea
              rows={3}
              placeholder={
                "Full live classes\nDigital workbooks & quizzes\nParent progress dashboard"
              }
              className="form-input w-full"
              value={f.featuresText}
              onChange={(e) => setF({ ...f, featuresText: e.target.value })}
            />
          </label>

          <button
            className="btn btn-primary sm:col-span-2 lg:col-span-4 w-full sm:w-fit"
            type="submit"
          >
            <Plus size={16} /> Save price
          </button>
        </form>
      </Panel>

      <Panel
        title="Price list"
        subtitle="You can't turn off all plans—at least one plan must remain active. Click any row to open the edit modal."
      >
        {items.length === 0 ? (
          <EmptyState
            title="No prices yet"
            text="Add the first subscription plan above."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Subscription</th>
                  <th className="py-2 px-4">₦</th>
                  <th className="py-2 px-4">$</th>
                  <th className="py-2 px-4">Days</th>
                  <th className="py-2 pl-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-card-border)]">
                {items.map((p) => {
                  const featureCount = Array.isArray(p.meta?.features)
                    ? p.meta.features.length
                    : 0;
                  const isLastActivePlan = p.isActive && activeCount <= 1;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => openEditModal(p)}
                      className={`cursor-pointer transition-colors hover:bg-[var(--row-bg)] ${
                        p.isActive ? "" : "opacity-50"
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium">{p.name}</div>
                        {featureCount > 0 && (
                          <div className="text-xs text-[var(--color-muted)] mt-0.5">
                            {featureCount}{" "}
                            {featureCount === 1 ? "feature" : "features"}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {money(p.prices.NGN, "NGN")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {money(p.prices.USD, "USD")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.durationDays}
                      </td>
                      <td
                        className="py-3 pl-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`Edit ${p.name}`}
                          className="p-2 hover:text-[var(--color-primary)]"
                          onClick={() => openEditModal(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={isLastActivePlan}
                          aria-label={p.isActive ? "Turn off" : "Turn on"}
                          title={
                            isLastActivePlan
                              ? "You can't turn off all plans"
                              : p.isActive
                                ? "Turn off"
                                : "Turn on"
                          }
                          className={`p-2 ${
                            isLastActivePlan
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() => void handleToggleActive(p)}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          title={
                            isLastActivePlan
                              ? "You can't turn off all plans"
                              : "Delete"
                          }
                          className={`p-2 hover:text-red-600 ${
                            isLastActivePlan
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() => void handleDeletePlan(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-pricing-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[var(--color-card)] border border-[var(--color-card-border)] shadow-[var(--shadow-elevated)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--color-card-border)]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Subscription Pricing
                </p>
                <h2
                  id="edit-pricing-modal-title"
                  className="text-lg font-semibold text-[var(--color-primary)] mt-0.5"
                >
                  Edit {editingPlan.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitEdit} className="p-6 space-y-4">
              <label className="block">
                <span className="form-label">Subscription plan</span>
                <input
                  required
                  type="text"
                  className="form-input w-full"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="form-label">₦ NGN</span>
                  <input
                    required
                    type="number"
                    min={0}
                    step="any"
                    className="form-input w-full"
                    value={editForm.ngn}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ngn: e.target.value })
                    }
                  />
                </label>

                <label className="block">
                  <span className="form-label">$ USD</span>
                  <input
                    required
                    type="number"
                    min={0}
                    step="any"
                    className="form-input w-full"
                    value={editForm.usd}
                    onChange={(e) =>
                      setEditForm({ ...editForm, usd: e.target.value })
                    }
                  />
                </label>

                <label className="block">
                  <span className="form-label">Days</span>
                  <input
                    required
                    type="number"
                    min={1}
                    step="1"
                    className="form-input w-full"
                    value={editForm.durationDays}
                    onChange={(e) =>
                      setEditForm({ ...editForm, durationDays: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="block">
                <span className="form-label">Features (one per line)</span>
                <textarea
                  rows={5}
                  placeholder={
                    "Full live classes\nDigital workbooks & quizzes\nParent progress dashboard"
                  }
                  className="form-input w-full"
                  value={editForm.featuresText}
                  onChange={(e) =>
                    setEditForm({ ...editForm, featuresText: e.target.value })
                  }
                />
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-card-border)]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary"
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
