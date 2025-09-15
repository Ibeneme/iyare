import React, { useEffect, useState } from "react";
import "./SubscriptionPage.css";
import { fetchDiscounts } from "../../../Redux/Settings/SettingsSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import axios from "axios"; // Import axios
import { BASE_URL } from "../../../Redux/baseurl";
import { useNavigate, useParams } from "react-router-dom";

// Define the data structure to ensure type safety
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

// Define the structure of the user object expected from localStorage
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

  console.log(studentId, "studentId");

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
      if (userCountry === "NG") {
        setBasePrice(priceData.localPrice);
      } else {
        setBasePrice(priceData.internationalPrice);
      }
    }
  }, [priceData, userCountry]);

  const formatPrice = (price: number) => {
    const currency = userCountry === "NG" ? "NGN" : "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const calculateDiscountedPrice = (percentage: number): number => {
    if (basePrice === null) return 0;
    return basePrice * (1 - percentage / 100);
  };

  const renderFormattedPrice = (price: number) => {
    const currency = userCountry === "NG" ? "₦" : "$";
    const formatted = price.toFixed(2);
    const [nairaPart, koboPart] = formatted.split(".");

    return (
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 24, verticalAlign: "top", fontWeight: 900 }}>
          {currency}
        </span>
        <span style={{ fontSize: 32, fontWeight: 900 }}>{nairaPart}</span>
        <span style={{ fontSize: 24, fontWeight: 900 }}>.{koboPart}</span>
      </span>
    );
  };

  const handlePayNow = async (amount: number) => {
    setPaymentProcessing(true);
    setError(null);

    try {
      const userString = localStorage.getItem("user");
      if (!userString) {
        throw new Error("User not logged in. Please log in to subscribe.");
      }
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

      console.log(payload, "payload");

      const response = await axios.post(
        `${BASE_URL}/api/payment/yare/pay/pay-lesson-fee`,
        payload
      );

      const { checkout_url } = response.data;

      window.location.href = checkout_url;
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "An error occurred during payment.";
      setError(errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading || !priceData || basePrice === null) {
    return (
      <div className="subscription-container">Loading subscriptions...</div>
    );
  }

  if (error) {
    return (
      <div className="subscription-container subscription-error">{error}</div>
    );
  }

  return (
    <div className="subscription-container">
      <h2 className="subscription-title">Choose Your Plan</h2>
      <p className="subscription-info">
        Your subscription includes all the powerful features of the Iyare
        Learning Hub. View the plans below to find the perfect fit for your
        budget.
      </p>

      <ul className="price-list">
        {priceData.discounts.map((discount) => (
          <li key={discount._id} className="price-item">
            <div>
              <h3 className="plan-title">{discount.title}</h3>
              {discount.percentage > 0 && (
                <span className="discount-badge">
                  {discount.percentage}% Off
                </span>
              )}
              <div className="price">
                {renderFormattedPrice(
                  calculateDiscountedPrice(discount.percentage)
                )}
              </div>
              {discount.percentage > 0 && (
                <div className="original-price">
                  Original Price: {formatPrice(basePrice)}
                </div>
              )}
            </div>

            <div className="packages">
              <h4 className="packages-title">What's Included:</h4>
              <ul className="packages-list">
                <li>Innovative Curriculum</li>
                <li>Mentorship and Support</li>
                <li>Community-Driven Education</li>
                <li>Access to All Learning Programs</li>
              </ul>
            </div>

            <button
              className="cta-button"
              onClick={() => {
                if (studentId) {
                  handlePayNow(calculateDiscountedPrice(discount.percentage));
                } else {
                  navigate("/auth-sign-up");
                }
              }}
              disabled={paymentProcessing && !!studentId}
            >
              {studentId
                ? paymentProcessing
                  ? "Processing..."
                  : "Pay Now"
                : "Get Started"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionPage;
