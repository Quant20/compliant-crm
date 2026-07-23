import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicket,
} from "../controllers/ticketController.js";
import { requireApiKey } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/", requireApiKey, createTicket);
router.put("/:id", requireApiKey, updateTicket);
router.delete("/:id", requireApiKey, deleteTicket);

export default router;
