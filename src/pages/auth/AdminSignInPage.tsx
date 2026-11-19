import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { signInUser } from "../../store/features/users/users.slice";
import { AppDispatch } from "../../store/index";
import AuthShell, { AuthNotice } from "./AuthShell";
import { PATHS } from "../../routes/paths";
import { setAuthCookies } from "../../utils/cookies";

const SignInAdmin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userType, setUserType] = useState<"admin" | "teacher">("admin");

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const type = new URLSearchParams(location.search).get("type");
    setUserType(type === "teacher" ? "teacher" : "admin");
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await dispatch(signInUser({ userType, email, password })).unwrap();
      setSuccess(true);
      setAuthCookies({ token: result.token, user: result.data, userType });
      setTimeout(() => navigate("/app/subjects"), 800);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Staff portal"
      subtitle="Sign in with your staff credentials"
      badge={
        <span className="badge-gray">
          <Shield className="w-3.5 h-3.5" /> Signing in as {userType === "admin" ? "Administrator" : "Teacher"}
        </span>
      }
      footer={
        <p className="text-center text-sm text-muted mt-5">
          Student or parent?{" "}
          <Link to={PATHS.signIn} className="font-semibold text-primary hover:underline">
            Go to the learner sign in
          </Link>
        </p>
      }
    >
      <div role="tablist" aria-label="Account type" className="flex gap-1 p-1 bg-surface rounded-full mb-6">
        {(["admin", "teacher"] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={userType === type}
            onClick={() => setUserType(type)}
            className={`flex-1 py-2 px-4 rounded-full font-medium text-sm transition-all ${
              userType === type ? "bg-card text-primary shadow-card" : "text-muted hover:text-primary"
            }`}
          >
            {type === "admin" ? "Admin" : "Teacher"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="staff-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            <input id="staff-email" type="email" autoComplete="email" placeholder="you@yare.ng" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input pl-10" />
          </div>
        </div>

        <div>
          <label htmlFor="staff-password" className="form-label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            <input id="staff-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input pl-10 pr-11" />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button type="button" onClick={() => navigate("/forgot-password", { state: { userType } })} className="text-sm text-muted hover:text-primary font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading || success} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : success ? "✓ Redirecting…" : "Sign in"}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthNotice tone="error">{error}</AuthNotice>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </AuthShell>
  );
};

export default SignInAdmin;
