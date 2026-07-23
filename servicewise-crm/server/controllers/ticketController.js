import {
  createTicketRecord,
  findTicketById,
  listTickets,
  removeTicket,
  updateTicketRecord,
} from "../models/Ticket.js";

export async function getTickets(request, response, next) {
  try {
    const tickets = await listTickets();
    response.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
}

export async function getTicketById(request, response, next) {
  try {
    const ticket = await findTicketById(request.params.id);

    if (!ticket) {
      response.status(404);
      throw new Error("Ticket not found.");
    }

    response.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(request, response, next) {
  try {
    const ticket = await createTicketRecord(request.body);
    response.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(request, response, next) {
  try {
    const ticket = await updateTicketRecord(request.params.id, request.body);

    if (!ticket) {
      response.status(404);
      throw new Error("Ticket not found.");
    }

    response.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(request, response, next) {
  try {
    const removed = await removeTicket(request.params.id);

    if (!removed) {
      response.status(404);
      throw new Error("Ticket not found.");
    }

    response.json({ success: true, message: "Ticket deleted." });
  } catch (error) {
    next(error);
  }
}
