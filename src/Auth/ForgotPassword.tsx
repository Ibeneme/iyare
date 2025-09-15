import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SignIn.css"; // Assuming this CSS file contains necessary styles
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/library.jpg"; // For student
import { useDispatch } from "react-redux";
import {
  forgotPassword,
  verifyForgotPassword,
  resetPassword,
  resendOtp,
} from "../Redux/Admin/adminUsers"; // Ensure this path is correct
import { AppDispatch } from "../Redux/store";

const ForgotPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // State to manage the user type selected from the dropdown
  const [userType, setUserType] = useState(
    location.state?.userType ?? "student"
  );

  // Component state for managing the flow and UI feedback
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null); // To store the token for password reset
  const [showNewPassword, setShowNewPassword] = useState(false); // State for new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  // Effect to clear messages when step changes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail) {
      return setError("Please enter a valid email address.");
    }

    setLoading(true);
    try {
      const resultAction = await dispatch(forgotPassword({ userType, email }));
      const payload = resultAction.payload as any;

      if (payload.success) {
        setSuccessMessage(payload.message || "OTP sent to your email.");
        setStep(2);
      } else {
        setError(payload.message || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (otp.length !== 6) {
      return setError("Please enter the 6-digit OTP sent to your email.");
    }

    setLoading(true);
    try {
      const resultAction = await dispatch(verifyForgotPassword({ email, otp }));
      const payload = resultAction.payload as any;

      console.log(payload, "payload");
      if (payload.success && payload.resetToken) {
        setSuccessMessage(payload.message || "OTP verified successfully.");
        setResetToken(payload.resetToken);
        setStep(3);
      } else {
        setError(
          payload.message || "OTP verification failed. Please try again."
        );
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred during OTP verification."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    if (!resetToken) {
      return setError(
        "Session expired. Please restart the password reset process."
      );
    }

    setLoading(true);
    try {
      const resultAction = await dispatch(
        resetPassword({ userType, email, password, token: resetToken })
      );
      const payload = resultAction.payload as any;

      if (payload.success) {
        setSuccessMessage(payload.message || "Password reset successfully!");
        setResetToken(null);
        setTimeout(() => {
          navigate(
            userType === "admin" || userType === "teacher"
              ? `/admin-sign-in?type=${userType}`
              : `/auth-sign-in?type=${userType}`
          );
        }, 1500);
      } else {
        setError(payload.message || "Password reset failed. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred during password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const resultAction = await dispatch(resendOtp({ userType, email }));
      const payload = resultAction.payload as any;

      if (payload.success) {
        setSuccessMessage(payload.message || "OTP resent successfully!");
      } else {
        setError(payload.message || "Failed to resend OTP.");
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred while resending OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setError(null);
    setSuccessMessage(null);

    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      navigate(location.state?.from || -1);
    }
  };

  return (
    <div
      className="signin-page"
      style={{
        background: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="signin-container">
        <div className="logo-wrapper">
          <img src={logo} alt="Oyare Learning Hub" className="signin-logo" />
        </div>

        <h2 className="signin-title">Forgot Password</h2>

        {error && (
          <p
            className="error-message"
            style={{
              backgroundColor: "#ff000021",
              color: "#ff0000",
              padding: 12,
              marginBottom: 24,
              borderRadius: "8px",
            }}
          >
            {error}
          </p>
        )}
        {successMessage && (
          <p
            className="success-message"
            style={{
              backgroundColor: "#DEFFCF",
              color: "#1A4806",
              padding: 12,
              marginBottom: 24,
              borderRadius: "8px",
            }}
          >
            {successMessage}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="user-type">Account Type</label>
              <select
                id="user-type"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="email">Enter your email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
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
                disabled={loading}
              />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
            <button
              type="button"
              className="resend-otp-button"
              onClick={handleResendOtp}
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
                type={showNewPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: 8,
                    fontSize: 12,
                  }}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: 8,
                    fontSize: 12,
                  }}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
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
            cursor: "pointer",
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
