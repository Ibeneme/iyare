// src/Components/ProtectedRoute.js


import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';

const ProtectedRoute = () => {
  const auth = isAuthenticated();

  console.log(auth, 'auth')
  if (!auth) {
    return <Navigate to="/auth-sign-in" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;