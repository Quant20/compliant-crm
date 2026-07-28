import { createTicketRecord } from "../models/Ticket.js";
import { createCalendarMeeting } from "../services/googleCalendarService.js";
import { generateGeminiDraft } from "../services/geminiService.js";

export async function receiveEmailTicket(
  req,
  res,
  next,
) {
  try {
    const senderName =
      req.body.senderName ||
      req.body.fromName ||
      "Email";

    const senderEmail =
      req.body.senderEmail ||
      req.body.from ||
      "";

    const subject =
      req.body.subject ||
      "Email";

    const message =
      req.body.message ||
      req.body.body ||
      req.body.text ||
      "";

    if (!String(message).trim()) {
      res.status(400);
      throw new Error("Message required.");
    }

    const ticket = await createTicketRecord({
      customerName: senderName,
      customerEmail: senderEmail,
      customerPhone: "",
      subject,
      description: message,
      channel: "Email",
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function receiveWhatsAppTicket(
  req,
  res,
  next,
) {
  try {
    const customerName =
      req.body.customerName ||
      req.body.profileName ||
      "WhatsApp";

    const customerPhone =
      req.body.customerPhone ||
      req.body.from ||
      "";

    const message =
      req.body.message ||
      req.body.text ||
      "";

    if (!String(message).trim()) {
      res.status(400);
      throw new Error("Message required.");
    }

    const ticket = await createTicketRecord({
      customerName,
      customerEmail: "",
      customerPhone,
      subject:
        req.body.subject ||
        "WhatsApp",
      description: message,
      channel: "WhatsApp",
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function scheduleCalendarMeeting(
  req,
  res,
  next,
) {
  try {
    const meeting =
      await createCalendarMeeting(req.body);

    res.status(201).json({
      success: true,
      data: meeting,
      message:
        "Meeting added to Google Calendar and invitations sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function createAiDraft(
  req,
  res,
  next,
) {
  try {
    const type =
      req.body.type === "email"
        ? "email"
        : "internal_note";

    const instruction = String(
      req.body.instruction || "",
    ).trim();

    if (!instruction) {
      res.status(400);
      throw new Error(
        "A writing instruction is required.",
      );
    }

    const result =
      await generateGeminiDraft({
        ...req.body,
        type,
        instruction,
      });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
