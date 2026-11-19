import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import type { Role } from "../config/roles";

/** Only lets the listed account types through; everyone else goes to their own home page. */
const RoleRoute = ({ allow }: { allow: Role[] }) => {
  const { role, homePath } = useAuth();
  if (!role || !allow.includes(role)) return <Navigate to={homePath} replace />;
  return <Outlet />;
};

export default RoleRoute;
