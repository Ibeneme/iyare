import { Navigate, useLocation } from "react-router-dom";

/** Sends an old URL to its new home and keeps ?query and #hash (payment callbacks need them). */
const LegacyRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
};

export default LegacyRedirect;
