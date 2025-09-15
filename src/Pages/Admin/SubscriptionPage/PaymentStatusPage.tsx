import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import { BASE_URL } from "../../../Redux/baseurl";
import "./PaymentStatusPage.css"; // Import the CSS file

// Interface for the payment details received from the backend
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
  // Add other relevant details you want to display
}

// Interface for the payment verification response from the backend
interface VerificationResponse {
  success: boolean;
  message: string;
  payment?: VerifiedPayment; // Use the VerifiedPayment interface
}

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Initialize useNavigate
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
          {
            params: { paymentId, trxref, reference },
          }
        );

        console.log(response, "response");

        if (response.data.success && response.data.payment?.paid.isPaid) {
          setStatus("success");
          setMessage(response.data.message);
          setVerifiedPayment(response.data.payment);
        } else {
          setStatus("failed");
          setMessage(
            response.data.message ||
              "Payment verification failed. Please try again."
          );
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
  }, [searchParams]); // Added navigate to dependency array

  const renderStatusContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <div className="status-icon loading-spinner"></div>
            <h2 className="status-title">Verifying your payment...</h2>
            <p className="status-message">
              Please do not close or refresh this page.
            </p>
          </>
        );
      case "success":
        if (!verifiedPayment) return null;
        return (
          <>
            <div className="status-icon success-icon">✔</div>
            <h2 className="status-title">Payment Successful!</h2>
            <p className="status-message">
              Thank you for your subscription. Your payment of{" "}
              <strong>
                {verifiedPayment.amount.toFixed(2)} {verifiedPayment.currency}
              </strong>{" "}
              for a <strong>{verifiedPayment.duration}</strong> plan has been
              confirmed.
            </p>
            <p className="transaction-reference">
              Reference: <strong>{searchParams.get("reference")}</strong>
            </p>
            {/* New button for navigation */}
            <button
              className="navigate-button"
              onClick={() => navigate("/subscriptions-history")}
            >
              Go to Subscription History
            </button>
          </>
        );
      case "failed":
        return (
          <>
            <div className="status-icon failed-icon">✖</div>
            <h2 className="status-title">Payment Failed</h2>
            <p className="status-message">
              {message ||
                "There was an issue processing your payment. Please try again or contact support."}
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="payment-status-container">
      <div className="status-card">{renderStatusContent()}</div>
    </div>
  );
};

export default PaymentStatusPage;
