import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import useAuth from "../hooks/useAuth";

/** Sign-in / register pages: signed-in users are sent straight to their home page. */
const PublicRoute = () => {
  const { homePath } = useAuth();
  return isAuthenticated() ? <Navigate to={homePath} replace /> : <Outlet />;
};

export default PublicRoute;
