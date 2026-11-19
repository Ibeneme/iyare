// src/pages/PaymentStatusPage.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../../lib/baseUrl";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface VerifiedPayment {
  _id: string;
  amount: number;
  duration: string;
  currency: string;
  paid: {
    isPaid: boolean;
    paymentMethod: string;
    timestamp: string;
  };
}

interface VerificationResponse {
  success: boolean;
  message: string;
  payment?: VerifiedPayment;
}

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [verifiedPayment, setVerifiedPayment] =
    useState<VerifiedPayment | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentId = searchParams.get("paymentId");
      const trxref = searchParams.get("trxref");
      const reference = searchParams.get("reference");

      if (!paymentId || !trxref || !reference) {
        setStatus("failed");
        setMessage("Invalid payment reference. Please contact support.");
        return;
      }

      try {
        const response = await axios.get<VerificationResponse>(
          `${BASE_URL}/api/payment/yare/pay/verify-lesson-fee/${paymentId}`,
          { params: { paymentId, trxref, reference } }
        );

        if (response.data.success && response.data.payment?.paid.isPaid) {
          setStatus("success");
          setMessage(response.data.message);
          setVerifiedPayment(response.data.payment);
        } else {
          setStatus("failed");
          setMessage(response.data.message || "Payment verification failed.");
        }
      } catch (error: any) {
        console.error("Payment verification failed:", error);
        setStatus("failed");
        setMessage(
          error.response?.data?.message ||
            "An error occurred during verification. Please try again or contact support."
        );
      }
    };

    verifyPayment();
  }, [searchParams]);

  const renderStatusContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="text-center space-y-6">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              Verifying Payment...
            </h2>
            <p className="text-base text-muted max-w-md mx-auto">
              Please do not close or refresh this page. We’re confirming your
              payment.
            </p>
          </div>
        );

      case "success":
        if (!verifiedPayment) return null;
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-14 h-14 mx-auto text-[var(--color-success)]" />
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              Payment Successful!
            </h2>
            <p className="text-base text-muted max-w-xl mx-auto">
              Thank you! Your payment of{" "}
              <strong className="text-primary font-semibold">
                {verifiedPayment.currency === "NGN" ? "₦" : "$"}
                {verifiedPayment.amount.toFixed(2)}
              </strong>{" "}
              for a{" "}
              <strong className="text-primary font-semibold">
                {verifiedPayment.duration}
              </strong>{" "}
              plan has been confirmed.
            </p>
            <p className="text-sm text-muted">
              Reference:{" "}
              <strong className="text-primary">
                {searchParams.get("reference")}
              </strong>
            </p>

            <button
              onClick={() => navigate("/app/subscriptions/history")}
              className="btn-primary"
            >
              Go to Subscription History
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case "failed":
        return (
          <div className="text-center space-y-6">
            <XCircle className="w-14 h-14 mx-auto text-[var(--color-danger)]" />
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              Payment Failed
            </h2>
            <p className="text-base text-muted max-w-xl mx-auto">
              {message ||
                "There was an issue processing your payment. Please try again or contact support."}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="btn-accent"
            >
              Try Again
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="card p-8 sm:p-12 max-w-xl w-full text-center">
        {renderStatusContent()}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
