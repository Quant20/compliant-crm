import {
  Router,
} from "express";

import {
  loginHandler,
  changePasswordHandler,
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
} from "../controllers/authController.js";

import {
  requireApiKey,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/login",
  loginHandler,
);

router.post(
  "/change-password",
  changePasswordHandler,
);

router.get(
  "/users",
  requireApiKey,
  listUsersHandler,
);

router.post(
  "/users",
  requireApiKey,
  createUserHandler,
);

router.put(
  "/users/:email",
  requireApiKey,
  updateUserHandler,
);

export default router;
