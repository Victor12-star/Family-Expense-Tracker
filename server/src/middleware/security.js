import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: env.isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
  });
}

const configuredOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Vercel gives every Preview deployment a new hostname. This expression is
// deliberately restricted to this project and account; it does not trust all
// vercel.app websites.
const projectPreviewOrigin = /^https:\/\/family-expense-tracker(?:-[a-z0-9-]+)?-victor-0ede\.vercel\.app$/i;

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  return configuredOrigins.includes(normalized) || projectPreviewOrigin.test(normalized);
}

export function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) return callback(null, true);
  return callback(new Error("This website is not allowed to access the API"));
}

export function corsPolicy() {
  return cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

export const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: "Too many requests, please slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: "Too many auth attempts, try again later." },
});
