import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "./Unauthorized.css";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { currentUser, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="unauthorized-page">
      <section className="unauthorized-card">
        <div className="unauthorized-code">403</div>

        <div className="unauthorized-icon" aria-hidden="true">
          !
        </div>

        <p className="unauthorized-eyebrow">ACCESS RESTRICTED</p>
        <h1>You do not have permission to open this page.</h1>
        <p className="unauthorized-description">
          Your account is signed in, but this section is not available for
          your assigned role. Return to the dashboard or sign in with another
          authorized account.
        </p>

        {currentUser && (
          <div className="unauthorized-user-card">
            <div className="unauthorized-avatar">
              {String(currentUser.name || currentUser.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div>
              <strong>{currentUser.name || currentUser.email}</strong>
              <span>
                {currentUser.role || "User"}
                {currentUser.department
                  ? ` · ${currentUser.department}`
                  : ""}
              </span>
            </div>
          </div>
        )}

        <div className="unauthorized-actions">
          <button
            type="button"
            className="dashboard-button"
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </section>
    </main>
  );
}
