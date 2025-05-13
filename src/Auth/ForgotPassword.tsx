import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/library.jpg";
import backgroundImages from "../assets/images/books.jpg";

const ForgotPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userType = location.state?.userType ?? "student";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid) {
      setError("Please enter a valid email address.");
      return;
    }

    // Send OTP logic here
    setError("");
    setStep(2);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your email.");
      return;
    }

    // Validate OTP logic here
    setError("");
    setStep(3);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Reset password logic here
    setError("");

    // Redirect based on userType
    if (userType === "admin" || userType === "teacher") {
      navigate("/admin-signin");
    } else {
      navigate("/auth-signin");
    }
  };

  const handleGoBack = () => {
    if (step === 3) {
      setStep(2); // Go back to Step 2 if in Step 3
    } else if (step === 2) {
      setStep(1); // Go back to Step 1 if in Step 2
    } else {
      if (location.state?.from) {
        navigate(location.state.from); // Return to the previous page if `from` is set
      } else {
        navigate(-1); // Otherwise, go back to the previous history state
      }
    }
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
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        objectFit: "cover",
      }}
    >
      <div className="signin-container">
        <div className="logo-wrapper">
          <img src={logo} alt="Oyare Learning Hub" className="signin-logo" />
        </div>

        <h2 className="signin-title" style={{ zIndex: 12 }}>
          Forgot Password
        </h2>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

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
            <button type="submit" className="signin-button">
              Send OTP
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
            <button type="submit" className="signin-button">
              Verify OTP
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

            <button type="submit" className="signin-button">
              Reset Password
            </button>
          </form>
        )}

        <div className="go-back-link">
          <button
            onClick={handleGoBack}
            style={{
              backgroundColor: "white",
              border: "none",
              color: "gray",
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
