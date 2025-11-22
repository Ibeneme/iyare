// src/pages/VerifyPayment/VerifyPayment.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Clock,
  CreditCard,
} from "lucide-react";
import { BASE_URL } from "../../Redux/baseurl";

interface PaymentRecord {
  _id: string;
  studentName: string;
  amount: number;
  duration: string;
  expiresAt: string;
  paid: {
    timestamp: string;
    paymentMethod: string;
  };
}

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
      setError("No payment reference found.");
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
          setError(res.data.message || "Verification failed.");
        }
      } catch (err: any) {
        console.error("AXIOS ERROR:", err);
        const msg =
          err.response?.data?.error || "Verification failed. Please try again.";
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
      // window.history.replaceState({}, "", "/verify-payments"); ← REMOVED
      console.log("URL preserved — search params still visible");
    }
  }, [trxref]);

  // Loading State
  if (loading) {
    console.log("Rendering LOADING state");
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border-4 border-[#ffd000] p-12 shadow-xl text-center max-w-md w-full"
        >
          <Loader2 className="w-16 h-16 animate-spin text-[#023009] mx-auto mb-6" />
          <h2 className="text-2xl font-black text-[#023009] mb-2">
            Verifying Payment...
          </h2>
          <p className="text-[#023009]/70">
            Please wait while we confirm your transaction.
          </p>
        </motion.div>
      </div>
    );
  }

  console.log("Rendering MAIN UI — success:", success, "error:", error);
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
            {success ? (
              <CheckCircle className="w-14 h-14 text-[#023009]" />
            ) : (
              <XCircle className="w-14 h-14 text-red-600" />
            )}
          </div>
          <h1
            className={`text-3xl font-black ${
              success ? "text-[#023009]" : "text-red-600"
            }`}
          >
            {success ? "Payment Successful!" : "Payment Failed"}
          </h1>
          <p className="text-[#023009]/70 mt-2">
            {success
              ? "Your subscription has been activated."
              : "We couldn't verify your payment."}
          </p>
        </div>

        {success && payments.length > 0 && (
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-bold text-[#023009] text-center">
              Subscription Details
            </h3>
            {payments.map((p, i) => {
              console.log(
                `Rendering payment card ${i} for student:`,
                p.studentName
              );
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#f9fdf9] border-2 border-[#ffd000]/50 rounded-xl p-5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#023009]">
                      {p.studentName}
                    </span>
                    <span className="text-sm text-[#023009]/70">
                      Ref: {trxref}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#023009]/60" />
                      <div>
                        <p className="text-[#023009]/60">Amount</p>
                        <p className="font-bold">
                          ₦{p.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#023009]/60" />
                      <div>
                        <p className="text-[#023009]/60">Duration</p>
                        <p className="font-bold">{p.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#023009]/60" />
                      <div>
                        <p className="text-[#023009]/60">Expires</p>
                        <p className="font-bold">
                          {new Date(p.expiresAt).toLocaleDateString("en-NG")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Paid via {p.paid.paymentMethod}
                    </span>
                    <span className="text-[#023009]/60">
                      {new Date(p.paid.timestamp).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            {error.includes("not found") && (
              <p className="text-red-600 text-sm mt-2">
                Contact support with reference: <strong>{trxref}</strong>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {success ? (
            <>
              <button
                onClick={() => {
                  console.log("User clicked: Go to Dashboard");
                  navigate("/auth-sign-in");
                }}
                className="px-6 py-3 bg-[#023009] text-white rounded-xl font-bold hover:bg-[#023009]/90 transition flex items-center justify-center gap-2"
              >
                Proceed
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
              <p className="text-[#023009]/70 text-sm self-center"></p>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  console.log("User clicked: Try Again");
                  window.location.reload();
                }}
                className="px-6 py-3 bg-[#ffd000] text-[#023009] rounded-xl font-bold hover:bg-[#ffd000]/90 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  console.log("User clicked: Contact Support");
                  navigate("/support");
                }}
                className="px-6 py-3 border-2 border-[#023009] text-[#023009] rounded-xl font-bold hover:bg-[#023009]/5 transition"
              >
                Contact Support
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#023009]/50">
          <p>Verified at: {currentTime}</p>
          <p>Transaction ID: {trxref}</p>
        </div>
      </motion.div>
    </div>
  );
};

console.log("VerifyPayment component defined");
export default VerifyPayment;
