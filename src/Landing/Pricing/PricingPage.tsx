import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/index";

import PricingHeroSection from "./PricingHeroSection";
import PlanCard from "./PlanCard";
import PricingLoadingScreen from "./PricingLoadingScreen";
import PricingTrustNote from "./PricingTrustNote";
import { PLAN_FEATURES } from "./planCatalog";
import { fetchPricing } from "../../store/features/pricing/pricing.slice";
import type { Currency, Pricing } from "../../store/models";

interface Plan {
  id: string;
  planKey: string;
  name: string;
  duration: string;
  price: number;
  original?: number;
  savings: number;
  currency: Currency;
  popular?: boolean;
  features: string[];
}

interface LocationState {
  studentIds?: string[];
  parentId?: string;
}

function getFallbackFeatures(pricing: Pricing): string[] {
  if (
    Array.isArray(pricing.meta?.features) &&
    pricing.meta.features.length > 0
  ) {
    return pricing.meta.features;
  }
  const key = pricing.planKey?.toLowerCase() || "";
  if (key.includes("1") || key.includes("month")) return PLAN_FEATURES.monthly;
  if (key.includes("3") || key.includes("quarter"))
    return PLAN_FEATURES.quarterly;
  if (key.includes("6") || key.includes("semi"))
    return PLAN_FEATURES.semiannual;
  return [];
}

function getCurrencyAmount(pricing: Pricing, currency: Currency): number {
  const direct = pricing.prices?.[currency];
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return direct;
  }
  if (currency !== "NGN" && typeof pricing.prices?.NGN === "number") {
    return pricing.prices.NGN;
  }
  return 0;
}

// Adapts grid layout cleanly for 1, 2, 3, 4, or 5+ active plans
function getGridLayoutClasses(count: number): {
  containerClass: string;
  itemClass: string;
} {
  if (count === 1) {
    return {
      containerClass: "mt-12 sm:mt-16 flex justify-center pt-8",
      itemClass: "w-full max-w-md flex",
    };
  }

  if (count === 2) {
    return {
      containerClass:
        "mt-12 sm:mt-16 mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch pt-8",
      itemClass: "w-full flex",
    };
  }

  if (count === 3) {
    return {
      containerClass:
        "mt-12 sm:mt-16 mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-8",
      itemClass: "w-full flex",
    };
  }

  if (count === 4) {
    return {
      containerClass:
        "mt-12 sm:mt-16 mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch pt-8",
      itemClass: "w-full flex",
    };
  }

  // 5 or more plans: responsive multi-row layout without cramped cards
  return {
    containerClass:
      "mt-12 sm:mt-16 mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 items-stretch pt-8",
    itemClass: "w-full flex",
  };
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

  // Fetch subscription pricing from backend/DB
  useEffect(() => {
    dispatch(fetchPricing({ kind: "subscription" }));
  }, [dispatch]);

  // Detect user location
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
    return isNigeria === false ? ("USD" as Currency) : ("NGN" as Currency);
  }, [isNigeria]);

  // Only include active subscription plans directly from DB
  const plans: Plan[] = useMemo(() => {
    const list = Array.isArray(pricingItems) ? pricingItems : [];

    return list
      .filter(
        (item: any) =>
          item.isActive === true &&
          (!item.kind ||
            item.kind === "subscription" ||
            item.kind === "product"),
      )
      .sort((a, b) => (a.durationDays ?? 0) - (b.durationDays ?? 0))
      .map((item) => {
        const price = getCurrencyAmount(item, activeCurrency);
        const compareAt =
          activeCurrency === "NGN" &&
          typeof item.meta?.compareAtNGN === "number"
            ? item.meta.compareAtNGN
            : undefined;
        const savings =
          activeCurrency === "NGN" && typeof item.meta?.savingsNGN === "number"
            ? item.meta.savingsNGN
            : compareAt && compareAt > price
              ? compareAt - price
              : 0;

        return {
          id: item._id || item.planKey || item.name,
          planKey: item.planKey || item.name,
          name: item.name,
          duration:
            item.meta?.billingLabel ||
            (item.durationDays ? `${item.durationDays} days access` : ""),
          price,
          original: savings > 0 ? compareAt : undefined,
          savings,
          currency: activeCurrency,
          popular: Boolean(item.meta?.badge),
          features: getFallbackFeatures(item),
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
          planId: plan.planKey,
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

  const { containerClass, itemClass } = getGridLayoutClasses(plans.length);

  return (
    <main className="lp-section overflow-x-clip">
      <div className="lp-container px-4 sm:px-6">
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

        {plans.length === 0 ? (
          <div className="mt-12 sm:mt-16 mx-auto max-w-xl rounded-2xl border p-8 text-center">
            <p className="text-base font-medium">
              No active subscription plans are available right now.
            </p>
          </div>
        ) : (
          <div className={containerClass}>
            {plans.map((plan, index) => (
              <div key={plan.id} className={itemClass}>
                <div className="w-full flex flex-col [&>*]:flex-1">
                  <PlanCard
                    index={index}
                    name={plan.name}
                    duration={plan.duration}
                    priceText={formatPrice(plan.price, plan.currency)}
                    originalText={
                      plan.original !== undefined
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
                      studentIds && studentIds.length > 0
                        ? "Pay now"
                        : "Get started"
                    }
                    onSelect={() => handleButtonClick(plan)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <PricingTrustNote>
          Payments are processed securely by Paystack
        </PricingTrustNote>
      </div>
    </main>
  );
};

export default PricingPage;
