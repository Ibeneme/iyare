// src/pages/VerifyPayment/VerifyPayment.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import CheckoutHeader from "./CheckoutHeader";
import PaymentResultCard from "./PaymentResultCard";
import type { PaymentRecord } from "./PaymentRecordCard";
import { BASE_URL } from "../../lib/baseUrl";

const VerifyPayment: React.FC = () => {
  console.log("VerifyPayment component mounted");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract Paystack reference (trxref is the real one)
  const trxref = searchParams.get("trxref");
  const reference = searchParams.get("reference"); // Logged only
  console.log("Extracted trxref:", trxref);
  console.log("Extracted reference (for logging):", reference);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Current Time & Country
  const currentTime = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  console.log("Current time (NG):", currentTime);

  useEffect(() => {
    console.log("useEffect [trxref] triggered");
    console.log("PAYMENT CALLBACK LANDING");
    console.log("Time:", currentTime);
    console.log("Country: NG");
    console.log("trxref (USED):", trxref);
    console.log("reference (LOGGED):", reference);
    console.log("========================================");

    if (!trxref) {
      console.log("No trxref found → setting error");
      setError("We couldn't find a payment reference in this link.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      console.log("verifyPayment function called");
      try {
        console.log("VERIFYING PAYMENT WITH API...");
        console.log(
          "API URL:",
          `${BASE_URL}/api/payment/yare/pay/verify-lesson-fee/${trxref}`
        );
        const res = await axios.get(
          `${BASE_URL}/api/payment/yare/pay/verify-lesson-fee/${trxref}`
        );
        console.log("API response received:", res.status);
        console.log("Response data:", res.data);

        if (res.data.success) {
          console.log("VERIFICATION SUCCESS");
          setSuccess(true);
          setPayments(res.data.payments);
          console.log("VERIFICATION SUCCESS:", res.data.payments);
        } else {
          console.log("Verification failed (API level):", res.data.message);
          setError(res.data.message || "We couldn't verify this payment.");
        }
      } catch (err: any) {
        console.error("AXIOS ERROR:", err);
        const msg =
          err.response?.data?.error || "Something went wrong while verifying. Please try again.";
        console.log("Setting error state:", msg);
        setError(msg);
        console.error("VERIFICATION ERROR:", err.response?.data || err);
      } finally {
        console.log("Setting loading = false");
        setLoading(false);
      }
    };

    verifyPayment();
  }, [trxref]);

  // Auto redirect on success
  useEffect(() => {
    console.log("useEffect [success, navigate] triggered");
    if (success) {
      console.log("Success detected → starting 5s redirect timer");
      const timer = setTimeout(() => {
        console.log("Timer expired → navigating to /classes/dashboard/all");
      }, 5000);
      return () => {
        console.log("Cleanup: clearing redirect timer");
        clearTimeout(timer);
      };
    }
  }, [success, navigate]);

  // Clean URL after load — BUT KEEP SEARCH PARAMS IN ADDRESS BAR
  useEffect(() => {
    console.log("useEffect [trxref] for URL cleanup triggered");
    if (trxref) {
      console.log("trxref exists → preserving URL with search params");
      console.log("Current URL:", window.location.href);
      // DO NOT replaceState — keep the full URL with ?trxref=...
      // window.history.replaceState({}, "", "/verify-payment"); ← REMOVED
      console.log("URL preserved — search params still visible");
    }
  }, [trxref]);

  // Loading State
  if (loading) {
    console.log("Rendering LOADING state");
    return (
      <>
        <CheckoutHeader />
        <main className="flex-1 grid place-items-center p-4" role="status" aria-live="polite">
          <div className="lp-card p-10 sm:p-12 text-center max-w-md w-full">
            <Loader2 className="w-14 h-14 animate-spin mx-auto mb-6" style={{ color: "var(--lp-green-mid)" }} />
            <h1 className="lp-h3" style={{ fontSize: "1.6rem" }}>Confirming your payment…</h1>
            <p className="lp-muted mt-2">Hang tight while we check with Paystack. This only takes a moment.</p>
          </div>
        </main>
      </>
    );
  }

  console.log("Rendering MAIN UI — success:", success, "error:", error);
  return (
    <>
      <CheckoutHeader />
      <div className="flex-1 grid place-items-center p-4 pb-12">
        <PaymentResultCard
          success={success}
          error={error}
          payments={payments}
          reference={trxref}
          verifiedAt={currentTime}
          onContinue={() => {
            console.log("User clicked: Go to Dashboard");
            navigate("/sign-in");
          }}
          onRetry={() => {
            console.log("User clicked: Try Again");
            window.location.reload();
          }}
          onSupport={() => {
            console.log("User clicked: Contact Support");
            navigate("/support");
          }}
        />
      </div>
    </>
  );
};

console.log("VerifyPayment component defined");
export default VerifyPayment;
