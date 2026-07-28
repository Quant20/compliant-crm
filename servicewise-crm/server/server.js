import { config } from "dotenv"; config({ path: new URL("../server/.env", import.meta.url).pathname });; import cors from "cors"; import express from "express"; import { connectDataStore } from "./config/db.js"; import ticketRoutes from "./routes/ticketRoutes.js"; import integrationRoutes from "./routes/integrationRoutes.js"; import authRoutes from "./routes/authRoutes.js"; import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
const app = express(); const port = Number(process.env.PORT) || 5000;
await connectDataStore();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5174" })); app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (req, res) => { res.json({ success: true, message: "CRM API running.", timestamp: new Date().toISOString() }); });
app.use("/api/auth", authRoutes); app.use("/api/tickets", ticketRoutes); app.use("/api/integrations", integrationRoutes);
app.use(notFound); app.use(errorHandler);
app.listen(port, () => { console.log("CRM API on http://localhost:" + port); });
