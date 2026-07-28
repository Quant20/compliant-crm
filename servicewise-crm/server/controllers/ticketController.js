import { createTicketRecord, findTicketById, listTickets, removeTicket, updateTicketRecord } from "../models/Ticket.js";
export async function getTickets(req, res, next) { try { res.json({ success: true, data: await listTickets() }); } catch(e) { next(e); } }
export async function getTicketById(req, res, next) { try { const t = await findTicketById(req.params.id); if (!t) { res.status(404); throw new Error("Not found."); } res.json({ success: true, data: t }); } catch(e) { next(e); } }
export async function createTicket(req, res, next) { try { res.status(201).json({ success: true, data: await createTicketRecord(req.body) }); } catch(e) { next(e); } }
export async function updateTicket(req, res, next) { try { const t = await updateTicketRecord(req.params.id, req.body); if (!t) { res.status(404); throw new Error("Not found."); } res.json({ success: true, data: t }); } catch(e) { next(e); } }
export async function deleteTicket(req, res, next) { try { if (!(await removeTicket(req.params.id))) { res.status(404); throw new Error("Not found."); } res.json({ success: true, message: "Deleted." }); } catch(e) { next(e); } }
