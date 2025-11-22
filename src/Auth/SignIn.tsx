// src/pages/SignIn/SignIn.tsx
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
  BookOpen,
  Users,
  Loader2,
} from "lucide-react";
import { AppDispatch } from "../Redux/store";
import { signInUser } from "../Redux/Admin/adminUsers";

const SignIn: React.FC = () => {
  useEffect(() => {
    localStorage.clear();
    console.log("All localStorage items cleared on component mount");
  }, []); // Empty dependency array ensures it runs only once

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const [userType, setUserType] = useState<"student" | "parent">("student");

  // ───── Current Time & Country ─────
  // const currentTime = new Date().toLocaleString("en-NG", {
  //   timeZone: "Africa/Lagos",
  //   year: "numeric",
  //   month: "long",
  //   day: "numeric",
  //   hour: "2-digit",
  //   minute: "2-digit",
  //   hour12: true,
  //   timeZoneName: "short",
  // });

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    if (type === "parent") setUserType("parent");
    else setUserType("student");
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const loginData =
      userType === "student"
        ? { userType: "student", email: studentId, password }
        : { userType: "parent", email, password };

    try {
      const result = await dispatch(signInUser(loginData)).unwrap();
      const user = result.data;
      const token = result.token;

      localStorage.setItem("userEmail", result.data?.email || "");
      localStorage.setItem("userId", result.data?._id || "");

      // ───── CASE 1: No subjects/children → go to setup ─────
      if (
        (userType === "student" &&
          (!user?.subjects || user?.subjects.length === 0)) ||
        (userType === "parent" &&
          (!user?.children || user?.children.length === 0))
      ) {
        navigate("/user-setup", {
          state: { user, token, userType },
        });
        return;
      }

      // Subscription checker
      const isUserSubscribed = (user: any, userType: string): boolean => {
        if (user?.isSubscribed) return true;

        if (userType === "parent" && user?.children?.length) {
          return user.children.some((child: any) => child?.isSubscribed);
        }

        return false;
      };

      const subscribed = isUserSubscribed(user, userType);

      // ───── CASE 2: Not subscribed → go to pricing ─────
      if (!subscribed) {
        const studentDetails =
          userType === "parent" && user?.children?.length
            ? user.children.map((child: any) => ({
                _id: child._id,
                firstName: child.firstName,
                lastName: child.lastName,
                class: child.class || "",
                subjects: child.subjects || [],
              }))
            : [
                {
                  _id: user?._id,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  class: user?.class || "",
                  subjects: user?.subjects || [],
                },
              ];

        navigate("/pricing-page", {
          state: {
            parentId: user?.parentId || null,
            studentDetails,
          },
        });
        return;
      }

      // ───── CASE 3: Fully set up → dashboard ─────
      localStorage.setItem("user", JSON.stringify(result.data));
      localStorage.setItem("token", result.token);
      localStorage.setItem("loginTimeReadable", new Date().toISOString());
      localStorage.setItem("userType", userType);
      navigate("/subject-manager");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
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
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-12 h-12 text-[#023009]" />
            </div>
            <h1 className="text-3xl font-black text-[#023009]">Welcome Back</h1>
            <p className="text-[#023009]/70 mt-1">
              Sign in to continue learning
            </p>
          </div>

          <div className="flex gap-2 p-1 bg-[#023009]/5 rounded-full mb-6">
            {[
              {
                type: "student" as const,
                label: "Student",
                icon: <Users className="w-4 h-4" />,
              },
              {
                type: "parent" as const,
                label: "Parent",
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {userType === "student" ? (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Student Email / ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-[#023009]/50" />
                    <input
                      type="text"
                      placeholder="e.g. john.doe@yare.ng"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="parent"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-bold text-[#023009] mb-1">
                    Parent Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-[38%] -translate-y-[38%] w-5 h-5 text-[#023009]/50" />
                    <input
                      type="email"
                      placeholder="e.g. parent@yare.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
      </motion.div>
    </div>
  );
};

export default SignIn;
