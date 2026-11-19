import { signInPathFor } from "../config/roles";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { verifyAuthToken } from "../store/features/auth/auth.slice";
import { AppDispatch } from "../store/index";
import { getCookie, clearAuthCookies } from "../utils/cookies";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const token = getCookie("token");
  const storedUserType = getCookie("userType");

  useEffect(() => {
    const checkToken = async () => {
      setIsVerifying(true);
      if (!token) {
        setIsVerifying(false);
        setIsValid(false);
        return;
      }
      try {
        const resultAction = await dispatch(verifyAuthToken());
        if (verifyAuthToken.fulfilled.match(resultAction)) {
          const backendUser =
            resultAction.payload?.user || resultAction.payload;
          const tokenUserType =
            backendUser?.userType || resultAction.payload?.userType;
          if (
            storedUserType &&
            tokenUserType &&
            tokenUserType.toLowerCase() !== storedUserType.toLowerCase()
          ) {
            clearAuthCookies();
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } else {
          clearAuthCookies();
          setIsValid(false);
        }
      } catch {
        clearAuthCookies();
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    };
    checkToken();
  }, [dispatch, location.pathname, token, storedUserType]);

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-muted gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium">Verifying session…</p>
      </div>
    );
  }

  if (!token || !isValid) {
    return <Navigate to={signInPathFor(storedUserType)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
