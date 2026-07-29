import {
  verifyPassword,
  changePassword,
  getAllUsers,
  adminUpdateUser,
  createUser,
} from "../config/credentials.js";

function generateToken(user) {
  return (
    "sw_" +
    Buffer.from(
      JSON.stringify({
        email: user.email,
        id: user.employeeId,
        role: user.role,
        iat: Date.now(),
      }),
    ).toString("base64url")
  );
}

export async function loginHandler(
  req,
  res,
) {
  try {
    const {
      email,
      password,
    } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password required.",
      });
    }

    const user = await verifyPassword(
      email.trim(),
      password,
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    const accountStatus = String(
      user.accountStatus || "active",
    ).toLowerCase();

    if (
      ["inactive", "suspended"].includes(
        accountStatus,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Account inactive.",
      });
    }

    return res.json({
      success: true,
      user,
      token: generateToken(user),
      message: "Login successful.",
    });
  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Login error.",
    });
  }
}

export async function changePasswordHandler(
  req,
  res,
) {
  try {
    const {
      email,
      currentPassword,
      newPassword,
    } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email required.",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password required.",
      });
    }

    if (
      !newPassword ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    await changePassword(
      email.trim(),
      currentPassword,
      newPassword,
    );

    return res.json({
      success: true,
      message: "Password changed.",
    });
  } catch (error) {
    const status = error.message.includes(
      "incorrect",
    )
      ? 401
      : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
}

export async function listUsersHandler(
  req,
  res,
) {
  try {
    const users = await getAllUsers();

    return res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error(
      "List users error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load users.",
    });
  }
}

export async function createUserHandler(
  req,
  res,
) {
  try {
    const user = await createUser(
      req.body || {},
    );

    return res.status(201).json({
      success: true,
      user,
      message:
        "User created successfully.",
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error,
    );

    const duplicate =
      error.message.includes(
        "already",
      ) ||
      error.message.includes(
        "in use",
      );

    return res
      .status(duplicate ? 409 : 400)
      .json({
        success: false,
        message: error.message,
      });
  }
}

export async function updateUserHandler(
  req,
  res,
) {
  try {
    const {
      email,
    } = req.params;

    const updates =
      req.body || {};

    if (
      !email ||
      !Object.keys(updates).length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and updates required.",
      });
    }

    const user =
      await adminUpdateUser(
        email,
        updates,
      );

    return res.json({
      success: true,
      user,
      message: "Updated.",
    });
  } catch (error) {
    const status =
      error.message.includes("found")
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
}
