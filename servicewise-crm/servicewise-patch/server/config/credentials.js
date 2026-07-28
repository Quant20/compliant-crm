import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const usersFile = path.resolve(currentDirectory, "../data/users.json");

let usersCache = null;
let cacheTimestamp = 0;

/**
 * Read user credentials from the secure users.json file.
 * Uses an in-memory cache with 5-second TTL.
 */
export async function loadUsers() {
  const now = Date.now();

  if (usersCache && now - cacheTimestamp < 5000) {
    return usersCache;
  }

  try {
    const raw = await readFile(usersFile, "utf8");
    const data = JSON.parse(raw);
    usersCache = data.users || [];
    cacheTimestamp = now;
    return usersCache;
  } catch (error) {
    console.error("Failed to load users.json:", error.message);
    usersCache = [];
    cacheTimestamp = now;
    return usersCache;
  }
}

/**
 * Get all users without passwords.
 */
export async function getAllUsers() {
  const users = await loadUsers();
  return users.map((user) => {
    const safe = { ...user };
    delete safe.password;
    return safe;
  });
}

/**
 * Find a user by email, username, or employee ID (case-insensitive).
 */
export async function findUser(identifier) {
  const normalized = String(identifier || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const users = await loadUsers();

  return (
    users.find(
      (user) =>
        String(user.email || "").toLowerCase() === normalized ||
        String(user.username || "").toLowerCase() === normalized ||
        String(user.employeeId || "").toLowerCase() === normalized,
    ) || null
  );
}

/**
 * Verify a plaintext password against the stored credential.
 */
export async function verifyPassword(identifier, password) {
  const user = await findUser(identifier);

  if (!user) {
    return null;
  }

  if (!password || password !== user.password) {
    return null;
  }

  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * Save users array to disk and invalidate cache.
 */
async function saveUsers(users) {
  try {
    await writeFile(usersFile, JSON.stringify({ users, _updated: new Date().toISOString() }, null, 2), "utf8");
    usersCache = users;
    cacheTimestamp = Date.now();
    return true;
  } catch (error) {
    console.error("Failed to save users:", error.message);
    throw new Error("Unable to save changes. Please try again.");
  }
}

/**
 * Change a user's password. Requires the current password.
 */
export async function changePassword(identifier, currentPassword, newPassword) {
  const normalized = String(identifier || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error("A valid email or employee ID is required.");
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

  if (newPassword === currentPassword) {
    throw new Error("New password must be different from the current password.");
  }

  const users = await loadUsers();

  const userIndex = users.findIndex(
    (user) =>
      String(user.email || "").toLowerCase() === normalized ||
      String(user.username || "").toLowerCase() === normalized ||
      String(user.employeeId || "").toLowerCase() === normalized,
  );

  if (userIndex === -1) {
    throw new Error("No account was found for this identifier.");
  }

  if (users[userIndex].password !== currentPassword) {
    throw new Error("Current password is incorrect.");
  }

  users[userIndex].password = newPassword;
  await saveUsers(users);
  return true;
}

/**
 * Admin: Update user profile fields (name, role, department, phone).
 * Admin can also reset a user's password directly.
 */
export async function adminUpdateUser(email, updates) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error("Email is required.");
  }

  const users = await loadUsers();

  const userIndex = users.findIndex(
    (user) => String(user.email || "").toLowerCase() === normalized,
  );

  if (userIndex === -1) {
    throw new Error(`No account found for "${email}".`);
  }

  // Allow updating these fields
  const allowedFields = ["name", "role", "department", "phone", "password", "username", "employeeId"];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;

    if (key === "password") {
      if (!value || String(value).length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }
      users[userIndex].password = String(value);
    } else {
      users[userIndex][key] = String(value || "").trim() || users[userIndex][key];
    }
  }

  await saveUsers(users);

  const safe = { ...users[userIndex] };
  delete safe.password;
  return safe;
}

/**
 * Admin: Create a new user account.
 */
export async function createUser(userData) {
  const { email, password, name, role, department, phone, username, employeeId } = userData || {};

  if (!email || !String(email).trim()) {
    throw new Error("Email is required.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!password || String(password).length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const users = await loadUsers();

  // Check for duplicate email
  const exists = users.find(
    (user) => String(user.email || "").toLowerCase() === normalizedEmail
  );

  if (exists) {
    throw new Error(`A user with email "${normalizedEmail}" already exists.`);
  }

  // Generate employee ID if not provided
  const maxId = users.reduce((max, u) => {
    const id = u.employeeId || u.employee_id || "";
    const num = parseInt(id.replace(/\D/g, ""), 10);
    return num > max ? num : max;
  }, 0);

  const newUser = {
    email: normalizedEmail,
    password: String(password),
    name: String(name || "").trim() || normalizedEmail.split("@")[0],
    role: String(role || "Support Agent").trim(),
    department: String(department || "Customer Support").trim(),
    phone: String(phone || "").trim(),
    username: String(username || "").trim() || null,
    employeeId: String(employeeId || "").trim() || `EMP${String(maxId + 1).padStart(3, "0")}`,
  };

  users.push(newUser);
  await saveUsers(users);

  const safe = { ...newUser };
  delete safe.password;
  return safe;
}
