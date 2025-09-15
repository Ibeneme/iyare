// src/Components/ProtectedRoute.js


import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';

const ProtectedRoute = () => {
  // Check if the user is authenticated
  const auth = isAuthenticated();

  console.log(auth, 'auth')
  // If not authenticated, redirect to the sign-in page
  if (!auth) {
    return <Navigate to="/auth-sign-in" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;