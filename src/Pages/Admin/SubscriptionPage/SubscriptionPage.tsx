// src/pages/SubscriptionPage.tsx
import React, { useEffect, useState } from "react";
import { fetchDiscounts } from "../../../Redux/Slices/SettingsSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import axios from "axios";
import { BASE_URL } from "../../../Redux/baseurl";
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
        <span className="text-2xl font-black text-[#023009]">{currency}</span>
        <span className="text-4xl font-black text-[#023009]">{whole}</span>
        <span className="text-2xl font-black text-[#023009]">.{decimal}</span>
      </div>
    );
  };

  const handlePayNow = async (amount: number) => {
    setPaymentProcessing(true);
    setError(null);

    try {
      const userString = localStorage.getItem("user");
      if (!userString) throw new Error("User not logged in.");

      const user: User = JSON.parse(userString);
      const { email, _id: payerId, userType: payerModel } = user;

      const duration = "30 days";
      const callback_url = `${window.location.origin}/payment-success`;

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
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-[#023009]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xl font-bold">Loading plans...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-300 text-red-800 px-8 py-6 rounded-2xl shadow-lg max-w-md flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-bold text-lg">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] py-12 px-6">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-[#023009] mb-4">
          Choose Your Learning Plan
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          Unlock full access to the Iyare Learning Hub — innovative curriculum,
          mentorship, and a thriving community.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {priceData.discounts.map((discount) => {
          const discountedPrice = calculateDiscountedPrice(discount.percentage);
          const hasDiscount = discount.percentage > 0;

          return (
            <div
              key={discount._id}
              className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="p-8 text-center ]">
                <h3 className="text-2xl font-black text-[#023009] mb-2">
                  {discount.title}
                </h3>
                {hasDiscount && (
                  <span className="inline-block px-4 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
                    {discount.percentage}% OFF
                  </span>
                )}
                <div className="mt-4">
                  {renderFormattedPrice(discountedPrice)}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-gray-500 line-through mt-2">
                    {formatPrice(basePrice)}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 p-8 space-y-4">
                <h4 className="text-lg font-bold text-[#023009] mb-4">
                  What's Included:
                </h4>
                {[
                  "Innovative Curriculum",
                  "Mentorship and Support",
                  "Community-Driven Education",
                  "Access to All Learning Programs",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="p-8 pt-0">
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
                    w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all
                    ${
                      studentId
                        ? "bg-[#023009] text-white hover:bg-[#023009]/90"
                        : "bg-[#ffd000] text-[#023009] hover:bg-[#ffd000]/90"
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
      <div className="text-center mt-16 text-sm text-gray-600">
        <p>
          All plans include a <strong>30-day access</strong> to premium
          features.
        </p>
        <p className="mt-2">
          Need help?{" "}
          <a href="/contact" className="text-[#023009] font-bold underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
