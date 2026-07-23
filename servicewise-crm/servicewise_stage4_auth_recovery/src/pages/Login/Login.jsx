import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { DEMO_ACCOUNTS } from "../../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    loading,
    error: authError,
    login,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  if (isAuthenticated) {
    const destination =
      location.state?.from?.pathname || "/dashboard";

    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setMessage("");

    try {
      await login({
        email,
        password,
        remember,
      });

      navigate(
        location.state?.from?.pathname || "/dashboard",
        { replace: true },
      );
    } catch (loginError) {
      setLocalError(loginError?.message || "Unable to sign in.");
    }
  };

  const useDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError("");
    setMessage(`${account.label} credentials added.`);
  };

  const handleForgotPassword = () => {
    setLocalError("");
    setMessage(
      "Ask your ServiceWise administrator to reset your password.",
    );
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-logo-mark" aria-hidden="true">
            SW
          </div>

          <p className="login-eyebrow">SERVICEWISE CRM</p>
          <h1>Manage customer complaints from one secure workspace.</h1>
          <p className="login-brand-description">
            Track tickets, customer communication, ownership, SLA progress,
            internal notes, and follow-up activity.
          </p>

          <div className="login-feature-list">
            <div>
              <span>01</span>
              <p>Central complaint and ticket tracking</p>
            </div>
            <div>
              <span>02</span>
              <p>Clear ownership and escalation history</p>
            </div>
            <div>
              <span>03</span>
              <p>Secure role-based staff access</p>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <header className="login-card-header">
            <div className="login-mobile-brand">
              <div className="login-logo-mark">SW</div>
              <strong>ServiceWise CRM</strong>
            </div>

            <p className="login-eyebrow">WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <p>Use your staff email, username, or employee ID.</p>
          </header>

          {(localError || authError) && (
            <div className="login-alert login-alert-error" role="alert">
              <strong>Sign-in failed</strong>
              <span>{localError || authError}</span>
            </div>
          )}

          {message && (
            <div className="login-alert login-alert-info" role="status">
              {message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">Email, username, or employee ID</label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@servicewise.com"
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="login-text-button"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <div className="login-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="login-checkbox-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Keep me signed in on this device</span>
            </label>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="login-divider">
            <span>Demo accounts</span>
          </div>

          <div className="login-demo-buttons">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => useDemoAccount(account)}
                disabled={loading}
              >
                <strong>{account.label}</strong>
                <span>{account.email}</span>
              </button>
            ))}
          </div>

          <p className="login-demo-note">
            Administrator password: <strong>admin123</strong><br />
            Support Agent password: <strong>agent123</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
