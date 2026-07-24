import users from "../data/users";
import {
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";

const SESSION_KEY = "servicewise_auth_session";
const CURRENT_USER_KEY = "servicewise_current_user";
const AUTH_EVENT = "servicewise-auth-change";

/*
  Development-only local passwords.

  Remove this local fallback before production.
*/
const DEMO_PASSWORDS = {
  "admin@servicewise.com": "admin123",
  "yawar@servicewise.com": "agent123",
  "mahendar@servicewise.com": "servicewise123",
  "krishna@servicewise.com": "servicewise123",
  "faizan@servicewise.com": "servicewise123",
  "zubair@servicewise.com": "servicewise123",
  "afzal@servicewise.com": "servicewise123",
};

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

function getLocalPassword(user) {
  return (
    DEMO_PASSWORDS[normalize(user.email)] ||
    "servicewise123"
  );
}

function loginWithLocalAccount({
  email,
  password,
  remember,
}) {
  const identifier = normalize(email);

  const user = findLocalUser(identifier);

  if (!user) {
    throw new Error(
      "No ServiceWise account was found for this email, username, or employee ID.",
    );
  }

  const expectedPassword =
    getLocalPassword(user);

  if (password !== expectedPassword) {
    throw new Error(
      "The password is incorrect.",
    );
  }

  const currentUser =
    createLocalUser(user);

  const accountStatus = normalize(
    currentUser.accountStatus ||
      currentUser.account_status,
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

  const isKnownLocalAccount = Boolean(
    findLocalUser(identifier),
  );

  if (
    isKnownLocalAccount ||
    !isSupabaseConfigured
  ) {
    return loginWithLocalAccount({
      email,
      password,
      remember,
    });
  }

  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password,
  });

  if (error) {
    throw new Error(
      error.message ||
      "Unable to sign in.",
    );
  }

  const session = {
    provider: "supabase",

    user:
      mapSupabaseUser(data.user),

    accessToken:
      data.session?.access_token ||
      null,

    createdAt:
      new Date().toISOString(),
  };

  writeSession(session, remember);

  return session;
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
  const storedSession =
    getStoredSession();

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

    user:
      mapSupabaseUser(
        data.session.user,
      ),

    accessToken:
      data.session.access_token,

    createdAt:
      new Date().toISOString(),
  };

  writeSession(session, true);

  return session;
}

export function subscribeToAuthChanges(
  callback,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event) => {
    callback(event.detail);
  };

  const handleStorage = () => {
    callback(getStoredSession());
  };

  window.addEventListener(
    AUTH_EVENT,
    handleCustomEvent,
  );

  window.addEventListener(
    "storage",
    handleStorage,
  );

  let supabaseSubscription = null;

  if (isSupabaseConfigured) {
    const { data } =
      supabase.auth.onAuthStateChange(
        (
          eventName,
          supabaseSession,
        ) => {
          if (!supabaseSession?.user) {
            if (eventName === "SIGNED_OUT") {
              clearSession();
              callback(null);
            }

            return;
          }

          const session = {
            provider: "supabase",

            user:
              mapSupabaseUser(
                supabaseSession.user,
              ),

            accessToken:
              supabaseSession.access_token,

            createdAt:
              new Date().toISOString(),
          };

          writeSession(session, true);

          callback(session);
        },
      );

    supabaseSubscription =
      data.subscription;
  }

  return () => {
    window.removeEventListener(
      AUTH_EVENT,
      handleCustomEvent,
    );

    window.removeEventListener(
      "storage",
      handleStorage,
    );

    supabaseSubscription?.unsubscribe();
  };
}

export const DEMO_ACCOUNTS = users.map(
  (user) => {
    return {
      label:
        user.name ||
        user.email,

      email:
        user.email,

      password:
        getLocalPassword(user),

      role:
        user.role ||
        "Support Agent",
    };
  },
);

export default {
  login,
  logout,
  getStoredSession,
  getCurrentUser,
  refreshSession,
  subscribeToAuthChanges,
};
