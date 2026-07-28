import users from "../data/users";

const AGENTS_STORAGE_KEY =
  "servicewise_agents";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getSeedAgents() {
  return users
    .filter(
      (user) =>
        normalize(user.role) !== "admin",
    )
    .map((user) => ({
      ...user,
      role:
        user.role ||
        user.designation ||
        "Support Agent",
      designation:
        user.designation ||
        user.role ||
        "Support Agent",
      department:
        user.department ||
        user.team ||
        "Customer Support",
      team:
        user.team ||
        user.department ||
        "Customer Support",
      status: user.status || "Available",
      accountStatus:
        user.accountStatus || "Active",
      ticketCapacity: Number(
        user.ticketCapacity || 10,
      ),
      isAssignable:
        user.isAssignable !== false,
    }));
}

function cleanLegacyTicketAssignments() {
  try {
    for (
      let index = 0;
      index < window.localStorage.length;
      index += 1
    ) {
      const key =
        window.localStorage.key(index);

      if (
        !key ||
        !normalize(key).includes("ticket")
      ) {
        continue;
      }

      const storedValue =
        window.localStorage.getItem(key);

      if (
        !storedValue ||
        !storedValue.includes("Usman Ali")
      ) {
        continue;
      }

      window.localStorage.setItem(
        key,
        storedValue.replaceAll(
          "Usman Ali",
          "Unassigned",
        ),
      );
    }
  } catch (error) {
    console.error(
      "Unable to clean old agent assignments:",
      error,
    );
  }
}

function saveAgents(agents) {
  window.localStorage.setItem(
    AGENTS_STORAGE_KEY,
    JSON.stringify(agents),
  );

  return agents;
}

function createEmployeeId(agents) {
  const highestNumber = agents.reduce(
    (highest, agent) => {
      const match = String(
        agent.employeeId ||
          agent.employee_id ||
          "",
      ).match(/\d+/);

      const currentNumber = match
        ? Number(match[0])
        : 0;

      return Math.max(
        highest,
        currentNumber,
      );
    },
    0,
  );

  return `EMP${String(
    highestNumber + 1,
  ).padStart(3, "0")}`;
}

export function getAgents() {
  cleanLegacyTicketAssignments();

  try {
    const stored =
      window.localStorage.getItem(
        AGENTS_STORAGE_KEY,
      );

    if (!stored) {
      return saveAgents(getSeedAgents());
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return saveAgents(getSeedAgents());
    }

    const cleanedAgents = parsed.filter(
      (agent) => {
        const fullName = [
          agent.firstName,
          agent.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          normalize(agent.role) !== "admin" &&
          normalize(agent.name) !==
            "usman ali" &&
          normalize(fullName) !==
            "usman ali"
        );
      },
    );

    if (
      cleanedAgents.length !==
      parsed.length
    ) {
      saveAgents(cleanedAgents);
    }

    return cleanedAgents;
  } catch {
    return getSeedAgents();
  }
}

export function addAgent(formData) {
  const agents = getAgents();

  const duplicateEmail = agents.some(
    (agent) =>
      normalize(agent.email) ===
      normalize(formData.email),
  );

  if (duplicateEmail) {
    throw new Error(
      "An agent with this email already exists.",
    );
  }

  const employeeId =
    formData.employeeId?.trim() ||
    createEmployeeId(agents);

  const newAgent = {
    id: `agent-${Date.now()}`,
    employeeId,
    employee_id: employeeId,
    name: formData.name.trim(),
    firstName:
      formData.name.trim().split(" ")[0] ||
      "",
    lastName:
      formData.name
        .trim()
        .split(" ")
        .slice(1)
        .join(" "),
    username:
      formData.username?.trim() ||
      formData.email
        .trim()
        .split("@")[0],
    email: formData.email.trim(),
    phone: formData.phone?.trim() || "",
    department:
      formData.department.trim(),
    team: formData.department.trim(),
    designation:
      formData.role.trim(),
    role: formData.role.trim(),
    accountStatus:
      formData.accountStatus,
    account_status:
      formData.accountStatus,
    emailVerified: false,
    twoFactorEnabled: false,
    shiftStartTime:
      formData.shiftStartTime,
    shiftEndTime:
      formData.shiftEndTime,
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
    ticketCapacity: Number(
      formData.ticketCapacity || 10,
    ),
    isAssignable:
      formData.accountStatus === "Active",
    status: formData.status,
  };

  saveAgents([...agents, newAgent]);

  return newAgent;
}

export function updateAgent(
  agentId,
  formData,
) {
  const agents = getAgents();

  const duplicateEmail = agents.some(
    (agent) =>
      String(agent.id) !==
        String(agentId) &&
      normalize(agent.email) ===
        normalize(formData.email),
  );

  if (duplicateEmail) {
    throw new Error(
      "Another agent already uses this email.",
    );
  }

  let updatedAgent = null;

  const updatedAgents = agents.map(
    (agent) => {
      if (
        String(agent.id) !==
        String(agentId)
      ) {
        return agent;
      }

      updatedAgent = {
        ...agent,
        employeeId:
          formData.employeeId.trim(),
        employee_id:
          formData.employeeId.trim(),
        name: formData.name.trim(),
        firstName:
          formData.name
            .trim()
            .split(" ")[0] || "",
        lastName:
          formData.name
            .trim()
            .split(" ")
            .slice(1)
            .join(" "),
        username:
          formData.username?.trim() ||
          agent.username,
        email: formData.email.trim(),
        phone: formData.phone?.trim() || "",
        department:
          formData.department.trim(),
        team: formData.department.trim(),
        designation:
          formData.role.trim(),
        role: formData.role.trim(),
        accountStatus:
          formData.accountStatus,
        account_status:
          formData.accountStatus,
        shiftStartTime:
          formData.shiftStartTime,
        shiftEndTime:
          formData.shiftEndTime,
        ticketCapacity: Number(
          formData.ticketCapacity || 10,
        ),
        isAssignable:
          formData.accountStatus ===
          "Active",
        status: formData.status,
      };

      return updatedAgent;
    },
  );

  if (!updatedAgent) {
    throw new Error(
      "The selected agent could not be found.",
    );
  }

  saveAgents(updatedAgents);

  return updatedAgent;
}

export function updateAgentStatus(
  agentId,
  status,
) {
  const agents = getAgents();

  const updatedAgents = agents.map(
    (agent) =>
      String(agent.id) ===
      String(agentId)
        ? {
            ...agent,
            status,
          }
        : agent,
  );

  saveAgents(updatedAgents);

  return updatedAgents;
}
