import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AppDispatch } from "../../store/index";
import { signInUser } from "../../store/features/users/users.slice";
import AuthShell from "./AuthShell";
import { PATHS } from "../../routes/paths";
import {
  setAuthCookies,
  clearAuthCookies,
  setCookie,
} from "../../utils/cookies";

const getAuthErrorMessage = (err: unknown): string => {
  if (!err) return "Invalid credentials. Please try again.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const record = err as Record<string, any>;
    return (
      record.message || record.error || "Invalid credentials. Please try again."
    );
  }
  return "Invalid credentials. Please try again.";
};

const SignIn: React.FC = () => {
  useEffect(() => {
    clearAuthCookies();
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"student" | "parent">("student");

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const type = new URLSearchParams(location.search).get("type");
    setUserType(type === "parent" ? "parent" : "student");
  }, [location.search]);

  // Observe/log login errors whenever `error` changes
  useEffect(() => {
    if (!error) return;
    console.warn("[AuthObserver] Sign-in error:", {
      userType,
      identifier: userType === "student" ? studentId.trim() : email.trim(),
      error,
      timestamp: new Date().toISOString(),
    });
  }, [error, userType, studentId, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

      setCookie("userEmail", user?.email || "");
      setCookie("userId", user?._id || "");
      setAuthCookies({ token, user, userType });

      if (userType === "student") {
        navigate("/app/subjects");
        return;
      }

      if (
        userType === "parent" &&
        (!user?.children || user.children.length === 0)
      ) {
        navigate("/account-setup", { state: { user, token, userType } });
        return;
      }

      const isUserSubscribed = (u: any, t: string): boolean => {
        if (u?.isSubscribed) return true;
        if (t === "parent" && u?.children?.length)
          return u.children.some((c: any) => c?.isSubscribed);
        return false;
      };

      if (!isUserSubscribed(user, userType)) {
        const studentDetails =
          userType === "parent" && user?.children?.length
            ? user.children.map((c: any) => ({
                _id: c._id,
                firstName: c.firstName,
                lastName: c.lastName,
                class: c.class || "",
                subjects: c.subjects || [],
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
        navigate("/plans", {
          state: { parentId: user?.parentId || null, studentDetails },
        });
        return;
      }

      navigate("/app/subjects");
    } catch (err: any) {
      const message = getAuthErrorMessage(err);
      console.error("[SignIn] Rejected payload:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const typeParam = new URLSearchParams(location.search).get("type");
  // Teachers and admins use their own portal
  if (typeParam === "teacher" || typeParam === "admin") {
    return <Navigate to={`${PATHS.adminSignIn}?type=${typeParam}`} replace />;
  }

  const otherType = userType === "student" ? "parent" : "student";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue learning"
      badge={
        <span className="badge-gray">
          <Users className="w-3.5 h-3.5" /> Signing in as{" "}
          {userType === "parent" ? "Parent" : "Student"}
        </span>
      }
      footer={
        <p className="text-center text-sm text-muted mt-5">
          Not a {userType}?{" "}
          <button
            type="button"
            onClick={() => setUserType(otherType)}
            className="font-semibold text-primary hover:underline"
          >
            Sign in as {otherType}
          </button>
          {" · "}
          <Link
            to={PATHS.adminSignIn}
            className="font-semibold text-primary hover:underline"
          >
            Staff portal
          </Link>
        </p>
      }
    >
      <div
        role="tablist"
        aria-label="Account type"
        className="flex gap-1 p-1 bg-surface rounded-full mb-6"
      >
        {(["student", "parent"] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={userType === type}
            onClick={() => setUserType(type)}
            className={`flex-1 py-2 px-4 rounded-full font-medium text-sm transition-all capitalize ${
              userType === type
                ? "bg-card text-primary shadow-card"
                : "text-muted hover:text-primary"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {userType === "student" ? (
            <motion.div
              key="student"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <label htmlFor="signin-id" className="form-label">
                Student email / ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input
                  id="signin-id"
                  type="text"
                  autoComplete="username"
                  placeholder="john.doe@yare.ng"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="form-input pl-10"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="parent"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <label htmlFor="signin-email" className="form-label">
                Parent email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="parent@yare.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input pl-10"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label htmlFor="signin-password" className="form-label">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            <input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input pl-10 pr-11"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() =>
              navigate("/forgot-password", { state: { userType } })
            }
            className="text-sm text-muted hover:text-primary font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-600/15 border border-red-500 text-red-500 text-sm font-semibold shadow-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </AuthShell>
  );
};

export default SignIn;