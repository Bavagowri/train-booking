import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAdminAuth } from "../auth/AdminAuthContext";

export function ProtectedAdminRoute() {
  const {
    isAuthenticated,
    isInitializing,
  } = useAdminAuth();

  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="admin-route-loading">
        <span
          className="admin-route-spinner"
          aria-hidden="true"
        />

        <p>
          Verifying administrator session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}