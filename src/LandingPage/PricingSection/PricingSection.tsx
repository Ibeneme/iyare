import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  Check,
  Sparkles,
  ArrowRight,
  Globe,
  Trophy,
  X,
  User,
  BookOpen,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../Redux/baseurl";
import { AllPrices } from "../../Redux/Slices/SettingsSlice";
import { AppDispatch } from "../../Redux/store";
import { useDispatch } from "react-redux";

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
        // Recommended: true,
        name: "3 Months",
        duration: 90,
        original: basePrice * 3,
        price: Math.round(basePrice * 3 * 0.967), // ~3% discount
        savings: Math.round(basePrice * 3 * 0.033),
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
        duration: 180,
        original: basePrice * 6,
        price: Math.round(basePrice * 6 * 0.9), // 10% discount
        savings: Math.round(basePrice * 6 * 0.1),
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

    const callbackUrl = `${window.location.origin}/verify-payments`;
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const email = localStorage.getItem("userEmail");

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
      <div className="min-h-screen bg-gradient-to-b from-[#f5fdf5] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ffd000] mx-auto mb-4" />
          <p className="text-[#023009]/70">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PRICING SECTION */}
      <section className="relative bg-gradient-to-b from-[#f5fdf5] to-white py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffd000]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ffd000]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-[#023009] mb-6">
              Let's Finish Up
            </h2>
            <p className="text-xl text-[#023009]/70 max-w-3xl mx-auto">
              Unlock full access to live classes, exam prep, and personalized
              support.
              <br className="hidden md:block" />
              Pay once, learn for months!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-0 md:mt-32">
            {dynamicPlans.map((plan, index) => (
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
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-[24] bg-[#ffd000] text-[#023009] px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> MOST POPULAR
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
                      {plan.duration} days access
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
                            Save {formatPrice(plan.savings)}
                          </span>
                        </div>
                        <div className="text-5xl font-black text-[#023009] mt-2">
                          {formatPrice(plan.price)}
                        </div>
                        <p className="text-sm text-[#023009]/70 mt-1">
                          per student
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl font-black text-[#023009]">
                          {formatPrice(plan.price)}
                        </div>
                        <p className="text-sm text-[#023009]/70 mt-1">
                          per student
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
                      onClick={() => handlePayClick(plan)}
                      disabled={studentDetails.length === 0}
                      className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-[#ffd000] text-[#023009] hover:bg-yellow-300"
                          : "bg-[#023009] text-white hover:bg-[#023009]/90"
                      } transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {studentDetails.length > 0
                        ? "Select Students & Pay"
                        : "No Students"}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <p className="text-[#023009]/60 text-sm">
              <Globe className="inline w-4 h-4 mr-1" />
              Trusted by 10,000+ parents across Nigeria{" "}
              <Trophy className="inline w-4 h-4 ml-1 text-[#ffd000]" />
            </p>
          </motion.div>
        </div>
      </section>

      {/* MODAL - unchanged (only uses dynamicPlan now) */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#ffd000]/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#023009]">
                  Confirm Payment
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-[#023009]/70" />
                </button>
              </div>
              <p className="text-[#023009]/70 mt-1">
                Select students for <strong>{selectedPlan.name}</strong> plan
              </p>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {studentDetails.map((student: any) => {
                const isSelected = selectedStudents.has(student._id);
                const gradeTitle = getGradeTitle(student.class);
                const subjectNames = student.subjects.map(getSubjectName);

                return (
                  <motion.div
                    key={student._id}
                    layout
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected
                        ? "border-[#ffd000] bg-[#ffd000]/5"
                        : "border-[#ffd000]/30 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student._id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? "bg-[#023009] border-[#023009] shadow-md"
                                : "bg-white border-[#ffd000]/50 hover:border-[#ffd000]"
                            }`}
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: isSelected ? 1 : 0 }}
                              className="w-3 h-3 bg-[#ffd000] rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-[#023009]/70" />
                            <span className="font-bold text-[#023009]">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-[#023009]/70">
                            <BookOpen className="w-4 h-4" />
                            <span>{gradeTitle}</span>
                          </div>
                        </div>
                      </label>
                    </div>

                    {subjectNames.length > 0 && (
                      <div className="mt-4 pl-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {subjectNames.map((name: string, i: number) => (
                            <span
                              key={i}
                              className="inline-block px-3 py-1.5 bg-[#023009] text-white text-xs font-medium rounded-full"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#ffd000]/30 bg-[#f9fdf9]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#023009]/70">Total Selected</p>
                  <p className="text-2xl font-black text-[#023009]">
                    {selectedStudents.size} student
                    {selectedStudents.size !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#023009]/70">Total Amount</p>
                  <p className="text-3xl font-black text-[#023009]">
                    {formatPrice(getSelectedTotal())}
                  </p>
                </div>
              </div>

              <button
                onClick={proceedToPayment}
                disabled={selectedStudents.size === 0}
                className="w-full bg-[#023009] text-white py-4 rounded-xl font-black text-lg hover:bg-[#023009]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                {selectedStudents.size === 0
                  ? "Select at least one student"
                  : `Proceed to Pay ${formatPrice(getSelectedTotal())}`}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PricingSection;
