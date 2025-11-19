// src/pages/SignInAdmin/SignInAdmin.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Users,
  Loader2,
} from "lucide-react";
import { signInUser } from "../Redux/Admin/adminUsers";
import { AppDispatch } from "../Redux/store";

const SignInAdmin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const [userType, setUserType] = useState<"admin" | "teacher">("admin");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    if (type === "teacher") setUserType("teacher");
    else setUserType("admin");
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const loginData = { userType, email, password };

    try {
      const result = await dispatch(signInUser(loginData)).unwrap();
      setSuccess(true);
      localStorage.setItem("user", JSON.stringify(result.data));
      localStorage.setItem("userType", userType);
      localStorage.setItem("token", result.token);

      setTimeout(() => navigate("/subject-manager"), 800);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { userType } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-12 h-12 text-[#023009]" />
            </div>
            <h1 className="text-3xl font-black text-[#023009]">
              Admin & Teacher
            </h1>
            <p className="text-[#023009]/70 mt-1">Sign in to manage Yare</p>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 p-1 bg-[#023009]/5 rounded-full mb-6">
            {[
              {
                type: "admin" as const,
                label: "Admin",
                icon: <Shield className="w-4 h-4" />,
              },
              {
                type: "teacher" as const,
                label: "Teacher",
                icon: <Users className="w-4 h-4" />,
              },
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => setUserType(type)}
                className={`flex-1 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  userType === type
                    ? "bg-[#023009] text-white shadow-lg"
                    : "text-[#023009]/70 hover:text-[#023009]"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#023009] mb-1">
                {userType === "admin" ? "Admin Email" : "Teacher Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-[#023009]/50" />
                <input
                  type="email"
                  placeholder={`e.g. ${userType}@yare.ng`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#023009] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-[#023009]/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38%] -translate-y-[38%] text-[#023009]/50 hover:text-[#023009]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#023009]/70 hover:text-[#023009] font-medium underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#023009] text-white py-4 rounded-xl font-black text-lg hover:bg-[#023009]/90 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm text-center font-medium"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-600 text-sm text-center font-medium"
                >
                  Welcome back! Redirecting...
                </motion.p>
              )}
            </AnimatePresence>

            <div className="text-center mt-6">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-[#023009]/70 hover:text-[#023009] text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </a>
            </div>
          </form>
        </div>

        <p className="text-center mt-6 text-[#023009]/60 text-xs font-mono tracking-widest">
          <strong className="text-[#023009]">Admin Access Only</strong>
        </p>
      </motion.div>
    </div>
  );
};

export default SignInAdmin;
