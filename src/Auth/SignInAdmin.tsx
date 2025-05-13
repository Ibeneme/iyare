import React, { useState } from "react";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/books.jpg";
import { useNavigate } from "react-router-dom";

const SignInAdmin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"admin" | "teacher">("admin");
  const navigate = useNavigate();
  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { userType } });
  };

  return (
    <div
      className="signin-page"
      style={{
        background: `url(${backgroundImage})`,
        backgroundSize: "100%",
        backgroundPosition: "cover",
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

        <h2 className="signin-title">Admin Portal</h2>

        {/* User type toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setUserType("admin")}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: userType === "admin" ? "#023009" : "white",
              color: userType === "admin" ? "white" : "#023009",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setUserType("teacher")}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: userType === "teacher" ? "#023009" : "white",
              color: userType === "teacher" ? "white" : "#023009",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Teacher
          </button>
        </div>

        <form className="signin-form">
          <div className="form-group">
            <label htmlFor="email">
              {userType === "admin" ? "Admin Email" : "Teacher Email"}
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                backgroundColor: "white",
                border: "none",
                color: "gray",
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="signin-button">
            Sign In
          </button>

          <div className="go-back-link">
            <a href="/">← Go Back</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInAdmin;
