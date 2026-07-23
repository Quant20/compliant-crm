import { createTicketRecord } from "../models/Ticket.js";
import { normalizeEmailPayload } from "../services/gmailService.js";
import { normalizeWhatsAppPayload } from "../services/whatsappService.js";

export async function receiveEmailTicket(request, response, next) {
  try {
    const ticketInput = normalizeEmailPayload(request.body);
    const ticket = await createTicketRecord(ticketInput);
    response.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function receiveWhatsAppTicket(request, response, next) {
  try {
    const ticketInput = normalizeWhatsAppPayload(request.body);
    const ticket = await createTicketRecord(ticketInput);
    response.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}
