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

export function corsPolicy() {
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = env.clientUrl.split(",").map((s) => s.trim());
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
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