import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getStoredSession,
  login as loginUser,
  logout as logoutUser,
  refreshSession,
  subscribeToAuthChanges,
} from "../services/authService";

const AuthContext = createContext(null);

const normalizeRole = (value) =>
  String(value || "").trim().toLowerCase();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const nextSession = await refreshSession();
        if (active) setSession(nextSession);
      } catch (initializationError) {
        console.error("Unable to restore the authentication session:", initializationError);
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError("");
    setLoading(true);

    try {
      const nextSession = await loginUser(credentials);
      setSession(nextSession);
      return nextSession.user;
    } catch (loginError) {
      const message = loginError?.message || "Unable to sign in.";
      setError(message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      await logoutUser();
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setError("");
  }, []);

  const hasRole = useCallback(
    (...allowedRoles) => {
      if (allowedRoles.length === 0) return true;

      const userRole = normalizeRole(session?.user?.role);
      return allowedRoles.flat().map(normalizeRole).includes(userRole);
    },
    [session],
  );

  const canAccess = useCallback(
    (allowedRoles = []) => {
      if (!session?.user) return false;
      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        return true;
      }
      return hasRole(allowedRoles);
    },
    [hasRole, session],
  );

  const value = useMemo(
    () => ({
      session,
      currentUser: session?.user || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.user),
      loading,
      error,
      login,
      logout,
      hasRole,
      canAccess,
      clearAuthError,
    }),
    [
      session,
      loading,
      error,
      login,
      logout,
      hasRole,
      canAccess,
      clearAuthError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export default AuthContext;
