import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/index";
//import { fetchPricing } from "../../store/slices/pricingSlice"; // adjust path if your slice lives elsewhere

import PricingHeroSection from "./PricingHeroSection";
import PlanCard from "./PlanCard";
import PricingLoadingScreen from "./PricingLoadingScreen";
import PricingTrustNote from "./PricingTrustNote";
import { PLAN_FEATURES } from "./planCatalog";
import { fetchPricing } from "../../store/features/pricing/pricing.slice";
import type { Currency, Pricing }  from "../../store/models";

interface PlanConfig {
  name: string;
  duration: string;
  months: number;
  discount: number;
  popular?: boolean;
  features: string[];
  planId: string;
  planKeys: string[];
}

interface Plan extends Omit<PlanConfig, "discount" | "planKeys"> {
  original: number;
  price: number;
  savings: number;
  currency: Currency;
}

interface LocationState {
  studentIds?: string[];
  parentId?: string;
}

const DEFAULT_MONTHLY_PRICES: Record<Currency, number> = {
  NGN: 50000,
  USD: 100,
} as Record<Currency, number>;

const PLAN_CONFIGS: PlanConfig[] = [
  {
    name: "1 Month",
    duration: "30 days access",
    months: 1,
    discount: 0,
    popular: false,
    features: PLAN_FEATURES.monthly,
    planId: "monthly",
    planKeys: ["monthly", "1_month", "1-month", "30_days"],
  },
  {
    name: "3 Months",
    duration: "90 days access",
    months: 3,
    discount: 0.033,
    popular: true,
    features: PLAN_FEATURES.quarterly,
    planId: "quarterly",
    planKeys: ["quarterly", "3_months", "3-months", "90_days"],
  },
  {
    name: "6 Months",
    duration: "180 days access",
    months: 6,
    discount: 0.067,
    popular: false,
    features: PLAN_FEATURES.semiannual,
    planId: "semiannual",
    planKeys: ["semiannual", "6_months", "6-months", "180_days"],
  },
];

function getAmountForCurrency(
  pricing: Pricing | undefined,
  currency: Currency,
): number | undefined {
  if (!pricing?.prices) return undefined;
  const direct = pricing.prices[currency];
  if (typeof direct === "number" && direct > 0) return direct;
  if (currency !== "NGN" && typeof pricing.prices.NGN === "number") {
    return pricing.prices.NGN;
  }
  return undefined;
}

function findMatchingPricing(
  items: Pricing[],
  config: PlanConfig,
): Pricing | undefined {
  const activeItems = items.filter((item) => item.isActive !== false);
  const pool = activeItems.length > 0 ? activeItems : items;

  const byKey = pool.find((item) => {
    const key = item.planKey?.toLowerCase();
    const name = item.name?.toLowerCase();
    return (
      (key && config.planKeys.includes(key)) ||
      (name &&
        (name.includes(config.name.toLowerCase()) ||
          name.includes(config.planId.toLowerCase())))
    );
  });
  if (byKey) return byKey;

  const targetDays = config.months * 30;
  return pool.find((item) => item.durationDays === targetDays);
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const { items: pricingItems, status } = useSelector(
    (state: RootState) => state.pricing,
  );

  const [isNigeria, setIsNigeria] = useState<boolean | null>(null);
  const [locationResolved, setLocationResolved] = useState(false);

  const { studentIds, parentId } = (location.state as LocationState) || {};

  // 1. Fetch subscription pricing from Redux slice
  useEffect(() => {
    dispatch(fetchPricing({ kind: "subscription" }));
  }, [dispatch]);

  // 2. Detect user location
  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      try {
        const res = await fetch("https://geolocation-db.com/json/");
        if (!res.ok) throw new Error("Geolocation request failed");
        const data = await res.json();
        if (!isMounted) return;
        const detectedNigeria =
          data.country_code === "NG" ||
          Boolean(data.country_name?.toLowerCase().includes("nigeria"));
        setIsNigeria(detectedNigeria);
      } catch {
        if (!isMounted) return;
        setIsNigeria(true);
      } finally {
        if (isMounted) {
          setLocationResolved(true);
        }
      }
    };

    detectLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCurrency: Currency = useMemo(() => {
    if (isNigeria === false) return "USD" as Currency;
    return "NGN" as Currency;
  }, [isNigeria]);

  const plans: Plan[] = useMemo(() => {
    const monthlyItem = findMatchingPricing(pricingItems, PLAN_CONFIGS[0]);
    const fallbackMonthlyBase =
      getAmountForCurrency(monthlyItem, activeCurrency) ??
      DEFAULT_MONTHLY_PRICES[activeCurrency] ??
      50000;

    return PLAN_CONFIGS.map(({ discount, planKeys, ...plan }) => {
      const matched = findMatchingPricing(pricingItems, {
        ...plan,
        discount,
        planKeys,
      });

      const backendAmount = getAmountForCurrency(matched, activeCurrency);
      const original = backendAmount ?? fallbackMonthlyBase * plan.months;
      const price = Math.floor(original * (1 - discount));
      const savings = Math.max(0, original - price);

      return {
        ...plan,
        original,
        price,
        savings,
        currency: activeCurrency,
      };
    });
  }, [pricingItems, activeCurrency]);

  const handleButtonClick = (plan: Plan) => {
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const totalAmount = plan.price * studentIds.length;
      navigate("/plans/payment", {
        state: {
          parentId,
          studentIds,
          planId: plan.planId,
          totalAmount,
          currency: plan.currency,
        },
      });
    } else {
      navigate("/register");
    }
  };

  const formatPrice = (amount: number, currency: Currency) => {
    const locale = currency === "USD" ? "en-US" : "en-NG";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLoadingPricing =
    !locationResolved || (status === "loading" && pricingItems.length === 0);

  if (isLoadingPricing) {
    return <PricingLoadingScreen message="Finding the best prices for you…" />;
  }

  return (
    <main className="lp-section overflow-hidden">
      <div className="lp-container">
        <PricingHeroSection
          label="Simple, fair pricing"
          before="Pick the plan that"
          highlight="fits your family."
          subtitle={
            isNigeria
              ? "Quality lessons at a price Nigerian families can plan around."
              : "Premium lessons with the same care, wherever you are in the world."
          }
          regionBadge={
            isNigeria === null
              ? null
              : isNigeria
                ? "Showing Nigerian prices"
                : "Showing international prices"
          }
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:items-stretch pt-4">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.planId}
              index={index}
              name={plan.name}
              duration={plan.duration}
              priceText={formatPrice(plan.price, plan.currency)}
              originalText={
                plan.savings > 0
                  ? formatPrice(plan.original, plan.currency)
                  : undefined
              }
              savingsText={
                plan.savings > 0
                  ? formatPrice(plan.savings, plan.currency)
                  : undefined
              }
              priceNote={
                plan.savings > 0
                  ? undefined
                  : isNigeria === false
                    ? "one-time payment"
                    : "per student"
              }
              features={plan.features}
              popular={plan.popular}
              buttonLabel={
                studentIds && studentIds.length > 0 ? "Pay now" : "Get started"
              }
              onSelect={() => handleButtonClick(plan)}
            />
          ))}
        </div>

        <PricingTrustNote>
          Payments are processed securely by Paystack
        </PricingTrustNote>
      </div>
    </main>
  );
};

export default PricingPage;
