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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeAuthentication() {
      try {
        const restoredSession = await refreshSession();

        if (active) {
          setSession(restoredSession);
        }
      } catch (initializationError) {
        console.error(
          "Unable to restore the authentication session:",
          initializationError,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuthentication();

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      if (!active) {
        return;
      }

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
      if (allowedRoles.length === 0) {
        return true;
      }

      const userRole = normalizeRole(session?.user?.role);
      const normalizedAllowedRoles = allowedRoles
        .flat()
        .map(normalizeRole);

      return normalizedAllowedRoles.includes(userRole);
    },
    [session],
  );

  const canAccess = useCallback(
    (allowedRoles = []) => {
      if (!session?.user) {
        return false;
      }

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
