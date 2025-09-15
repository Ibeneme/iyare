
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "./utils/auth";

const PublicRoute = () => {
  // Check if the user is authenticated
  const auth = isAuthenticated();


  console.log(auth, 'auth')
  // If the user is logged in, redirect them to the dashboard.
  // This prevents them from seeing the sign-in/forgot password pages.
  if (auth) {
    // You can change '/dashboard-a' to your preferred default authenticated route
    return <Navigate to="/classes/dashboard/all" replace />;
  }

  // If not authenticated, render the child routes (e.g., the auth forms).
  return <Outlet />;
};

export default PublicRoute;
