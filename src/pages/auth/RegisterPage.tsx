import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowRight,
  Users,
  Loader2,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./auth.css";
import AuthShell, { Stepper } from "./AuthShell";
import { PATHS } from "../../routes/paths";
import { BASE_URL } from "../../lib/baseUrl";

interface Parent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface Child {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  class?: string;
}

const API_BASE = `${BASE_URL}/api/users`;

// Reusable Input with Icon
const InputWithIcon = ({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  disabled = false,
  showToggle,
  show,
  toggleShow,
  className = "",
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
  showToggle?: boolean;
  show?: boolean;
  toggleShow?: () => void;
  className?: string;
}) => (
  <div className="relative">
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
      <Icon className="w-4 h-4" />
    </div>
    <input
      type={showToggle && show ? "text" : type}
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`form-input pl-10 ${showToggle ? "pr-11" : ""} ${className}`}
    />
    {showToggle && (
      <button
        type="button"
        onClick={toggleShow}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary"
        disabled={disabled}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    )}
  </div>
);

const GetStarted: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer states
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const [parent, setParent] = useState<Parent>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [children, setChildren] = useState<Child[]>([
    { firstName: "", lastName: "", email: "", phone: "", class: "" },
  ]);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    console.log("[STATE] Step:", step);
    console.log("[STATE] Parent:", parent);
    console.log("[STATE] Children:", children);
    console.log("[STATE] OTP:", otp);
    console.log("[STATE] Verified:", isVerified);
    console.log("[STATE] Resend Timer:", resendTimer);
  }, [step, parent, children, otp, isVerified, resendTimer]);

  const updateParent = (field: keyof Parent, value: string) => {
    if (isVerified) return;
    setParent((p) => ({ ...p, [field]: value }));
  };

  const updateChild = (idx: number, field: keyof Child, value: string) => {
    if (isVerified) return;
    setChildren((c) =>
      c.map((ch, i) => (i === idx ? { ...ch, [field]: value } : ch))
    );
  };

  const addChild = () => {
    if (isVerified) return;
    setChildren((c) => [
      ...c,
      { firstName: "", lastName: "", email: "", phone: "", class: "" },
    ]);
  };

  const removeChild = (idx: number) => {
    if (isVerified) return;
    setChildren((c) => c.filter((_, i) => i !== idx));
  };

  const sendOtp = async () => {
    setLoading(true);
    setMessage("");

    if (!isValidPhoneNumber(parent.phone)) {
      setMessage("Invalid phone number");
      setLoading(false);
      return;
    }
    if (parent.password.length < 8) {
      setMessage("Password must be 8+ characters");
      setLoading(false);
      return;
    }
    if (parent.password !== parent.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE}/register-parent`, {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phoneNumber: parent.phone,
        password: parent.password,
        confirmPassword: parent.confirmPassword,
      });

      setMessage("OTP sent to your email!");
      setStep(2);

      // Start 60-second timer
      setResendTimer(60);
      setCanResend(false);
    } catch (e: any) {
      setMessage(e.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend || loading) return;

    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_BASE}/register-parent`, {
        email: parent.email,
      });
      setMessage("OTP resent! Check your email.");

      // Restart 60-second timer
      setResendTimer(60);
      setCanResend(false);
    } catch (e: any) {
      setMessage(e.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    setLoading(true);
    setMessage("");

    const invalid = children.filter(
      (c) => c.phone && !isValidPhoneNumber(c.phone)
    );
    if (invalid.length) {
      setMessage("One or more child phone numbers are invalid");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/register-students-array`, {
        email: parent.email,
        otp,
        students: children.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          gradeId: c.class,
        })),
      });

      console.log(res, 'res')
      setIsVerified(true);
      setMessage("Registration complete – data locked");
      setStep(4);
    } catch (e: any) {
      setMessage(e.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const parentValid =
    parent.firstName &&
    parent.lastName &&
    parent.email &&
    parent.phone &&
    isValidPhoneNumber(parent.phone) &&
    parent.password.length >= 8 &&
    parent.password === parent.confirmPassword;

  const otpValid = otp.length === 6;
  const childrenValid = children.every(
    (c) =>
      c.firstName &&
      c.lastName &&
      c.email &&
      c.phone &&

      isValidPhoneNumber(c.phone)
  );

  return (
    <AuthShell
      width="lg"
      title={isVerified ? "Account locked" : "Get started"}
      subtitle={isVerified ? "Your data is secure and cannot be changed." : "Create your parent account in a few steps"}
      badge={
        <span className="badge-gray">
          {isVerified ? <Lock className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
          {isVerified ? "Verified" : "Secure registration"}
        </span>
      }
      footer={
        <p className="text-center text-sm text-muted mt-5">
          Already have an account?{" "}
          <a href={PATHS.signIn} className="font-semibold text-primary hover:underline">Sign in</a>
        </p>
      }
    >
          <Stepper step={step} total={4} labels={["Parent details", "Verify code", "Children", "Done"]} />

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 w-full justify-center text-center ${
                message.includes("success") || message.includes("complete")
                  ? "badge-green !rounded-xl"
                  : "badge-red !rounded-xl"
              }`}
            >
              {message}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1 – Parent */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <User className="w-5 h-5" /> Parent Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputWithIcon
                    icon={User}
                    placeholder="First Name"
                    value={parent.firstName}
                    onChange={(e) => updateParent("firstName", e.target.value)}
                    disabled={isVerified}
                  />
                  <InputWithIcon
                    icon={User}
                    placeholder="Last Name"
                    value={parent.lastName}
                    onChange={(e) => updateParent("lastName", e.target.value)}
                    disabled={isVerified}
                  />
                </div>
                <InputWithIcon
                  icon={Mail}
                  placeholder="Email"
                  type="email"
                  value={parent.email}
                  onChange={(e) => updateParent("email", e.target.value)}
                  disabled={isVerified}
                />
                {/* PHONE */}
                <div>
                  <label className="form-label">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10">
                      <Phone className="w-5 h-5" />
                    </div>
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="NG"
                      value={parent.phone}
                      onChange={(v) => updateParent("phone", v || "")}
                      disabled={isVerified}
                      placeholder="Enter phone number"
                      className={`phone-input ${isVerified ? "disabled" : ""}`}
                      style={{ paddingLeft: "3rem" }}
                    />
                  </div>
                  {parent.phone &&
                    !isValidPhoneNumber(parent.phone) &&
                    !isVerified && (
                      <p className="text-xs mt-1 text-[var(--color-danger)]">
                        Invalid phone number
                      </p>
                    )}
                </div>
                {/* PASSWORD */}
                <InputWithIcon
                  icon={Lock}
                  placeholder="Password (8+ chars)"
                  type="password"
                  value={parent.password}
                  onChange={(e) => updateParent("password", e.target.value)}
                  disabled={isVerified}
                  showToggle
                  show={showPassword}
                  toggleShow={() => setShowPassword(!showPassword)}
                />
                {/* CONFIRM PASSWORD */}
                <InputWithIcon
                  icon={Lock}
                  placeholder="Confirm Password"
                  type="password"
                  value={parent.confirmPassword}
                  onChange={(e) =>
                    updateParent("confirmPassword", e.target.value)
                  }
                  disabled={isVerified}
                  showToggle
                  show={showConfirm}
                  toggleShow={() => setShowConfirm(!showConfirm)}
                />
                <button
                  onClick={sendOtp}
                  disabled={!parentValid || loading || isVerified}
                  className="btn-primary w-full mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 2 – OTP */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-primary text-center">
                  Enter 6-Digit OTP
                </h2>
                <p className="text-center text-muted">
                  Sent to <strong>{parent.email}</strong>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="form-input text-center text-3xl font-semibold tracking-[0.4em] py-4" inputMode="numeric" autoComplete="one-time-code"
                  placeholder="000000"
                />

                {/* Resend OTP with Timer */}
                <div className="text-center mt-4">
                  <button
                    onClick={resendOtp}
                    disabled={!canResend || loading || !parent.email}
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-all ${
                      canResend
                        ? "text-muted underline hover:text-primary"
                        : "text-subtle cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resending...
                      </>
                    ) : canResend ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend OTP
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Resend in {resendTimer}s
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isVerified}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!otpValid}
                    className="btn-primary flex-1"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 – Children */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-primary">
                    Add Children
                    {isVerified && (
                      <Lock className="inline w-4 h-4 ml-1 text-subtle" />
                    )}
                  </h2>
                  {!isVerified && (
                    <button
                      onClick={addChild}
                      className="btn-accent"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  )}
                </div>
                {children.map((child, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl ${
                      isVerified ? "bg-surface-alt" : "bg-surface"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-primary">
                        Child {i + 1}
                      </h3>
                      {!isVerified && children.length > 1 && (
                        <button
                          onClick={() => removeChild(i)}
                          className="text-[var(--color-danger)]"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputWithIcon
                        icon={User}
                        placeholder="First Name"
                        value={child.firstName}
                        onChange={(e) =>
                          updateChild(i, "firstName", e.target.value)
                        }
                        disabled={isVerified}
                      />
                      <InputWithIcon
                        icon={User}
                        placeholder="Last Name"
                        value={child.lastName}
                        onChange={(e) =>
                          updateChild(i, "lastName", e.target.value)
                        }
                        disabled={isVerified}
                      />
                    </div>
                    <InputWithIcon
                      icon={Mail}
                      placeholder="Email"
                      type="email"
                      value={child.email}
                      onChange={(e) => updateChild(i, "email", e.target.value)}
                      disabled={isVerified}
                      className="mt-3"
                    />
                    {/* CHILD PHONE */}
                    <div className="mt-3">
                      <label className="form-label">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10">
                          <Phone className="w-5 h-5" />
                        </div>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="NG"
                          value={child.phone}
                          onChange={(v) => updateChild(i, "phone", v || "")}
                          disabled={isVerified}
                          placeholder="Enter phone number"
                          className={`phone-input ${
                            isVerified ? "disabled" : ""
                          }`}
                          style={{ paddingLeft: "3rem" }}
                        />
                      </div>
                      {child.phone &&
                        !isValidPhoneNumber(child.phone) &&
                        !isVerified && (
                          <p className="text-xs mt-1 text-[var(--color-danger)]">
                            Invalid phone number
                          </p>
                        )}
                    </div>
             
                  </motion.div>
                ))}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isVerified}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyOtpAndRegister}
                    disabled={!childrenValid || loading || isVerified}
                    className="btn-primary flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Complete <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 – Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-[var(--color-success)] mx-auto mb-4" />
                <h2 className="text-2xl font-semibold tracking-tight text-primary mb-2">
                  Registration Complete!
                </h2>
                <p className="text-muted mb-6">
                  Login details have been emailed to you.
                </p>
                <a
                  href="/sign-in"
                  className="btn-primary"
                >
                  Go to Login <ArrowRight className="w-5 h-5" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
    </AuthShell>
  );
};

export default GetStarted;
