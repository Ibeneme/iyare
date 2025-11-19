import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, Sparkles, ArrowRight, Globe } from "lucide-react";
import { AllPrices } from "../../Redux/Slices/SettingsSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../Redux/store";

interface Plan {
  name: string;
  duration: string;
  months: number;
  original: number;
  price: number;
  savings: number;
  popular?: boolean;
  features: string[];
  planId: string;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [isNigeria, setIsNigeria] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<{
    local: number;
    international: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const { studentIds, parentId } = location.state || {};

  // Fetch prices
  useEffect(() => {
    dispatch(AllPrices())
      .unwrap()
      .then((res) => {
        setPrices({
          local: res.data.localPrice,
          international: res.data.internationalPrice,
        });
      })
      .catch(() => {
        setPrices({ local: 50000, international: 100000 });
      });
  }, [dispatch]);

  // Google-powered location detection
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const res = await fetch("https://geolocation-db.com/json/");
        const data = await res.json();
        const isNG =
          data.country_code === "NG" ||
          data.country_name?.toLowerCase().includes("nigeria");
        setIsNigeria(isNG);
      } catch {
        setIsNigeria(true);
      } finally {
        setLoading(false);
      }
    };
    detectLocation();
  }, []);

  // Base price per month (local or international)
  const basePricePerMonth = prices
    ? isNigeria === false
      ? prices.international
      : prices.local
    : 50000;

  // Clean, readable plans — price = months × base price × discount
  const plans: Plan[] = [
    {
      name: "1 Month",
      duration: "30 days access",
      months: 1,
      discount: 0, // 0%
      popular: false,
      features: [
        "Full live classes",
        "Digital workbooks & quizzes",
        "Parent progress dashboard",
        "WAEC/JAMB/BECE prep",
        "24/7 lesson recordings",
      ],
      planId: "monthly",
    },
    {
      name: "3 Months",
      duration: "90 days access",
      months: 3,
      discount: 0.033, // ~3.3% off → matches your old 0.967
      popular: true,
      features: [
        "Everything in 1 Month",
        "Free 1-on-1 teacher consultation",
        "Priority exam revision pack",
        "Study group leadership role",
        "Bonus learning games",
      ],
      planId: "quarterly",
    },
    {
      name: "6 Months",
      duration: "180 days access",
      months: 6,
      discount: 0.067, // ~6.7% off → matches your old 0.933
      popular: false,
      features: [
        "Everything in 3 Months",
        "Free printed revision booklet (Lagos only)",
        "Monthly parent-teacher call",
        "Early access to new subjects",
        "Certificate of Excellence",
      ],
      planId: "semiannual",
    },
  ].map((plan) => {
    const original = basePricePerMonth * plan.months;
    const price = Math.floor(original * (1 - plan.discount));
    const savings = original - price;

    return {
      ...plan,
      original,
      price,
      savings,
    };
  });

  const handleButtonClick = (plan: Plan) => {
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const totalAmount = plan.price * studentIds.length;
      navigate("/pricing-page/payment", {
        state: { parentId, studentIds, planId: plan.planId, totalAmount },
      });
    } else {
      navigate("/register");
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading || !prices) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5fdf5] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#ffd000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#023009]/70">Loading best prices for you...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative bg-gradient-to-b from-[#f5fdf5] to-white py-32 overflow-hidden">
      {/* Location Badge */}
      {isNigeria !== null && (
        <div className="absolute top-8 right-8 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <Globe className="w-4 h-4" />
          {isNigeria ? "Nigeria Pricing" : "International Pricing"}
        </div>
      )}

      {/* Hero */}
      <div className="text-center max-w-4xl mx-auto px-6 mb-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-black text-[#023009] mb-6"
        >
          Choose Your Learning Plan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-[#023009]/70"
        >
          {isNigeria
            ? "Affordable education for Nigerian families"
            : "Worldwide access to premium learning"}
        </motion.p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.planId}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            viewport={{ once: true }}
            className={`relative group ${
              plan.popular ? "md:scale-105 md:-mt-6 z-10" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-[24] bg-[#ffd000] text-[#023009] px-6 py-2 rounded-full font-bold text-[12px] flex items-center gap-2 shadow-lg">
                <Sparkles className="w-4 h-4" />
                MOST POPULAR
              </div>
            )}

            <div
              className={`relative bg-white p-8 rounded-3xl border-2 h-full flex flex-col transition-all duration-300 ${
                plan.popular
                  ? "border-[#ffd000] shadow-2xl"
                  : "border-[#ffd000]/50 hover:border-[#ffd000]"
              } group-hover:shadow-xl`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#023009]">
                  {plan.name}
                </h3>
                <p className="text-[#023009]/60 text-sm mt-1">
                  {plan.duration}
                </p>
              </div>

              <div className="text-center mb-8">
                {plan.savings > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl text-[#023009]/50 line-through">
                        {formatPrice(plan.original)}
                      </span>
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                        Save ₦{plan.savings.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-5xl font-black text-[#023009] mt-2">
                      {formatPrice(plan.price)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-black text-[#023009]">
                      {formatPrice(plan.price)}
                    </div>
                    <p className="text-sm text-[#023009]/70 mt-1">
                      {isNigeria === false ? "one-time payment" : "per student"}
                    </p>
                  </>
                )}
              </div>

              <ul className="space-y-4 flex-1 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#ffd000] flex-shrink-0 mt-0.5" />
                    <span className="text-[#023009]/80 text-sm leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <button
                  onClick={() => handleButtonClick(plan)}
                  className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-[#ffd000] text-[#023009] hover:bg-yellow-300 shadow-lg"
                      : "bg-[#023009] text-white hover:bg-[#023009]/90"
                  } transform hover:-translate-y-1`}
                >
                  {studentIds?.length > 0 ? "Pay Now" : "Get Started"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-20 text-[#023009]/60">
        <p className="text-sm">Secured by Paystack</p>
      </div>
    </section>
  );
};

export default PricingPage;
