import Select from "../../../components/ui/Select";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  Receipt,
  Wallet,
  TrendingUp,
  Tag,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../../store";
import { fetchAllTransactions } from "../../../store/features/payments/transactions.slice";
import { startCheckout } from "../../../store/features/payments/checkout.slice";
import { fetchWardAccess } from "../../../store/features/access/access.slice";
import { fetchWards } from "../../../store/features/wards/wards.slice";
import { fetchPricing } from "../../../store/features/pricing/pricing.slice"; // adjust path if your pricing slice lives elsewhere
import type {
  Currency,
  Pricing,
  Transaction,
  TransactionStatus,
} from "../../../store/models";
import useAuth from "../../../hooks/useAuth";
import {
  PageHeader,
  Panel,
  StatCard,
  EmptyState,
  StatusPill,
} from "../../../components/ui";
import { day, money, personName } from "../../../lib/format";

interface PaymentsLocationState {
  childId?: string;
  studentIds?: string[];
  currency?: Currency;
  planId?: string;
}

export default function PaymentsPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navState = (location.state as PaymentsLocationState | null) ?? null;

  const auth = useAuth() as ReturnType<typeof useAuth> & {
    role?: string;
    userRole?: string;
    adminRole?: string;
    isSuperAdmin?: boolean;
  };
  const { isParent, isAdmin, email } = auth;
  const isSuperAdmin = Boolean(
    auth.isSuperAdmin ||
    // auth.role === "superadmin" ||
    // auth.role === "super_admin" ||
    auth.userRole === "superadmin" ||
    auth.userRole === "super_admin" ||
    auth.adminRole === "superadmin" ||
    auth.adminRole === "super_admin",
  );

  const { items, total, revenue, status } = useAppSelector(
    (s) => s.transactions,
  );
  const wards = useAppSelector((s) => s.wards.items);
  const wardAccess = useAppSelector((s) => s.access.wards);
  const checkout = useAppSelector((s) => s.checkout);
  const pricingState = useAppSelector((s) => s.pricing);

  const [currency, setCurrency] = useState<Currency>(
    navState?.currency ?? "NGN",
  );
  const [picked, setPicked] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    navState?.planId ?? "",
  );
  const [filter, setFilter] = useState<"" | TransactionStatus>("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (navState?.currency) {
      setCurrency(navState.currency);
    }
    if (navState?.planId) {
      setSelectedPlanId(navState.planId);
    }
  }, [navState?.currency, navState?.planId]);

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchAllTransactions({ status: filter || undefined }));
      dispatch(fetchPricing({ kind: "subscription" }));
    } else if (isAdmin) {
      dispatch(fetchPricing({ kind: "subscription" }));
    } else {
      dispatch(fetchWards());
      dispatch(fetchWardAccess());
      dispatch(fetchPricing({ kind: "subscription" }));
    }
  }, [dispatch, isAdmin, isSuperAdmin, filter]);

  const activePlans: Pricing[] = useMemo(() => {
    const list = pricingState?.items ?? [];
    const active = list.filter((p) => p.isActive !== false);
    return active.length > 0 ? active : list;
  }, [pricingState?.items]);

  useEffect(() => {
    if (!selectedPlanId && activePlans.length > 0) {
      const defaultPlan =
        activePlans.find((p) => p.planKey === "1-months") ?? activePlans[0];
      setSelectedPlanId(defaultPlan._id || defaultPlan.planKey || "");
    }
  }, [activePlans, selectedPlanId]);

  const currentPlan: Pricing | undefined = useMemo(() => {
    if (!activePlans.length) return undefined;
    return (
      activePlans.find(
        (p) => p._id === selectedPlanId || p.planKey === selectedPlanId,
      ) ?? activePlans[0]
    );
  }, [activePlans, selectedPlanId]);

  const planFeatures: string[] = useMemo(() => {
    const features = currentPlan?.meta?.features;
    return Array.isArray(features) ? features : [];
  }, [currentPlan]);

  const unitPrice = useMemo(() => {
    if (!currentPlan?.prices) return 0;
    const exact = currentPlan.prices[currency];
    if (typeof exact === "number" && exact > 0) return exact;
    if (currency !== "NGN" && typeof currentPlan.prices.NGN === "number") {
      return currentPlan.prices.NGN;
    }
    return 0;
  }, [currentPlan, currency]);

  const dueIds = useMemo(
    () => wardAccess.filter((w) => w.needsRenewal).map((w) => w.studentId),
    [wardAccess],
  );

  const preselectedIds = useMemo(() => {
    const fromState =
      navState?.studentIds ?? (navState?.childId ? [navState.childId] : []);
    return Array.from(new Set([...dueIds, ...fromState]));
  }, [dueIds, navState?.childId, navState?.studentIds]);

  useEffect(() => {
    setPicked(preselectedIds);
  }, [preselectedIds.join(",")]); // eslint-disable-line

  const estimatedTotal = unitPrice * picked.length;

  const pay = async () => {
    if (!picked.length) return toast.error("Choose at least one child");
    const r = await dispatch(
      startCheckout({
        email: email || "",
        currency,
        studentDetails: picked.map((_id) => ({ _id })),
        ...(currentPlan?._id && { pricingId: currentPlan._id }),
        ...(currentPlan?.planKey && { planKey: currentPlan.planKey }),
        ...((currentPlan?._id || currentPlan?.planKey) && {
          planId: currentPlan?._id || currentPlan?.planKey,
        }),
      } as any),
    );
    if (startCheckout.fulfilled.match(r))
      window.location.href = r.payload.checkout_url; // Paystack hosted page
    else toast.error(String(r.payload));
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={isAdmin ? "Admin" : "Billing"}
        title={isAdmin ? "All payments" : "Payments"}
        highlight={isAdmin ? "payments" : "Payments"}
        subtitle={
          isAdmin
            ? "Every Paystack transaction on the platform."
            : "Select a plan and the children you want to pay for."
        }
      />

      {isSuperAdmin && (
        <div className="grid-stats">
          <StatCard
            label="Transactions"
            value={total}
            icon={Receipt}
            tone="plain"
          />
          <StatCard
            label="Revenue (₦)"
            value={money(revenue?.NGN?.total ?? 0, "NGN")}
            icon={TrendingUp}
            tone="green"
          //  className="!text-[#111827]  dark:[&_p]:!text-[#111827] [&_span]:!text-[#111827] dark:[&_span]:!text-[#111827]"
          />
          <StatCard
            label="Revenue ($)"
            value={money(revenue?.USD?.total ?? 0, "USD")}
            icon={Wallet}
            tone="yellow"
          //  className="!text-[#111827]  dark:[&_p]:!text-[#111827] [&_span]:!text-[#111827] dark:[&_span]:!text-[#111827]"
          />
        </div>
      )}

      {isParent && (
        <Panel
          variant="binder"
          title="Pay now"
          subtitle="Prices and features come straight from your active subscription plans."
        >
          {wards.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Add a child first"
              text="Once a child is added, you can pay for their lessons here."
            />
          ) : (
            <div className="space-y-5">
              {/* Plan Selector, Rates & Features from /api/pricing */}
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
                      <Tag size={14} />
                      <span>Choose Subscription Plan ({currency})</span>
                    </div>

                    {pricingState?.status === "loading" &&
                    activePlans.length === 0 ? (
                      <p className="text-sm text-[var(--color-muted)]">
                        Loading plans…
                      </p>
                    ) : activePlans.length > 0 ? (
                      <div className="grid gap-2.5 sm:grid-cols-3 pt-1">
                        {activePlans.map((plan) => {
                          const id = plan._id || plan.planKey || "";
                          const isSelected =
                            currentPlan?._id === plan._id ||
                            currentPlan?.planKey === plan.planKey;
                          const planAmount = plan.prices?.[currency];
                          const badge = plan.meta?.badge;
                          const billingLabel = plan.meta?.billingLabel;

                          return (
                            <button
                              key={id || plan.name}
                              type="button"
                              onClick={() => setSelectedPlanId(id)}
                              className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                                isSelected
                                  ? "bg-[var(--lp-green-deep)] text-white border-[var(--lp-green-deep)] shadow-sm"
                                  : "bg-[var(--color-card)] text-[var(--color-primary)] border-[var(--color-card-border)] hover:border-[var(--lp-green)]"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm">
                                    {plan.name}
                                  </span>
                                  {badge && (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : "bg-[var(--lp-green-soft)] text-[var(--lp-green-deep)]"
                                      }`}
                                    >
                                      {badge}
                                    </span>
                                  )}
                                </div>
                                {billingLabel && (
                                  <p
                                    className={`text-xs ${
                                      isSelected
                                        ? "text-white/80"
                                        : "text-[var(--color-muted)]"
                                    }`}
                                  >
                                    {billingLabel}
                                    {plan.meta?.perUnitLabel
                                      ? ` · ${plan.meta.perUnitLabel}`
                                      : ""}
                                  </p>
                                )}
                              </div>

                              <div className="pt-1">
                                <span className="text-base font-bold">
                                  {typeof planAmount === "number"
                                    ? money(planAmount, currency)
                                    : "—"}
                                </span>
                                {currency === "NGN" &&
                                  typeof plan.meta?.savingsNGN === "number" &&
                                  plan.meta.savingsNGN > 0 && (
                                    <span
                                      className={`block text-[11px] font-medium mt-0.5 ${
                                        isSelected
                                          ? "text-yellow-300"
                                          : "text-[var(--lp-green-deep)]"
                                      }`}
                                    >
                                      Save {money(plan.meta.savingsNGN, "NGN")}
                                    </span>
                                  )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-muted)]">
                        Prices will be calculated on checkout.
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0 sm:min-w-[140px] pt-1">
                    <p className="text-xs text-[var(--color-muted)]">
                      Total ({picked.length} child
                      {picked.length === 1 ? "" : "ren"})
                    </p>
                    <p className="text-xl font-bold text-[var(--color-primary)] mt-0.5">
                      {unitPrice > 0
                        ? money(estimatedTotal, currency)
                        : "Calculated at checkout"}
                    </p>
                  </div>
                </div>

                {/* Plan Features directly from currentPlan.meta.features */}
                {currentPlan && planFeatures.length > 0 && (
                  <div className="pt-3.5 border-t border-[var(--color-card-border)] space-y-2.5">
                    <p className="text-xs font-semibold text-[var(--color-primary)]">
                      Included in {currentPlan.name}:
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {planFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[var(--color-primary)]"
                        >
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--lp-green-soft)] text-[var(--lp-green-deep)] grid place-items-center shrink-0">
                            <Check size={11} />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Children Selector */}
              <ul className="grid gap-2 sm:grid-cols-2">
                {wards.map((w) => {
                  const a = wardAccess.find((x) => x.studentId === w._id);
                  const on = picked.includes(w._id);
                  return (
                    <li key={w._id}>
                      <label
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer ${
                          on
                            ? "border-[var(--lp-green)] bg-[var(--lp-green-soft)]"
                            : "border-[var(--color-card-border)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setPicked((p) =>
                              on ? p.filter((x) => x !== w._id) : [...p, w._id],
                            )
                          }
                        />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium block truncate">
                            {w.firstName} {w.lastName}
                          </span>
                          {a?.access.until && (
                            <span className="text-xs text-[var(--color-muted)]">
                              until {day(a.access.until)}
                            </span>
                          )}
                        </span>
                        {a && <StatusPill status={a.access.reason} />}
                      </label>
                    </li>
                  );
                })}
              </ul>

              {/* Currency & Paystack Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="group"
                  aria-label="Currency"
                  className="inline-flex rounded-full border border-[var(--color-card-border)] p-1"
                >
                  {(["NGN", "USD"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      aria-pressed={currency === c}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        currency === c
                          ? "bg-[var(--lp-green-deep)] text-white"
                          : ""
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={pay}
                  disabled={checkout.status === "loading"}
                >
                  {checkout.status === "loading" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CreditCard size={16} />
                  )}{" "}
                  Pay with Paystack
                </button>
              </div>
            </div>
          )}
        </Panel>
      )}

      {isSuperAdmin && (
        <Panel
          title="Payment history"
          subtitle="Click any payment row to view full details."
          actions={
            <Select
              className="form-input !w-auto !min-h-0 !py-1.5"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="">All</option>
              <option value="success">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="abandoned">Abandoned</option>
            </Select>
          }
        >
          {status === "loading" && !items.length ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Receipt} title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th>Date</th>
                    <th>Parent</th>
                    <th>Children</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTx(t)}
                      className="cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <td>{day(t.paidAt || t.createdAt)}</td>
                      <td>{personName(t.parentId) || t.payerEmail}</td>
                      <td>
                        {t.studentIds
                          .map(personName)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td>{t.planName || t.items[0]?.name || "-"}</td>
                      <td className="font-medium">
                        {money(t.amount, t.currency)}
                      </td>
                      <td>
                        <StatusPill status={t.status} />
                      </td>
                      <td className="font-mono text-xs">{t.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card)] text-[var(--color-primary)] p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Transaction details
                </p>
                <h3 className="text-xl font-bold mt-0.5">
                  {money(selectedTx.amount, selectedTx.currency)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={selectedTx.status} />
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-2 rounded-full hover:bg-[var(--color-surface)] transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-surface)] p-4">
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Parent</dt>
                <dd className="font-medium mt-0.5">
                  {personName(selectedTx.parentId) || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">
                  Payer email
                </dt>
                <dd className="font-medium mt-0.5 break-all">
                  {selectedTx.payerEmail || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Children</dt>
                <dd className="font-medium mt-0.5">
                  {selectedTx.studentIds
                    .map(personName)
                    .filter(Boolean)
                    .join(", ") || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Plan</dt>
                <dd className="font-medium mt-0.5">
                  {selectedTx.planName || selectedTx.items?.[0]?.name || "-"}
                  {selectedTx.durationDays
                    ? ` (${selectedTx.durationDays} days)`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Created</dt>
                <dd className="font-medium mt-0.5">
                  {day(selectedTx.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Paid at</dt>
                <dd className="font-medium mt-0.5">
                  {selectedTx.paidAt ? day(selectedTx.paidAt) : "Not paid"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[var(--color-muted)]">Reference</dt>
                <dd className="font-mono text-xs mt-0.5 break-all">
                  {selectedTx.reference}
                </dd>
              </div>
            </dl>

            {Array.isArray(selectedTx.items) && selectedTx.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--color-muted)]">
                  Line items ({selectedTx.items.length})
                </p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedTx.items.map((item: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-xs rounded-xl border border-[var(--color-card-border)] px-3 py-2"
                    >
                      <span>
                        {item.name || item.planKey || "Lesson plan"}
                        {item.studentId
                          ? ` · ${personName(item.studentId) || item.studentId}`
                          : ""}
                      </span>
                      {typeof item.amount === "number" && (
                        <span className="font-semibold">
                          {money(
                            item.amount,
                            item.currency || selectedTx.currency,
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
