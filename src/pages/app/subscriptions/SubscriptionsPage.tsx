import { getCookie, } from "../../../utils/cookies";
// src/pages/SubscriptionPage.tsx
import React, { useEffect, useState } from "react";
import { fetchDiscounts } from "../../../store/features/settings/settings.slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface Discount {
  _id: string;
  title: string;
  percentage: number;
}

interface PriceData {
  _id: string;
  __v: number;
  internationalPrice: number;
  localPrice: number;
  updatedAt: string;
  updatedBy: string;
  discounts: Discount[];
}

interface User {
  _id: string;
  email: string;
  userType: string;
}

const SubscriptionPage: React.FC = () => {
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dispatch(fetchDiscounts()).unwrap();
        setPriceData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch subscription data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptionData();
  }, [dispatch]);

  useEffect(() => {
    const fetchLocation = async () => {
      const mockLocation = "NG";
      setUserCountry(mockLocation);
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    if (priceData && userCountry) {
      setBasePrice(
        userCountry === "NG"
          ? priceData.localPrice
          : priceData.internationalPrice
      );
    }
  }, [priceData, userCountry]);

  const formatPrice = (price: number) => {
    const currency = userCountry === "NG" ? "NGN" : "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const calculateDiscountedPrice = (percentage: number): number => {
    if (basePrice === null) return 0;
    return basePrice * (1 - percentage / 100);
  };

  const renderFormattedPrice = (price: number) => {
    const currency = userCountry === "NG" ? "₦" : "$";
    const formatted = price.toFixed(2);
    const [whole, decimal] = formatted.split(".");

    return (
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-2xl font-semibold text-primary">{currency}</span>
        <span className="text-4xl font-semibold tracking-tight text-primary">{whole}</span>
        <span className="text-2xl font-semibold text-primary">.{decimal}</span>
      </div>
    );
  };

  const handlePayNow = async (amount: number) => {
    setPaymentProcessing(true);
    setError(null);

    try {
      const userString = getCookie("user");
      if (!userString) throw new Error("User not logged in.");

      const user: User = JSON.parse(userString);
      const { email, _id: payerId, userType: payerModel } = user;

      const duration = "30 days";
      const callback_url = `${window.location.origin}/app/payment-status`;

      const payload = {
        email,
        amount,
        studentId,
        payerId,
        payerModel,
        duration,
        callback_url,
      };

      const response = await axios.post(
        `${BASE_URL}/api/payment/yare/pay/pay-lesson-fee`,
        payload
      );

      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Payment failed. Please try again.";
      setError(errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading || !priceData || basePrice === null) {
    return (
      <div className="page min-h-[60vh] flex items-center justify-center">
        <div className="card-elevated rounded-full px-5 py-3 flex items-center gap-3 text-primary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading plans…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page min-h-[60vh] flex items-center justify-center">
        <div className="bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-6 py-5 rounded-3xl max-w-md flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-2">
        <h1 className="page-title">
          Choose Your Learning Plan
        </h1>
        <p className="page-subtitle max-w-2xl">
          Unlock full access to the Iyare Learning Hub — innovative curriculum,
          mentorship, and a thriving community.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {priceData.discounts.map((discount) => {
          const discountedPrice = calculateDiscountedPrice(discount.percentage);
          const hasDiscount = discount.percentage > 0;

          return (
            <div
              key={discount._id}
              className="card hover:shadow-elevated transition-shadow duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 text-center">
                <h3 className="text-2xl font-semibold text-primary mb-2">
                  {discount.title}
                </h3>
                {hasDiscount && (
                  <span className="badge-red">
                    {discount.percentage}% OFF
                  </span>
                )}
                <div className="mt-4">
                  {renderFormattedPrice(discountedPrice)}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-muted line-through mt-2">
                    {formatPrice(basePrice)}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 px-6 sm:px-8 pb-6 space-y-3 divider pt-6">
                <h4 className="text-sm font-medium text-muted mb-2">
                  What's included
                </h4>
                {[
                  "Innovative Curriculum",
                  "Mentorship and Support",
                  "Community-Driven Education",
                  "Access to All Learning Programs",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
                    <span className="text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="p-6 sm:p-8 pt-0">
                <button
                  onClick={() => {
                    if (studentId) {
                      handlePayNow(discountedPrice);
                    } else {
                      navigate("/auth-sign-up");
                    }
                  }}
                  disabled={paymentProcessing && !!studentId}
                  className={`
 w-full py-3.5 px-6 rounded-full font-semibold transition-all
 ${
 studentId
 ?"bg-brand text-brand-fg hover:bg-[var(--color-brand-hover)]"
                        : "bg-accent text-accent-fg hover:bg-[var(--color-accent-hover)]"
                    }
                    disabled:opacity-70 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {paymentProcessing && studentId ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : studentId ? (
                    "Pay Now"
                  ) : (
                    "Get Started"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-8 text-sm text-muted">
        <p>
          All plans include a <strong>30-day access</strong> to premium
          features.
        </p>
        <p className="mt-2">
          Need help?{" "}
          <a href="/contact" className="text-primary font-medium underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
