// src/pages/ForgotPassword/ForgotPassword.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import {
  forgotPassword,
  verifyForgotPassword,
  resetPassword,
  resendOtp,
} from "../Redux/Admin/adminUsers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  RefreshCw,
  Loader2,
  Shield,
} from "lucide-react";

const ForgotPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [userType, setUserType] = useState<
    "student" | "parent" | "teacher" | "admin"
  >((location.state?.userType as any) ?? "student");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(
        forgotPassword({ userType, email })
      ).unwrap();
      console.log(result)
      setSuccess("OTP sent! Check your email.");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError("Enter 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(
        verifyForgotPassword({ email, otp })
      ).unwrap();
      setResetToken(result.resetToken);
      setSuccess("OTP verified!");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords don’t match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password too short.");
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        resetPassword({ userType, email, password, token: resetToken! })
      ).unwrap();
      setSuccess("Password reset! Redirecting...");
      setTimeout(() => {
        navigate(
          userType === "admin" || userType === "teacher"
            ? `/admin-sign-in?type=${userType}`
            : `/auth-sign-in?type=${userType}`
        );
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await dispatch(resendOtp({ userType, email })).unwrap();
      setSuccess("OTP resent!");
    } catch (err: any) {
      setError(err.message || "Failed to resend.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as any);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-12 h-12 text-[#023009]" />
            </div>
            <h1 className="text-3xl font-black text-[#023009]">
              Reset Password
            </h1>
            <p className="text-[#023009]/70 mt-1">Step {step} of 3</p>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-10 h-2 rounded-full transition-all ${
                  i <= step ? "bg-[#023009]" : "bg-[#ffd000]/30"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Email */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                onSubmit={handleEmailSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Account Type
                  </label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-[39%] -translate-y-[39%] w-5 h-5 text-[#023009]/50" />
                    <input
                      type="email"
                      placeholder="you@yare.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#023009] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </motion.form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                onSubmit={handleOtpSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full text-center text-2xl font-bold tracking-widest py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#023009] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full bg-[#ffd000] text-[#023009] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-all"
                >
                  <RefreshCw className="w-5 h-5" /> Resend OTP
                </button>
              </motion.form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                onSubmit={handlePasswordReset}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-[39%] -translate-y-[39%] w-5 h-5 text-[#023009]/50" />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-[39%] -translate-y-[39%] text-[#023009]/50 hover:text-[#023009]"
                    >
                      {showNew ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-[39%] -translate-y-[39%] w-5 h-5 text-[#023009]/50" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-[39%] -translate-y-[39%] text-[#023009]/50 hover:text-[#023009]"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#023009] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Feedback */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm text-center font-medium mt-4"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-green-600 text-sm text-center font-medium mt-4 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> {success}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Back */}
          <div className="text-center mt-6">
            <button
              onClick={goBack}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[#023009]/70 hover:text-[#023009] text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-[#023009]/60 text-xs font-mono tracking-widest">
          <strong className="text-[#023009]">
            Secure Reset • End-to-End Encrypted
          </strong>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
