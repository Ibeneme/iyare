// src/Components/ProtectedRoute.jsx

import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { verifyAuthToken } from "./Redux/Admin/Auth";

const ProtectedRoute = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation(); // Tracks path changes on SPA navigation

  // Retrieve token and stored user type from localStorage
  const token =
    localStorage.getItem("token") || localStorage.getItem("yareadmintoken");
  const storedUserType = localStorage.getItem("userType");

  useEffect(() => {
    const checkToken = async () => {
      // Force verification state on every route switch
      setIsVerifying(true);

      if (!token) {
        setIsVerifying(false);
        setIsValid(false);
        return;
      }

      try {
        // Dispatches the backend verifyAuthToken thunk on every page navigation
        const resultAction = await dispatch(verifyAuthToken());

        if (verifyAuthToken.fulfilled.match(resultAction)) {
          const backendUser =
            resultAction.payload?.user || resultAction.payload;
          const tokenUserType =
            backendUser?.userType || resultAction.payload?.userType;

          // Check if local storage userType matches backend token userType
          if (
            storedUserType &&
            tokenUserType &&
            tokenUserType.toLowerCase() !== storedUserType.toLowerCase()
          ) {
            console.warn(
              "Security Alert: UserType mismatch between token and storage!"
            );
            localStorage.clear();
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } else {
          // Token is expired, invalid, or rejected by backend middleware
          localStorage.clear();
          setIsValid(false);
        }
      } catch (err) {
        localStorage.clear();
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [dispatch, location.pathname, token, storedUserType]); // <--- Triggers on every route change!

  // Show a clean loading/verifying screen while waiting for the server response
  if (isVerifying) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Verifying session...</p>
      </div>
    );
  }

  // If token is missing, expired, or userType didn't match, redirect to sign-in
  if (!token || !isValid) {
    return <Navigate to="/auth-sign-in" replace />;
  }

  // Render the protected routes if everything checks out
  return <Outlet />;
};

export default ProtectedRoute;
