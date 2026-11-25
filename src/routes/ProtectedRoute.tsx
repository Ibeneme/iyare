import { signInPathFor } from "../config/roles";
import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { verifyAuthToken } from "../store/features/auth/auth.slice";
import { AppDispatch } from "../store/index";
import { getCookie, clearAuthCookies } from "../utils/cookies";
import { isTokenExpired } from "../utils/auth";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const token = getCookie("token");
  const storedUserType = getCookie("userType");
  const looksValidLocally = !!token && !isTokenExpired(token);

  const [isValid, setIsValid] = useState(looksValidLocally);
  const [isVerifying, setIsVerifying] = useState(!!token && !looksValidLocally);
  const dispatch = useDispatch<AppDispatch>();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!token) {
      setIsVerifying(false);
      setIsValid(false);
      return;
    }

    const checkToken = async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
