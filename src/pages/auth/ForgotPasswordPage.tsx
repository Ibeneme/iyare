import Select from "../../components/ui/Select";
// src/pages/ForgotPassword/ForgotPassword.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/index";
import {
  forgotPassword,
  verifyForgotPassword,
  resetPassword,
  resendOtp,
} from "../../store/features/users/users.slice";
import { motion, AnimatePresence } from "framer-motion";
import AuthShell, { AuthNotice, Stepper } from "./AuthShell";
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
            : `/sign-in?type=${userType}`
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
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a code to set a new one"
      showHomeLink={false}
      badge={<span className="badge-gray"><Shield className="w-3.5 h-3.5" /> Secure reset</span>}
    >
      <Stepper step={step} total={3} labels={["Email", "Verify code", "New password"]} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="fp-type" className="form-label">Account type</label>
              <Select id="fp-type" value={userType} onChange={(e) => setUserType(e.target.value as any)} className="form-select">
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div>
              <label htmlFor="fp-email" className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input id="fp-email" type="email" autoComplete="email" placeholder="you@yare.ng" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input pl-10" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code"}
            </button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="fp-otp" className="form-label">6-digit code</label>
              <input id="fp-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required className="form-input text-center text-2xl font-semibold tracking-[0.5em]" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify code"}
            </button>
            <button type="button" onClick={handleResend} disabled={loading} className="btn-secondary w-full">
              <RefreshCw className="w-4 h-4" /> Resend code
            </button>
          </motion.form>
        )}

        {step === 3 && (
          <motion.form key="password" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="fp-new" className="form-label">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input id="fp-new" type={showNew ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input pl-10 pr-11" />
                <button type="button" aria-label={showNew ? "Hide password" : "Show password"} onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="fp-confirm" className="form-label">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input id="fp-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="form-input pl-10 pr-11" />
                <button type="button" aria-label={showConfirm ? "Hide password" : "Show password"} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset password"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <AuthNotice tone="error">{error}</AuthNotice>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <AuthNotice tone="success"><Check className="w-4 h-4 inline mr-1" />{success}</AuthNotice>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-6">
        <button type="button" onClick={goBack} disabled={loading} className="btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;
