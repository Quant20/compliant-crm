import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (["administrator", "system administrator"].includes(role)) {
    return "admin";
  }

  if (role === "agent") {
    return "support agent";
  }

  return role;
}

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const {
    currentUser,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="crm-auth-loading" aria-live="polite">
        <div className="crm-auth-loading-card">
          <div className="crm-auth-loading-logo">SW</div>
          <strong>Restoring your ServiceWise session…</strong>
          <span>Please wait.</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const permittedRoles = allowedRoles.map(normalizeRole);
  const userRole = normalizeRole(currentUser?.role);

  if (
    permittedRoles.length > 0 &&
    !permittedRoles.includes(userRole)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
