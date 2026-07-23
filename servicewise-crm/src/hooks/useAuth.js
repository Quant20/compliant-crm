import { useCallback, useState } from "react";

const AUTH_STORAGE_KEYS = [
  "servicewise_current_user",
  "currentUser",
  "user",
];

const fallbackUser = {
  id: "EMP001",
  name: "System Administrator",
  email: "admin@servicewise.com",
  role: "Admin",
  department: "Tech and Support",
};

function readStoredUser() {
  if (typeof window === "undefined") {
    return fallbackUser;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const parsed = JSON.parse(value);
      const user = parsed?.user || parsed;

      if (user && typeof user === "object") {
        return {
          ...fallbackUser,
          ...user,
        };
      }
    } catch {
      // Try the next supported storage key.
    }
  }

  return fallbackUser;
}

export default function useAuth() {
  const [currentUser, setCurrentUserState] =
    useState(readStoredUser);

  const setCurrentUser = useCallback((user) => {
    const nextUser = user || fallbackUser;

    setCurrentUserState(nextUser);

    try {
      localStorage.setItem(
        AUTH_STORAGE_KEYS[0],
        JSON.stringify(nextUser),
      );
    } catch (error) {
      console.error(
        "Unable to store the current user:",
        error,
      );
    }
  }, []);

  const logout = useCallback(() => {
    AUTH_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore unavailable browser storage.
      }
    });

    setCurrentUserState(fallbackUser);
  }, []);

  return {
    currentUser,
    user: currentUser,
    isAuthenticated: Boolean(currentUser),
    loading: false,
    setCurrentUser,
    logout,
  };
}
