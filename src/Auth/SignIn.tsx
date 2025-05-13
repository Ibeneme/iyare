import React, { useState } from "react";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/library.jpg";
import { useNavigate } from "react-router-dom";

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"student" | "parent">("student");
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
        backgroundPosition: "contain",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        objectFit: "contain",
      }}
    >
      <div className="signin-container">
        <div className="logo-wrapper">
          <img src={logo} alt="Oyare Learning Hub" className="signin-logo" />
        </div>

        <h2 className="signin-title">Sign In</h2>

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
            onClick={() => setUserType("student")}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: userType === "student" ? "#023009" : "white",
              color: userType === "student" ? "white" : "#023009",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setUserType("parent")}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: userType === "parent" ? "#023009" : "white",
              color: userType === "parent" ? "white" : "#023009",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Parent
          </button>
        </div>

        <form className="signin-form">
          {/* Student fields */}
          {userType === "student" && (
            <>
              <div className="form-group">
                <label htmlFor="student-id">Student ID</label>
                <input
                  type="text"
                  id="student-id"
                  placeholder="Enter your student ID"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-password">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="student-password"
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
            </>
          )}

          {/* Parent fields */}
          {userType === "parent" && (
            <>
              <div className="form-group">
                <label htmlFor="parent-email">Email Address</label>
                <input
                  type="email"
                  id="parent-email"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="parent-password">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="parent-password"
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
            </>
          )}

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

export default SignIn;
