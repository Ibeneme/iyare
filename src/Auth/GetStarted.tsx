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
import { BASE_URL } from "../Redux/baseurl";

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
    <div className="absolute left-3 top-[38%] -translate-y-[38%] text-[#023009]/60 pointer-events-none">
      <Icon className="w-5 h-5" />
    </div>
    <input
      type={showToggle && show ? "text" : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
        disabled
          ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
          : "border-[#ffd000]/50 focus:border-[#023009]"
      } ${showToggle ? "pr-12" : ""} ${className}`}
    />
    {showToggle && (
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-[28%] -translate-y-[28%] text-[#023009]/60"
        disabled={disabled}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
              {isVerified ? (
                <Lock className="w-12 h-12 text-[#023009]" />
              ) : (
                <Users className="w-12 h-12 text-[#023009]" />
              )}
            </div>
            <h1 className="text-3xl font-black text-[#023009]">
              {isVerified ? "Account Locked" : "Get Started"}
            </h1>
            <p className="text-[#023009]/70 mt-1">
              {isVerified
                ? "Your data is secure and cannot be changed."
                : "Secure 2-step registration"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-10 h-2 rounded-full transition-all ${
                  step >= s ? "bg-[#023009]" : "bg-[#023009]/20"
                }`}
              />
            ))}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-center font-medium ${
                message.includes("success") || message.includes("complete")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
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
                <h2 className="text-xl font-bold text-[#023009] flex items-center gap-2">
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
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#023009]/60 z-10">
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
                      <p className="text-red-600 text-xs mt-1">
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
                  className="w-full mt-6 bg-[#023009] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#023009]/90 disabled:opacity-50"
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
                <h2 className="text-xl font-bold text-[#023009] text-center">
                  Enter 6-Digit OTP
                </h2>
                <p className="text-center text-[#023009]/70">
                  Sent to <strong>{parent.email}</strong>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none"
                  placeholder="000000"
                />

                {/* Resend OTP with Timer */}
                <div className="text-center mt-4">
                  <button
                    onClick={resendOtp}
                    disabled={!canResend || loading || !parent.email}
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-all ${
                      canResend
                        ? "text-[#023009]/70 underline hover:text-[#023009]"
                        : "text-[#023009]/40 cursor-not-allowed"
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
                    className="flex-1 py-3 bg-gray-200 text-[#023009] rounded-xl font-bold disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!otpValid}
                    className="flex-1 py-3 bg-[#023009] text-white rounded-xl font-bold disabled:opacity-50"
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
                  <h2 className="text-xl font-bold text-[#023009]">
                    Add Children
                    {isVerified && (
                      <Lock className="inline w-4 h-4 ml-1 text-gray-500" />
                    )}
                  </h2>
                  {!isVerified && (
                    <button
                      onClick={addChild}
                      className="flex items-center gap-2 px-4 py-2 bg-[#ffd000] text-[#023009] rounded-xl font-bold"
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
                    className={`p-5 rounded-2xl border-2 ${
                      isVerified
                        ? "bg-gray-50 border-gray-300"
                        : "bg-[#f5fdf5] border-[#ffd000]/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-[#023009]">
                        Child {i + 1}
                      </h3>
                      {!isVerified && children.length > 1 && (
                        <button
                          onClick={() => removeChild(i)}
                          className="text-red-600"
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
                      <label className="block text-sm font-bold text-[#023009] mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#023009]/60 z-10">
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
                          <p className="text-red-600 text-xs mt-1">
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
                    className="flex-1 py-3 bg-gray-200 text-[#023009] rounded-xl font-bold disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyOtpAndRegister}
                    disabled={!childrenValid || loading || isVerified}
                    className="flex-1 py-3 bg-[#023009] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#023009] mb-2">
                  Registration Complete!
                </h2>
                <p className="text-[#023009]/70 mb-6">
                  Login details have been emailed to you.
                </p>
                <a
                  href="/auth-sign-in"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#023009] text-white rounded-xl font-bold hover:bg-[#023009]/90"
                >
                  Go to Login <ArrowRight className="w-5 h-5" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-[#023009]/60 text-xs font-mono">
          Secured with <strong>End-to-End Encryption</strong> •{" "}
          {new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
        </p>
      </motion.div>
    </div>
  );
};

export default GetStarted;
