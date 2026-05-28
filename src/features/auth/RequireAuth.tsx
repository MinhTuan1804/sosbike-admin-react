import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "./authStorage";

export function RequireAuth() {
  const token = getAccessToken();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

