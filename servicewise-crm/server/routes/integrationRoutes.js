import { Router } from "express";

import {
  createAiDraft,
  receiveEmailTicket,
  receiveWhatsAppTicket,
  scheduleCalendarMeeting,
} from "../controllers/integrationController.js";

import {
  requireApiKey,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/email/import",
  requireApiKey,
  receiveEmailTicket,
);

router.post(
  "/whatsapp/webhook",
  requireApiKey,
  receiveWhatsAppTicket,
);

router.post(
  "/calendar/meetings",
  scheduleCalendarMeeting,
);

router.post(
  "/ai/draft",
  createAiDraft,
);

export default router;
