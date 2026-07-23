import users from "../data/users";
import {
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";

const SESSION_KEY = "servicewise_auth_session";
const CURRENT_USER_KEY = "servicewise_current_user";
const AUTH_EVENT = "servicewise-auth-change";

const DEMO_PASSWORDS = {
  "admin@servicewise.com": "admin123",
  "zubair@servicewise.com": "agent123",
};

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const createLocalUser = (user) => ({
  ...user,
  id: user.id || user.employeeId || user.employee_id,
  employeeId:
    user.employeeId || user.employee_id || String(user.id || ""),
  name:
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email,
  role: user.role || "Support Agent",
  department: user.department || user.team || "Customer Support",
});

const readJson = (key) => {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const writeSession = (session, remember = true) => {
  if (typeof window === "undefined") return;

  const target = remember
    ? window.localStorage
    : window.sessionStorage;

  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);

  target.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(session.user),
  );

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: session,
    }),
  );
};

const clearSession = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: null,
    }),
  );
};

const mapSupabaseUser = (supabaseUser) => {
  const metadata = supabaseUser?.user_metadata || {};

  return {
    id: supabaseUser?.id,
    employeeId:
      metadata.employeeId ||
      metadata.employee_id ||
      supabaseUser?.id,
    name:
      metadata.name ||
      metadata.full_name ||
      supabaseUser?.email ||
      "ServiceWise User",
    email: supabaseUser?.email || "",
    phone: metadata.phone || "",
    role: metadata.role || "Support Agent",
    department:
      metadata.department || metadata.team || "Customer Support",
    accountStatus:
      metadata.accountStatus || metadata.account_status || "Active",
  };
};

export const getStoredSession = () => {
  const localSession = readJson(SESSION_KEY);

  if (localSession?.user) return localSession;

  if (typeof window !== "undefined") {
    try {
      const sessionValue = window.sessionStorage.getItem(SESSION_KEY);
      const session = sessionValue
        ? JSON.parse(sessionValue)
        : null;

      if (session?.user) return session;
    } catch {
      // Ignore unavailable or damaged browser storage.
    }
  }

  const legacyUser = readJson(CURRENT_USER_KEY);

  if (legacyUser) {
    return {
      provider: "local",
      user: legacyUser,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
};

export const getCurrentUser = () =>
  getStoredSession()?.user || null;

const loginWithLocalAccount = ({
  email,
  password,
  remember,
}) => {
  const identifier = normalize(email);

  const user = users.find((item) => {
    return [item.email, item.username, item.employeeId, item.employee_id]
      .map(normalize)
      .includes(identifier);
  });

  if (!user) {
    throw new Error("No ServiceWise account was found for this email or username.");
  }

  const expectedPassword =
    DEMO_PASSWORDS[normalize(user.email)] || "servicewise123";

  if (password !== expectedPassword) {
    throw new Error("The password is incorrect.");
  }

  const currentUser = createLocalUser(user);

  if (
    normalize(currentUser.accountStatus || currentUser.account_status) ===
    "inactive"
  ) {
    throw new Error("This account is inactive. Contact your administrator.");
  }

  const session = {
    provider: "local",
    user: currentUser,
    createdAt: new Date().toISOString(),
  };

  writeSession(session, remember);
  return session;
};

export const login = async ({
  email,
  password,
  remember = true,
}) => {
  if (!String(email || "").trim()) {
    throw new Error("Enter your email, username, or employee ID.");
  }

  if (!String(password || "")) {
    throw new Error("Enter your password.");
  }

  const identifier = normalize(email);
  const isKnownLocalAccount = users.some((item) => {
    return [item.email, item.username, item.employeeId, item.employee_id]
      .map(normalize)
      .includes(identifier);
  });

  if (isKnownLocalAccount || !isSupabaseConfigured) {
    return loginWithLocalAccount({
      email,
      password,
      remember,
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || "Unable to sign in.");
  }

  const session = {
    provider: "supabase",
    user: mapSupabaseUser(data.user),
    accessToken: data.session?.access_token || null,
    createdAt: new Date().toISOString(),
  };

  writeSession(session, remember);
  return session;
};

export const logout = async () => {
  try {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } finally {
    clearSession();
  }
};

export const refreshSession = async () => {
  if (!isSupabaseConfigured) {
    return getStoredSession();
  }

  const { data } = await supabase.auth.getSession();

  if (!data.session?.user) {
    return getStoredSession();
  }

  const session = {
    provider: "supabase",
    user: mapSupabaseUser(data.session.user),
    accessToken: data.session.access_token,
    createdAt: new Date().toISOString(),
  };

  writeSession(session, true);
  return session;
};

export const subscribeToAuthChanges = (callback) => {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (event) => callback(event.detail);
  const handleStorage = () => callback(getStoredSession());

  window.addEventListener(AUTH_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  let supabaseSubscription = null;

  if (isSupabaseConfigured) {
    const { data } = supabase.auth.onAuthStateChange(
      (_event, supabaseSession) => {
        if (!supabaseSession?.user) {
          if (_event === "SIGNED_OUT") {
            clearSession();
            callback(null);
          }
          return;
        }

        const session = {
          provider: "supabase",
          user: mapSupabaseUser(supabaseSession.user),
          accessToken: supabaseSession.access_token,
          createdAt: new Date().toISOString(),
        };

        writeSession(session, true);
        callback(session);
      },
    );

    supabaseSubscription = data.subscription;
  }

  return () => {
    window.removeEventListener(AUTH_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
    supabaseSubscription?.unsubscribe();
  };
};

export const DEMO_ACCOUNTS = [
  {
    label: "Administrator",
    email: "admin@servicewise.com",
    password: "admin123",
    role: "Admin",
  },
  {
    label: "Support Agent",
    email: "zubair@servicewise.com",
    password: "agent123",
    role: "Support Agent",
  },
];

export default {
  login,
  logout,
  getStoredSession,
  getCurrentUser,
  refreshSession,
  subscribeToAuthChanges,
};
