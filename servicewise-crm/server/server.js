import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDataStore } from "./config/db.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

await connectDataStore();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (request, response) => {
  response.json({
    success: true,
    message: "Servicewise CRM API is running.",
  });
});

app.use("/api/tickets", ticketRoutes);
app.use("/api/integrations", integrationRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servicewise CRM API running on http://localhost:${port}`);
});
