import {
  verifyPassword,
  changePassword,
  getAllUsers,
  adminUpdateUser,
  createUser,
} from "../config/credentials.js";

function generateSessionToken(user) {
  const payload = JSON.stringify({
    email: user.email,
    id: user.employeeId,
    role: user.role,
    iat: Date.now(),
  });

  return "sw_" + Buffer.from(payload).toString("base64url");
}

/**
 * POST /api/auth/login
 */
export async function loginHandler(request, response, next) {
  try {
    const { email, password } = request.body || {};

    if (!email || !String(email).trim()) {
      return response.status(400).json({ success: false, message: "Email, username, or employee ID is required." });
    }

    if (!password) {
      return response.status(400).json({ success: false, message: "Password is required." });
    }

    const user = await verifyPassword(email.trim(), password);

    if (!user) {
      return response.status(401).json({ success: false, message: "Invalid credentials. Check your email and password." });
    }

    const status = String(user.accountStatus || "active").toLowerCase();
    if (status === "inactive" || status === "suspended") {
      return response.status(403).json({ success: false, message: "This account is inactive. Contact your administrator." });
    }

    return response.json({ success: true, user, token: generateSessionToken(user), message: "Login successful." });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return response.status(500).json({ success: false, message: "An unexpected error occurred during login." });
  }
}

/**
 * POST /api/auth/change-password
 */
export async function changePasswordHandler(request, response, next) {
  try {
    const { email, currentPassword, newPassword } = request.body || {};

    if (!email || !String(email).trim()) {
      return response.status(400).json({ success: false, message: "Email is required." });
    }

    if (!currentPassword) {
      return response.status(400).json({ success: false, message: "Current password is required." });
    }

    if (!newPassword) {
      return response.status(400).json({ success: false, message: "New password is required." });
    }

    if (newPassword.length < 8) {
      return response.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }

    await changePassword(email.trim(), currentPassword, newPassword);

    return response.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    const status = error.message.includes("incorrect") ? 401 : 400;
    return response.status(status).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/auth/users
 * Returns all users (without passwords). Requires API key.
 */
export async function listUsersHandler(request, response) {
  try {
    const users = await getAllUsers();
    return response.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error("[Auth] List users error:", error.message);
    return response.status(500).json({ success: false, message: "Failed to load users." });
  }
}

/**
 * PUT /api/auth/users/:email
 * Admin: update user profile or reset password. Requires API key.
 */
export async function updateUserHandler(request, response) {
  try {
    const { email } = request.params;
    const updates = request.body || {};

    if (!email) {
      return response.status(400).json({ success: false, message: "User email is required." });
    }

    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ success: false, message: "No updates provided." });
    }

    const updatedUser = await adminUpdateUser(email, updates);

    return response.json({ success: true, user: updatedUser, message: "User updated successfully." });
  } catch (error) {
    const status = error.message.includes("found") ? 404 : 400;
    return response.status(status).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/users
 * Admin: create a new user. Requires API key.
 */
export async function createUserHandler(request, response) {
  try {
    const userData = request.body || {};

    if (!userData.email || !String(userData.email).trim()) {
      return response.status(400).json({ success: false, message: "Email is required." });
    }

    if (!userData.password || String(userData.password).length < 8) {
      return response.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const newUser = await createUser(userData);

    return response.status(201).json({ success: true, user: newUser, message: `User "${newUser.name}" created successfully.` });
  } catch (error) {
    const status = error.message.includes("already exists") ? 409 : 400;
    return response.status(status).json({ success: false, message: error.message });
  }
}
