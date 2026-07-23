import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { ticketsFile } from "../config/db.js";

async function readTickets() {
  const raw = await readFile(ticketsFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTickets(tickets) {
  await writeFile(ticketsFile, JSON.stringify(tickets, null, 2), "utf8");
}

function validateTicketInput(input, partial = false) {
  const requiredFields = ["customerName", "subject", "description"];

  if (!partial) {
    requiredFields.forEach((field) => {
      if (!String(input[field] || "").trim()) {
        const error = new Error(`${field} is required.`);
        error.statusCode = 400;
        throw error;
      }
    });
  }
}

function buildTicketNumber() {
  return `TKT-${Date.now().toString().slice(-6)}`;
}

export async function listTickets() {
  const tickets = await readTickets();
  return tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function findTicketById(ticketId) {
  const tickets = await readTickets();
  return tickets.find((ticket) => ticket.id === ticketId) || null;
}

export async function createTicketRecord(input) {
  validateTicketInput(input);

  const now = new Date().toISOString();
  const ticket = {
    id: randomUUID(),
    ticketNumber: buildTicketNumber(),
    customerName: String(input.customerName).trim(),
    customerEmail: String(input.customerEmail || "").trim(),
    customerPhone: String(input.customerPhone || "").trim(),
    subject: String(input.subject).trim(),
    description: String(input.description).trim(),
    department: input.department || "Customer Support",
    priority: input.priority || "Medium",
    status: input.status || "Open",
    assignedAgent: input.assignedAgent || "",
    category: input.category || "General",
    channel: input.channel || "Manual",
    createdAt: now,
    updatedAt: now,
    conversations: [],
    notes: [],
    history: [
      {
        id: randomUUID(),
        message: `Ticket created through ${input.channel || "Manual"}`,
        createdAt: now,
      },
    ],
  };

  const tickets = await readTickets();
  tickets.unshift(ticket);
  await writeTickets(tickets);

  return ticket;
}

export async function updateTicketRecord(ticketId, changes) {
  validateTicketInput(changes, true);

  const tickets = await readTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);

  if (index === -1) {
    return null;
  }

  const current = tickets[index];
  const now = new Date().toISOString();
  const messages = [];

  if (changes.status && changes.status !== current.status) {
    messages.push(`Status changed from ${current.status} to ${changes.status}`);
  }

  if (changes.priority && changes.priority !== current.priority) {
    messages.push(`Priority changed from ${current.priority} to ${changes.priority}`);
  }

  if (
    Object.prototype.hasOwnProperty.call(changes, "assignedAgent") &&
    changes.assignedAgent !== current.assignedAgent
  ) {
    messages.push(
      changes.assignedAgent
        ? `Ticket assigned to ${changes.assignedAgent}`
        : "Ticket was unassigned"
    );
  }

  const updated = {
    ...current,
    ...changes,
    id: current.id,
    ticketNumber: current.ticketNumber,
    createdAt: current.createdAt,
    updatedAt: now,
    history: [
      ...(current.history || []),
      ...(messages.length ? messages : ["Ticket details updated"]).map((message) => ({
        id: randomUUID(),
        message,
        createdAt: now,
      })),
    ],
  };

  tickets[index] = updated;
  await writeTickets(tickets);

  return updated;
}

export async function removeTicket(ticketId) {
  const tickets = await readTickets();
  const filtered = tickets.filter((ticket) => ticket.id !== ticketId);

  if (filtered.length === tickets.length) {
    return false;
  }

  await writeTickets(filtered);
  return true;
}
