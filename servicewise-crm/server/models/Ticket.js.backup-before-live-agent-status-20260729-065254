import {
  randomUUID,
} from "node:crypto";

import {
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  ticketsFile,
  usersFile,
} from "../config/db.js";

const ACTIVE_TICKET_STATUSES = new Set([
  "open",
  "in progress",
  "pending",
]);

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function readTickets() {
  const raw = await readFile(
    ticketsFile,
    "utf8",
  );

  const parsed = JSON.parse(raw);

  return Array.isArray(parsed)
    ? parsed
    : [];
}

async function writeTickets(tickets) {
  await writeFile(
    ticketsFile,
    JSON.stringify(
      tickets,
      null,
      2,
    ),
    "utf8",
  );
}

async function readUsers() {
  try {
    const raw = await readFile(
      usersFile,
      "utf8",
    );

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.users)) {
      return parsed.users;
    }

    return [];
  } catch (error) {
    console.error(
      "Unable to read users for assignment:",
      error,
    );

    return [];
  }
}

function validate(input, partial = false) {
  if (partial) {
    return;
  }

  [
    "customerName",
    "subject",
    "description",
  ].forEach((field) => {
    if (!String(input[field] || "").trim()) {
      const error = new Error(
        `${field} required`,
      );

      error.statusCode = 400;
      throw error;
    }
  });
}

function isAgentEligible(agent) {
  const role = normalize(agent?.role);

  const accountStatus = normalize(
    agent?.accountStatus ||
      agent?.account_status ||
      "active",
  );

  const availabilityStatus = normalize(
    agent?.status ||
      "available",
  );

  const explicitlyNotAssignable =
    agent?.isAssignable === false;

  return (
    role === "support agent" &&
    ![
      "inactive",
      "suspended",
      "disabled",
    ].includes(accountStatus) &&
    availabilityStatus !== "offline" &&
    !explicitlyNotAssignable
  );
}

function getAgentTicketCount(
  agent,
  tickets,
) {
  const agentName = normalize(
    agent?.name,
  );

  return tickets.filter((ticket) => {
    const assignedAgent = normalize(
      ticket.assignedAgent ||
        ticket.assignedAgentName ||
        ticket.assigned_agent_name,
    );

    const ticketStatus = normalize(
      ticket.status,
    );

    return (
      assignedAgent === agentName &&
      ACTIVE_TICKET_STATUSES.has(
        ticketStatus,
      )
    );
  }).length;
}

function selectLeastLoadedAgent(
  users,
  tickets,
) {
  const eligibleAgents = users
    .filter(isAgentEligible)
    .map((agent) => {
      const activeTickets =
        getAgentTicketCount(
          agent,
          tickets,
        );

      const capacity = Number(
        agent.ticketCapacity ||
          agent.ticket_capacity ||
          10,
      );

      return {
        ...agent,
        activeTickets,
        capacity:
          Number.isFinite(capacity) &&
          capacity > 0
            ? capacity
            : 10,
      };
    })
    .filter(
      (agent) =>
        agent.activeTickets <
        agent.capacity,
    )
    .sort((first, second) => {
      if (
        first.activeTickets !==
        second.activeTickets
      ) {
        return (
          first.activeTickets -
          second.activeTickets
        );
      }

      return String(
        first.name || "",
      ).localeCompare(
        String(
          second.name || "",
        ),
      );
    });

  return eligibleAgents[0] || null;
}

export async function listTickets() {
  const tickets =
    await readTickets();

  return tickets.sort(
    (first, second) =>
      new Date(second.updatedAt) -
      new Date(first.updatedAt),
  );
}

export async function findTicketById(id) {
  const tickets =
    await readTickets();

  return (
    tickets.find(
      (ticket) =>
        String(ticket.id) ===
        String(id),
    ) || null
  );
}

export async function createTicketRecord(
  input,
) {
  validate(input);

  const now =
    new Date().toISOString();

  const tickets =
    await readTickets();

  const users =
    await readUsers();

  const requestedAgent =
    String(
      input.assignedAgent ||
        input.assignedAgentName ||
        input.assigned_agent_name ||
        "",
    ).trim();

  const manuallySelectedAgent =
    normalize(requestedAgent) ===
    "unassigned"
      ? ""
      : requestedAgent;

  const automaticallySelectedAgent =
    manuallySelectedAgent
      ? null
      : selectLeastLoadedAgent(
          users,
          tickets,
        );

  const assignedAgent =
    manuallySelectedAgent ||
    automaticallySelectedAgent?.name ||
    "Unassigned";

  const assignmentType =
    manuallySelectedAgent
      ? "manual"
      : automaticallySelectedAgent
        ? "automatic"
        : "unassigned";

  const history = [
    {
      id: randomUUID(),
      message: "Ticket created",
      createdAt: now,
    },
  ];

  if (assignmentType === "automatic") {
    history.push({
      id: randomUUID(),
      message:
        `Ticket automatically assigned to ${assignedAgent}`,
      createdAt: now,
    });
  } else if (
    assignmentType === "manual"
  ) {
    history.push({
      id: randomUUID(),
      message:
        `Ticket assigned to ${assignedAgent}`,
      createdAt: now,
    });
  } else {
    history.push({
      id: randomUUID(),
      message:
        "Ticket left unassigned because no eligible agent was available",
      createdAt: now,
    });
  }

  const ticket = {
    id: randomUUID(),

    ticketNumber:
      `TKT-${Date.now()
        .toString()
        .slice(-6)}`,

    customerName:
      String(
        input.customerName,
      ).trim(),

    customerEmail:
      String(
        input.customerEmail || "",
      ).trim(),

    customerPhone:
      String(
        input.customerPhone || "",
      ).trim(),

    subject:
      String(
        input.subject,
      ).trim(),

    description:
      String(
        input.description,
      ).trim(),

    department:
      input.department ||
      "Customer Support",

    priority:
      input.priority ||
      "Medium",

    status:
      input.status ||
      "Open",

    assignedAgent,

    assignedAgentName:
      assignedAgent,

    assigned_agent_name:
      assignedAgent,

    assignmentType,

    category:
      input.category ||
      "General",

    channel:
      input.channel ||
      "Manual",

    createdAt: now,
    updatedAt: now,

    conversations: [],
    notes: [],
    activities: [],

    history,
  };

  tickets.unshift(ticket);

  await writeTickets(tickets);

  return ticket;
}

export async function updateTicketRecord(
  id,
  changes,
) {
  validate(changes, true);

  const tickets =
    await readTickets();

  const index =
    tickets.findIndex(
      (ticket) =>
        String(ticket.id) ===
        String(id),
    );

  if (index === -1) {
    return null;
  }

  const currentTicket =
    tickets[index];

  const now =
    new Date().toISOString();

  const historyMessages = [];

  if (
    changes.status &&
    changes.status !==
      currentTicket.status
  ) {
    historyMessages.push(
      `Status: ${currentTicket.status} -> ${changes.status}`,
    );
  }

  if (
    changes.priority &&
    changes.priority !==
      currentTicket.priority
  ) {
    historyMessages.push(
      `Priority: ${currentTicket.priority} -> ${changes.priority}`,
    );
  }

  const nextAssignedAgent =
    changes.assignedAgent ||
    changes.assignedAgentName ||
    changes.assigned_agent_name;

  const currentAssignedAgent =
    currentTicket.assignedAgent ||
    currentTicket.assignedAgentName ||
    currentTicket.assigned_agent_name ||
    "Unassigned";

  if (
    nextAssignedAgent &&
    nextAssignedAgent !==
      currentAssignedAgent
  ) {
    historyMessages.push(
      nextAssignedAgent ===
        "Unassigned"
        ? "Ticket unassigned"
        : `Ticket assigned to ${nextAssignedAgent}`,
    );
  }

  tickets[index] = {
    ...currentTicket,
    ...changes,

    id: currentTicket.id,

    ticketNumber:
      currentTicket.ticketNumber,

    createdAt:
      currentTicket.createdAt,

    updatedAt: now,

    history: [
      ...(currentTicket.history || []),

      ...(historyMessages.length
        ? historyMessages
        : ["Ticket updated"]
      ).map((message) => ({
        id: randomUUID(),
        message,
        createdAt: now,
      })),
    ],
  };

  await writeTickets(tickets);

  return tickets[index];
}

export async function removeTicket(id) {
  const tickets =
    await readTickets();

  const filtered =
    tickets.filter(
      (ticket) =>
        String(ticket.id) !==
        String(id),
    );

  if (
    filtered.length ===
    tickets.length
  ) {
    return false;
  }

  await writeTickets(filtered);

  return true;
}
