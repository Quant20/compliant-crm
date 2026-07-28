import {
  readFile,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

const currentFile =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFile);

const usersFile = path.resolve(
  currentDirectory,
  "../data/users.json",
);

let usersCache = null;
let cacheTimestamp = 0;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const publicUser = (user) => {
  const sanitizedUser = {
    ...user,
  };

  delete sanitizedUser.password;

  return sanitizedUser;
};

export async function loadUsers() {
  const now = Date.now();

  if (
    usersCache &&
    now - cacheTimestamp < 5000
  ) {
    return usersCache;
  }

  try {
    const raw = await readFile(
      usersFile,
      "utf8",
    );

    const data = JSON.parse(raw);

    usersCache = Array.isArray(data.users)
      ? data.users
      : [];

    cacheTimestamp = now;

    return usersCache;
  } catch (error) {
    console.error(
      "Unable to load users:",
      error,
    );

    usersCache = [];
    cacheTimestamp = now;

    return usersCache;
  }
}

async function saveUsers(users) {
  try {
    await writeFile(
      usersFile,
      JSON.stringify(
        {
          users,
          _updated:
            new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );

    usersCache = users;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error(
      "Unable to save users:",
      error,
    );

    throw new Error(
      "Unable to save user data.",
    );
  }
}

export async function getAllUsers() {
  const users = await loadUsers();

  return users.map(publicUser);
}

export async function findUser(identifier) {
  const normalizedIdentifier =
    normalize(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  const users = await loadUsers();

  return (
    users.find((user) => {
      return (
        normalize(user.email) ===
          normalizedIdentifier ||
        normalize(user.username) ===
          normalizedIdentifier ||
        normalize(user.employeeId) ===
          normalizedIdentifier
      );
    }) || null
  );
}

export async function verifyPassword(
  identifier,
  password,
) {
  const user =
    await findUser(identifier);

  if (!user) {
    return null;
  }

  if (
    !password ||
    password !== user.password
  ) {
    return null;
  }

  return publicUser(user);
}

export async function changePassword(
  identifier,
  currentPassword,
  newPassword,
) {
  const normalizedIdentifier =
    normalize(identifier);

  if (!normalizedIdentifier) {
    throw new Error(
      "Identifier required.",
    );
  }

  if (!currentPassword) {
    throw new Error(
      "Current password required.",
    );
  }

  if (!newPassword) {
    throw new Error(
      "New password required.",
    );
  }

  if (
    String(newPassword).length < 8
  ) {
    throw new Error(
      "Password must be at least 8 characters.",
    );
  }

  if (
    newPassword === currentPassword
  ) {
    throw new Error(
      "New password must be different.",
    );
  }

  const users = await loadUsers();

  const userIndex =
    users.findIndex((user) => {
      return (
        normalize(user.email) ===
          normalizedIdentifier ||
        normalize(user.employeeId) ===
          normalizedIdentifier
      );
    });

  if (userIndex === -1) {
    throw new Error(
      "Account not found.",
    );
  }

  if (
    users[userIndex].password !==
    currentPassword
  ) {
    throw new Error(
      "Current password is incorrect.",
    );
  }

  users[userIndex].password =
    String(newPassword);

  await saveUsers(users);

  return true;
}

const getNextEmployeeId = (users) => {
  const highestNumber = users.reduce(
    (highest, user) => {
      const match = String(
        user.employeeId || "",
      ).match(/^EMP(\d+)$/i);

      if (!match) {
        return highest;
      }

      return Math.max(
        highest,
        Number(match[1]),
      );
    },
    0,
  );

  return `EMP${String(
    highestNumber + 1,
  ).padStart(3, "0")}`;
};

export async function createUser(
  userData,
) {
  const name = String(
    userData?.name || "",
  ).trim();

  const email = normalize(
    userData?.email,
  );

  const password = String(
    userData?.password || "",
  );

  const username = String(
    userData?.username || "",
  ).trim();

  const role = String(
    userData?.role ||
      "Support Agent",
  ).trim();

  const department = String(
    userData?.department ||
      "Customer Support",
  ).trim();

  const phone = String(
    userData?.phone || "",
  ).trim();

  if (!name) {
    throw new Error(
      "Name is required.",
    );
  }

  if (!email) {
    throw new Error(
      "Email is required.",
    );
  }

  if (
    !email.includes("@")
  ) {
    throw new Error(
      "Enter a valid email address.",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters long.",
    );
  }

  const users = await loadUsers();

  const emailExists = users.some(
    (user) =>
      normalize(user.email) === email,
  );

  if (emailExists) {
    throw new Error(
      `A user with email "${email}" already exists.`,
    );
  }

  if (username) {
    const usernameExists =
      users.some(
        (user) =>
          normalize(user.username) ===
          normalize(username),
      );

    if (usernameExists) {
      throw new Error(
        `Username "${username}" is already in use.`,
      );
    }
  }

  const newUser = {
    email,
    password,
    employeeId:
      getNextEmployeeId(users),
    name,
    username,
    role,
    department,
    phone,
    accountStatus: "Active",
    createdAt:
      new Date().toISOString(),
  };

  users.push(newUser);

  await saveUsers(users);

  return publicUser(newUser);
}

export async function adminUpdateUser(
  email,
  updates,
) {
  const normalizedEmail =
    normalize(email);

  if (!normalizedEmail) {
    throw new Error(
      "Email required.",
    );
  }

  const users = await loadUsers();

  const userIndex =
    users.findIndex(
      (user) =>
        normalize(user.email) ===
        normalizedEmail,
    );

  if (userIndex === -1) {
    throw new Error(
      `Account "${email}" not found.`,
    );
  }

  const allowedFields = [
    "name",
    "role",
    "department",
    "phone",
    "password",
    "accountStatus",
  ];

  for (
    const [field, value]
    of Object.entries(updates)
  ) {
    if (
      !allowedFields.includes(field)
    ) {
      continue;
    }

    if (field === "password") {
      if (
        !value ||
        String(value).length < 8
      ) {
        throw new Error(
          "Password must be at least 8 characters.",
        );
      }

      users[userIndex].password =
        String(value);

      continue;
    }

    const cleanValue =
      String(value || "").trim();

    if (cleanValue) {
      users[userIndex][field] =
        cleanValue;
    }
  }

  await saveUsers(users);

  return publicUser(
    users[userIndex],
  );
}
