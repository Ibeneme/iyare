// src/pages/PaymentStatusPage.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../../Redux/baseurl";
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
            <Loader2 className="w-16 h-16 mx-auto text-[#ffd000] animate-spin" />
            <h2 className="text-3xl font-black text-[#023009]">
              Verifying Payment...
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Please do not close or refresh this page. We’re confirming your
              payment.
            </p>
          </div>
        );

      case "success":
        if (!verifiedPayment) return null;
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-20 h-20 mx-auto text-emerald-600" />
            <h2 className="text-3xl font-black text-[#023009]">
              Payment Successful!
            </h2>
            <p className="text-lg text-gray-700 max-w-xl mx-auto">
              Thank you! Your payment of{" "}
              <strong className="text-[#023009] font-bold">
                {verifiedPayment.currency === "NGN" ? "₦" : "$"}
                {verifiedPayment.amount.toFixed(2)}
              </strong>{" "}
              for a{" "}
              <strong className="text-[#023009] font-bold">
                {verifiedPayment.duration}
              </strong>{" "}
              plan has been confirmed.
            </p>
            <p className="text-sm text-gray-500">
              Reference:{" "}
              <strong className="text-[#023009]">
                {searchParams.get("reference")}
              </strong>
            </p>

            <button
              onClick={() => navigate("/subscriptions-history")}
              className="inline-flex items-center gap-2 bg-[#023009] text-white font-bold py-3 px-6 rounded-full hover:bg-[#023009]/90 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Subscription History
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case "failed":
        return (
          <div className="text-center space-y-6">
            <XCircle className="w-20 h-20 mx-auto text-red-600" />
            <h2 className="text-3xl font-black text-[#023009]">
              Payment Failed
            </h2>
            <p className="text-lg text-gray-700 max-w-xl mx-auto">
              {message ||
                "There was an issue processing your payment. Please try again or contact support."}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-[#ffd000] text-[#023009] font-bold py-3 px-6 rounded-full hover:bg-[#ffd000]/90 transition-all shadow-lg hover:shadow-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl  shadow-2xl p-10 max-w-2xl w-full text-center">
        {renderStatusContent()}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
