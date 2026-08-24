// =====================================================================
// Express app — wires middleware, routes, error handling
// =====================================================================
import express from "express";
import { securityHeaders, corsPolicy, globalLimiter } from "./middleware/security.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import familyRoutes from "./routes/family.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import shoppingRoutes from "./routes/shopping.routes.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
app.set("trust proxy", 1);

app.use(securityHeaders());
app.use(corsPolicy());
app.use(globalLimiter);
// Allow larger request bodies so photos (base64 images) and voice recordings can
// be uploaded through chat. The default (100kb) is too small for a photo.
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", shoppingRoutes);

// 404 + errors (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
