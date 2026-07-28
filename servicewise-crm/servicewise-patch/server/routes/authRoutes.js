import { Router } from "express";
import {
  loginHandler,
  changePasswordHandler,
  listUsersHandler,
  updateUserHandler,
  createUserHandler,
} from "../controllers/authController.js";
import { requireApiKey } from "../middleware/authMiddleware.js";

const router = Router();

// Public — login
router.post("/login", loginHandler);

// Self-service — change own password
router.post("/change-password", changePasswordHandler);

// Admin — list all users (requires API key)
router.get("/users", requireApiKey, listUsersHandler);

// Admin — create a new user (requires API key)
router.post("/users", requireApiKey, createUserHandler);

// Admin — update user profile or reset password (requires API key)
router.put("/users/:email", requireApiKey, updateUserHandler);

export default router;
