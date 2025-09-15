import React, { useEffect, useState } from "react";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/library.jpg";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import { signInUser } from "../Redux/Admin/adminUsers";

const SignIn: React.FC = () => {
  // Local state for form inputs
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  // Local state for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redux and React Router hooks
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    if (type === "parent") {
      setUserType("parent");
    } else {
      setUserType("student");
    }
  }, [location.search]);

  const [userType, setUserType] = useState<"student" | "parent">("student");

  // useEffect is no longer needed to watch Redux state for navigation

  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { userType } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    let loginData;
    if (userType === "student") {
      loginData = {
        userType: "student",
        email: studentId, // Using studentId as email for the API call
        password,
      };
    } else {
      loginData = {
        userType: "parent",
        email,
        password,
      };
    }

    try {
      const resultAction = await dispatch(signInUser(loginData));
      const payload = resultAction.payload as any; // Cast to 'any' for direct property access

      if (payload.success) {
        setSuccessMessage(payload.message);
        // Store user data and navigate on success

        console.log(payload);
        localStorage.setItem("user", JSON.stringify(payload.data));
        localStorage.setItem("userType", userType);
        localStorage.setItem("token", payload.token);
        setTimeout(() => {
          navigate(`/classes/dashboard/all`);
        }, 100);
      } else {
        setError(payload.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
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

        <form className="signin-form" onSubmit={handleSubmit}>
          {/* Student fields */}
          {userType === "student" && (
            <>
              <div className="form-group">
                <label htmlFor="student-id">Email Address</label>
                <input
                  type="text"
                  id="student-id"
                  placeholder="Enter your Email Address"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
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

          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {(error || successMessage) && (
            <div
              style={{
                marginTop: "10px",
                color: error ? "red" : "green",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {error || successMessage}
            </div>
          )}

          <div className="go-back-link">
            <a href="/">← Go Back</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
