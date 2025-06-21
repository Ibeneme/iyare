import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/library.jpg";
import backgroundImages from "../assets/images/books.jpg";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
} from "../Redux/Admin/Auth";
import { AppDispatch, RootState } from "../Redux/store";

const ForgotPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { error: reduxError } = useSelector(
    (state: RootState) => state.adminAuth
  );

  const userType = location.state?.userType ?? "student";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localSuccessMessage, setLocalSuccessMessage] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid) return setError("Please enter a valid email address.");
    setError("");
    setLocalSuccessMessage("");
    setLoading(true);

    try {
      if (userType === "admin") {
        const response = await dispatch<any>(forgotPassword({ email }));
        console.log("Forgot Password Response:", response);

        if (
          response.type === "admin/forgotPassword/fulfilled" &&
          response.payload === "OTP sent to email."
        ) {
          setLocalSuccessMessage("OTP sent to email.");
          setStep(2);
        } else {
          console.error("Failed to send OTP:", response);
          setError("Failed to send OTP.");
        }
      }
    } catch (err) {
      console.error("Forgot Password Error:", err);
      setError("An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("OTP Submitted:", otp);

    if (otp.length !== 6) {
      console.log("Invalid OTP length");
      return setError("Enter the 6-digit OTP sent to your email.");
    }

    setError("");
    setLocalSuccessMessage("");
    setLoading(true);

    try {
      if (userType === "admin") {
        console.log("Dispatching verifyOtp with:", { email, otp });

        const result = await dispatch<any>(verifyOtp({ email, otp }));
        console.log("verifyOtp result:", result);

        // Ensure the OTP verification succeeded
        if (
          result.type === "admin/verifyOtp/fulfilled" &&
          typeof result.payload === "string"
        ) {
          const token = result.payload;
          console.log("OTP verification successful, token:", token);

          // Store the token in localStorage
          localStorage.setItem("prToken", token);

          // Move to step 3 (reset password)
          setStep(3);
          return;
        } else {
          console.log("OTP verification failed or response invalid");
          setError("OTP verification failed.");
          return;
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("An error occurred during OTP verification.");
    } finally {
      setLoading(false);
      console.log("OTP submission loading complete");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setError("");
    setLocalSuccessMessage("");
    setLoading(true);

    try {
      if (userType === "admin") {
        const prToken = localStorage.getItem("prToken");

        if (!prToken) {
          setError("Session expired. Please verify OTP again.");
          return;
        }

        const result = await dispatch<any>(
          resetPassword({
            email,
            password,
            resetToken: prToken,
          })
        );

        console.log("Reset password result:", result);

        if (result.meta.requestStatus === "fulfilled") {
          // ✅ Success: clear token and navigate
          localStorage.removeItem("prToken");

          navigate(
            userType === "admin" || userType === "teacher"
              ? `/admin-sign-in?type=${userType}`
              : `/auth-sign-in?type=${userType}`
          );
        } else {
          // ❌ Rejected
          setError(result.payload || "Password reset failed.");
        }
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An error occurred while resetting the password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setError("");
    setLocalSuccessMessage("");

    if (step === 3) return setStep(2);
    if (step === 2) return setStep(1);
    navigate(location.state?.from || -1);
  };

  return (
    <div
      className="signin-page"
      style={{
        background: `url(${
          userType === "student" ? backgroundImage : backgroundImages
        })`,
        backgroundSize: "100%",
        backgroundPosition: "cover",
        // backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // objectFit: "contain",
      }}
    >
      <div className="signin-container">
        <div className="logo-wrapper">
          <img src={logo} alt="Oyare Learning Hub" className="signin-logo" />
        </div>

        <h2 className="signin-title">Forgot Password</h2>
        {(error || reduxError) && (
          <p
            className="error-message"
            style={{
              backgroundColor: "#ff000021",
              color: "#ff0000",
              padding: 12,
              marginBottom: 24,
            }}
          >
            {error || reduxError}
          </p>
        )}
        {localSuccessMessage && (
          <p
            className="success-message"
            style={{
              backgroundColor: "#DEFFCF",
              color: "#1A4806",
              padding: 12,
              marginBottom: 24,
            }}
          >
            {localSuccessMessage}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="email">Enter your email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="otp">
                Enter the 6-digit OTP sent to your email
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                required
              />
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="resend-otp-button"
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  const result = await dispatch<any>(resendOtp({ email }));
                  if (result.meta.requestStatus === "rejected") {
                    setError(result.payload || "Failed to resend OTP.");
                  } else {
                    setLocalSuccessMessage("OTP resent successfully.");
                  }
                } catch (err) {
                  setError("An unexpected error occurred.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                marginTop: "1rem",
                backgroundColor: "#eee",
                color: "#333",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {loading ? "Resending..." : "Resend OTP"}
            </button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="signin-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <button
          onClick={handleGoBack}
          disabled={loading}
          style={{
            backgroundColor: "white",
            border: "none",
            color: "gray",
            marginTop: "1rem",
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
