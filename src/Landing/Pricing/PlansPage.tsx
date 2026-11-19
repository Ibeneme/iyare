import { getCookie } from "../../utils/cookies";
import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Globe, Trophy } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../lib/baseUrl";
import { AllPrices } from "../../store/features/settings/settings.slice";
import { AppDispatch } from "../../store/index";
import { useDispatch } from "react-redux";
import CheckoutHeader from "./CheckoutHeader";
import PricingHeroSection from "./PricingHeroSection";
import PlanCard from "./PlanCard";
import PricingLoadingScreen from "./PricingLoadingScreen";
import PaymentConfirmModal from "./PaymentConfirmModal";
import { PLAN_FEATURES } from "./planCatalog";

const GRADES_API = `${BASE_URL}/api/grades/grades`;

interface Plan {
  name: string;
  duration: number;
  original: number;
  price: number;
  savings: number;
  popular?: boolean;
  features: string[];
  planId: string;
}

interface StudentDetail {
  _id: string;
  firstName: string;
  lastName: string;
  class: string;
  subjects: string[];
}

interface Grade {
  _id: string;
  title: string;
}
interface Subject {
  _id: string;
  name: string;
}

const PricingSection: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const { parentId, studentDetails = [] } = location.state || {};

  // Core state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(studentDetails.map((s: StudentDetail) => s._id))
  );

  // Data state
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [isNigeria, setIsNigeria] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<{
    local: number;
    international: number;
  } | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // Fetch grades & subjects titles
  useEffect(() => {
    const fetchTitles = async () => {
      if (studentDetails.length === 0) return;

      try {
        const gradesRes = await axios.get(GRADES_API);
        const gradesMap: Record<string, Grade> = {};
        (gradesRes.data.data || []).forEach((g: Grade) => {
          gradesMap[g._id] = g;
        });
        setGrades(gradesMap);

        const subjectPromises = studentDetails.map(async (s: StudentDetail) => {
          if (!s.class || s.class.startsWith("custom:")) return;
          try {
            const res = await axios.get(`${GRADES_API}/subjects/${s.class}`);
            (res.data.data || []).forEach((sub: Subject) => {
              subjects[sub._id] = sub;
            });
          } catch (err) {
            /* silent */
          }
        });
        await Promise.all(subjectPromises);
        setSubjects(subjects);
      } catch (err) {
        console.error("Failed to load titles:", err);
      }
    };

    fetchTitles();
  }, [studentDetails]);

  // Fetch pricing & detect location
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      try {
        // 1. Fetch prices
        const priceRes = await dispatch(AllPrices()).unwrap();
        setPrices({
          local: priceRes.data.localPrice,
          international: priceRes.data.internationalPrice,
        });

        // 2. Detect location
        const geoRes = await fetch("https://geolocation-db.com/json/");
        const geoData = await geoRes.json();
        const detectedNG =
          geoData.country_code === "NG" ||
          geoData.country_name?.toLowerCase().includes("nigeria");

        setIsNigeria(detectedNG);
      } catch (err) {
        console.error("Failed to load pricing/location:", err);
        setPrices({ local: 50000, international: 100000 });
        setIsNigeria(true);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Generate dynamic plans based on base price
  const dynamicPlans = useMemo((): Plan[] => {
    if (!prices || isNigeria === null) return [];

    const basePrice = isNigeria ? prices.local : prices.international;

    return [
      {
        name: "1 Month",
        duration: 30,
        original: basePrice,
        price: basePrice,
        savings: 0,
        popular: false,
        features: PLAN_FEATURES.monthly,
        planId: "monthly",
      },
      {
        // Recommended: true,
        name: "3 Months",
        duration: 90,
        original: basePrice * 3,
        price: Math.round(basePrice * 3 * 0.967), // ~3% discount
        savings: Math.round(basePrice * 3 * 0.033),
        popular: true,
        features: PLAN_FEATURES.quarterly,
        planId: "quarterly",
      },
      {
        name: "6 Months",
        duration: 180,
        original: basePrice * 6,
        price: Math.round(basePrice * 6 * 0.9), // 10% discount
        savings: Math.round(basePrice * 6 * 0.1),
        popular: false,
        features: PLAN_FEATURES.semiannual,
        planId: "semiannual",
      },
    ];
  }, [prices, isNigeria]);

  // Format price with correct currency
  const formatPrice = (amount: number) => {
    const currency = isNigeria ? "NGN" : "USD";
    const locale = isNigeria ? "en-NG" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedStudents(new Set(studentDetails.map((s: any) => s._id)));
    setIsModalOpen(true);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getSelectedTotal = () =>
    selectedPlan ? selectedPlan.price * selectedStudents.size : 0;

  const getGradeTitle = (id: string) =>
    id.startsWith("custom:")
      ? id.replace("custom:", "")
      : grades[id]?.title || id;

  const getSubjectName = (id: string) => subjects[id]?.name || id;

  const proceedToPayment = async () => {
    const selected = studentDetails
      .filter((s: any) => selectedStudents.has(s._id))
      .map((s: any) => ({
        ...s,
        class: getGradeTitle(s.class),
        subjects: s.subjects.map(getSubjectName),
      }));

    const callbackUrl = `${window.location.origin}/verify-payment`;
    const storedUser = getCookie("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const email = getCookie("userEmail");

    const payload = {
      parentId: user?._id || parentId,
      email,
      studentDetails: selected,
      planId: selectedPlan?.planId,
      planName: selectedPlan?.name,
      totalAmount: getSelectedTotal(),
      duration: selectedPlan?.duration,
      callback_url: callbackUrl,
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/yare/pay/pay-lesson-fee`,
        payload
      );

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err: any) {
      console.error("Payment error:", err.response?.data || err.message);
    }

    setIsModalOpen(false);
  };

  if (loading || !prices || isNigeria === null || dynamicPlans.length === 0) {
    return (
      <>
        <CheckoutHeader />
        <PricingLoadingScreen message="Loading your plans…" />
      </>
    );
  }

  return (
    <>
      <CheckoutHeader />
      <main className="lp-section overflow-hidden pt-8">
        <div className="lp-container">
          <PricingHeroSection
            label="Last step"
            before="Let’s get learning"
            highlight="started."
            subtitle="Choose a plan to unlock live classes, exam prep and friendly teacher support. Pay once and learn for months."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3 pt-4">
            {dynamicPlans.map((plan, index) => (
              <PlanCard
                key={plan.planId}
                index={index}
                name={plan.name}
                duration={`${plan.duration} days access`}
                priceText={formatPrice(plan.price)}
                originalText={plan.savings > 0 ? formatPrice(plan.original) : undefined}
                savingsText={plan.savings > 0 ? formatPrice(plan.savings) : undefined}
                priceNote="per student"
                features={plan.features}
                popular={plan.popular}
                buttonLabel={studentDetails.length > 0 ? "Choose students & pay" : "No students yet"}
                disabled={studentDetails.length === 0}
                onSelect={() => handlePayClick(plan)}
              />
            ))}
          </div>

          <p className="mt-14 text-center text-sm lp-muted">
            <Globe className="inline w-4 h-4 mr-1" />
            Trusted by 10,000+ parents across Nigeria{" "}
            <Trophy className="inline w-4 h-4 ml-1" style={{ color: "var(--lp-yellow-text)" }} />
          </p>
        </div>
      </main>

      {isModalOpen && selectedPlan && (
        <PaymentConfirmModal
          planName={selectedPlan.name}
          students={studentDetails}
          selectedIds={selectedStudents}
          onToggle={toggleStudent}
          getGradeTitle={getGradeTitle}
          getSubjectName={getSubjectName}
          totalText={formatPrice(getSelectedTotal())}
          onClose={() => setIsModalOpen(false)}
          onProceed={proceedToPayment}
        />
      )}
    </>
  );
};

export default PricingSection;
