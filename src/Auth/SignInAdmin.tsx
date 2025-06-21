import React, { useEffect, useState } from "react";
import "./SignIn.css";
import logo from "../assets/images/logo.jpg";
import backgroundImage from "../assets/images/books.jpg";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../Redux/Admin/Auth";
import { AppDispatch, RootState } from "../Redux/store";

const SignInAdmin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const [userType, setUserType] = useState<"admin" | "teacher">("admin");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    if (type === "teacher") {
      setUserType("teacher");
    } else {
      setUserType("admin");
    }
  }, [location.search]);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.adminAuth);

  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { userType } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (userType !== "admin") {
      //setError("Only admin login is implemented.");
      return;
    }

    dispatch(loginAdmin({ email, password }))
      .then((resultAction) => {
        console.log("Raw resultAction:", resultAction);

        if (loginAdmin.fulfilled.match(resultAction)) {
          const { token, email, role, _id } = resultAction.payload;
          console.log("Login successful:", resultAction.payload);

          // ✅ Store token in localStorage
          localStorage.setItem("yareadmintoken", token);

          // Optionally store other data too
          localStorage.setItem("yareadminemail", email);
          localStorage.setItem("yareadminrole", role);
          localStorage.setItem("yareadminid", _id);
          navigate("/admin/dashboard/all");
        } else if (loginAdmin.rejected.match(resultAction)) {
          console.error(
            "Login failed:",
            resultAction.payload || resultAction.error
          );
          //setError("Login failed. Please check your credentials.");
        }
      })
      .catch((error) => {
        console.error("Unexpected error during login:", error);
        //setError("Something went wrong. Please try again later.");
      });
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

        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              {userType === "admin" ? "Admin Email" : "Teacher Email"}
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <div className="forgot-password">
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                backgroundColor: "white",
                border: "none",
                color: "gray",
                fontSize: 13,
              }}
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <p
              style={{
                backgroundColor: "#ff000021",
                color: "#ff0000",
                padding: 12,
                marginBottom: 24,
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
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
