import users from "../data/users";
import {
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";

const SESSION_KEY = "servicewise_auth_session";
const CURRENT_USER_KEY = "servicewise_current_user";
const AUTH_EVENT = "servicewise-auth-change";

/**
 * Server API base URL.
 * Falls back to localhost:5000 for local development.
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

/*
  ⚠️  DEPRECATED — Passwords are now stored server-side.

  The DEMO_PASSWORDS map below is KEPT ONLY for backward compatibility
  if the server is not running. In production, the server MUST be running
  so that all authentication goes through POST /api/auth/login.

  To disable this fallback, delete the DEMO_PASSWORDS object entirely.
*/
const DEMO_PASSWORDS = {
  // REMOVE THESE — passwords are now in server/data/users.json
};

// Default password for the client-side fallback path.
// Also deprecated — should be handled server-side only.
const DEFAULT_PASSWORD = "servicewise123";

const normalize = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

function createLocalUser(user) {
  return {
    ...user,

    id:
      user.id ||
      user.employeeId ||
      user.employee_id,

    employeeId:
      user.employeeId ||
      user.employee_id ||
      String(user.id || ""),

    name:
      user.name ||
      [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
      user.email,

    role:
      user.role ||
      "Support Agent",

    department:
      user.department ||
      user.team ||
      "Customer Support",
  };
}

function readStorage(storage, key) {
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(key);

    return value
      ? JSON.parse(value)
      : null;
  } catch {
    return null;
  }
}

function writeSession(session, remember = true) {
  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = remember
    ? window.localStorage
    : window.sessionStorage;

  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);

  targetStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );

  window.localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(session.user),
  );

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: session,
    }),
  );
}

function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: null,
    }),
  );
}

function mapSupabaseUser(supabaseUser) {
  const metadata =
    supabaseUser?.user_metadata || {};

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

    email:
      supabaseUser?.email || "",

    phone:
      metadata.phone || "",

    role:
      metadata.role ||
      "Support Agent",

    department:
      metadata.department ||
      metadata.team ||
      "Customer Support",

    accountStatus:
      metadata.accountStatus ||
      metadata.account_status ||
      "Active",
  };
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const localSession = readStorage(
    window.localStorage,
    SESSION_KEY,
  );

  if (localSession?.user) {
    return localSession;
  }

  const temporarySession = readStorage(
    window.sessionStorage,
    SESSION_KEY,
  );

  if (temporarySession?.user) {
    return temporarySession;
  }

  const legacyUser = readStorage(
    window.localStorage,
    CURRENT_USER_KEY,
  );

  if (legacyUser) {
    return {
      provider: "local",
      user: legacyUser,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export function getCurrentUser() {
  return getStoredSession()?.user || null;
}

function findLocalUser(identifier) {
  return users.find((item) => {
    const identifiers = [
      item.email,
      item.username,
      item.employeeId,
      item.employee_id,
    ]
      .filter(Boolean)
      .map(normalize);

    return identifiers.includes(identifier);
  });
}

/**
 * ─── Server-Side Login (Primary) ───
 * Authenticates via POST /api/auth/login.
 * This is the RECOMMENDED path — passwords are verified server-side.
 */
async function loginWithServer({ email, password, remember }) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Login failed.");
    }

    const user = createLocalUser(data.user);
    const session = {
      provider: "server",
      user,
      token: data.token,
      createdAt: new Date().toISOString(),
    };

    writeSession(session, remember);
    return session;
  } catch (error) {
    // If the server is unreachable, fall through to local fallback
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
      console.warn(
        "[Auth] Server unreachable. Falling back to local authentication. " +
        "Start the server for secure authentication."
      );
      return null; // Signal to try local fallback
    }

    // Server responded with an auth error — propagate it
    throw error;
  }
}

/**
 * ─── Client-Side Login (Fallback — DEPRECATED) ───
 * Only used when the server is not running.
 * REMOVE THIS FUNCTION after migrating all auth to the server.
 */
function loginWithLocalAccount({ email, password, remember }) {
  const identifier = normalize(email);
  const user = findLocalUser(identifier);

  if (!user) {
    throw new Error(
      "No ServiceWise account was found for this email, username, or employee ID.",
    );
  }

  // Local fallback: accept any password if DEMO_PASSWORDS is empty
  // This is intentionally permissive because the server should handle real auth
  const expectedPassword = DEMO_PASSWORDS[identifier] || DEFAULT_PASSWORD;

  if (password !== expectedPassword) {
    throw new Error(
      "The password is incorrect.",
    );
  }

  const currentUser = createLocalUser(user);

  const accountStatus = normalize(
    currentUser.accountStatus || currentUser.account_status,
  );

  if (accountStatus === "inactive") {
    throw new Error(
      "This account is inactive. Contact your administrator.",
    );
  }

  const session = {
    provider: "local",
    user: currentUser,
    createdAt: new Date().toISOString(),
  };

  writeSession(session, remember);
  return session;
}

/**
 * ─── Change Password (Server-Side) ───
 * Calls POST /api/auth/change-password to update the user's credential.
 */
export async function changePassword({ email, currentPassword, newPassword }) {
  if (!email || !String(email).trim()) {
    throw new Error("Email is required.");
  }

  if (!currentPassword) {
    throw new Error("Current password is required.");
  }

  if (!newPassword) {
    throw new Error("New password is required.");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to change password.");
    }

    return data.message;
  } catch (error) {
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
      throw new Error("Server is unreachable. Cannot change password without the server.");
    }
    throw error;
  }
}

export async function login({
  email,
  password,
  remember = true,
}) {
  if (!String(email || "").trim()) {
    throw new Error(
      "Enter your email, username, or employee ID.",
    );
  }

  if (!String(password || "")) {
    throw new Error(
      "Enter your password.",
    );
  }

  const identifier = normalize(email);

  // ── Try Supabase first if configured and user is not local ──
  const isKnownLocalAccount = Boolean(findLocalUser(identifier));

  if (!isKnownLocalAccount && isSupabaseConfigured) {
    try {
      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password,
      });

      if (!error && data.user) {
        const session = {
          provider: "supabase",
          user: mapSupabaseUser(data.user),
          accessToken: data.session?.access_token || null,
          createdAt: new Date().toISOString(),
        };

        writeSession(session, remember);
        return session;
      }
    } catch (supabaseError) {
      console.warn("[Auth] Supabase login failed, trying server fallback.", supabaseError.message);
    }
  }

  // ── Try server-side authentication (PRIMARY) ──
  const serverSession = await loginWithServer({ email, password, remember });
  if (serverSession) {
    return serverSession;
  }

  // ── Local fallback (DEPRECATED — server should always be running) ──
  return loginWithLocalAccount({ email, password, remember });
}

export async function logout() {
  try {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } finally {
    clearSession();
  }
}

export async function refreshSession() {
  const storedSession = getStoredSession();

  if (!isSupabaseConfigured) {
    return storedSession;
  }

  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error(
      "Unable to refresh Supabase authentication:",
      error,
    );

    return storedSession;
  }

  if (!data.session?.user) {
    return storedSession;
  }

  const session = {
    provider: "supabase",
    user: mapSupabaseUser(data.session.user),
    accessToken: data.session.access_token,
    createdAt: new Date().toISOString(),
  };

  writeSession(session, true);

  return session;
}

export function subscribeToAuthChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event) => {
    callback(event.detail);
  };

  const handleStorage = () => {
    callback(getStoredSession());
  };

  window.addEventListener(AUTH_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  let supabaseSubscription = null;

  if (isSupabaseConfigured) {
    const { data } = supabase.auth.onAuthStateChange(
      (eventName, supabaseSession) => {
        if (!supabaseSession?.user) {
          if (eventName === "SIGNED_OUT") {
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
}

/**
 * Demo accounts for development/testing UI only.
 * ⚠️  Passwords are NO LONGER included — they are stored server-side.
 */
export const DEMO_ACCOUNTS = users.map((user) => {
  return {
    label: user.name || user.email,
    email: user.email,
    password: undefined, // No longer exposed — use the server to authenticate
    role: user.role || "Support Agent",
  };
});

/**
 * ─── Admin: List All Users (Server-Side) ───
 * Calls GET /api/auth/users. Requires API key header.
 */
export async function listUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sw_crm_2025_dev_key_change_in_production",
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load users.");
    }

    return data.users;
  } catch (error) {
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
      throw new Error("Server is unreachable. Cannot load users without the server.");
    }
    throw error;
  }
}

/**
 * ─── Admin: Update User (Server-Side) ───
 * Calls PUT /api/auth/users/:email. Can update name, role, department, phone, password.
 */
export async function adminUpdateUser(email, updates) {
  if (!email || !String(email).trim()) {
    throw new Error("User email is required.");
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No updates provided.");
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/users/${encodeURIComponent(email.trim())}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sw_crm_2025_dev_key_change_in_production",
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update user.");
    }

    return data.user;
  } catch (error) {
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
      throw new Error("Server is unreachable. Cannot update user without the server.");
    }
    throw error;
  }
}

export default {
  login,
  logout,
  getStoredSession,
  getCurrentUser,
  refreshSession,
  subscribeToAuthChanges,
  changePassword,
  listUsers,
  adminUpdateUser,
  createUser,
};

/**
 * ─── Admin: Create User (Server-Side) ───
 * Calls POST /api/auth/users. Requires API key header.
 */
export async function createUser(userData) {
  if (!userData || !userData.email || !String(userData.email).trim()) {
    throw new Error("Email is required.");
  }

  if (!userData.password || String(userData.password).length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sw_crm_2025_dev_key_change_in_production",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to create user.");
    }

    return data.user;
  } catch (error) {
    if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
      throw new Error("Server is unreachable. Cannot create user without the server.");
    }
    throw error;
  }
}
