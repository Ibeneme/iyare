import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "./utils/auth";

const PublicRoute = () => {
  const auth = isAuthenticated();

  console.log(auth, "auth");

  if (auth) {
    return <Navigate to="/subject-manager" replace />;
  }
  return <Outlet />;
};

export default PublicRoute;
