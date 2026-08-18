// =====================================================================
// Token service — issues access & refresh JWTs
// =====================================================================
import jwt from "jsonwebtoken";
import { randomUUID, createHash } from "node:crypto";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { email: user.email },
    env.accessTokenSecret,
    {
      subject: String(user.id),
      expiresIn: env.accessTokenTtl,
      issuer: "family-expense-tracker",
      audience: env.clientUrl,
      jwtid: randomUUID(),
    }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { type: "refresh" },
    env.refreshTokenSecret,
    {
      subject: String(user.id),
      expiresIn: `${env.refreshTokenTtlDays}d`,
      issuer: "family-expense-tracker",
      audience: env.clientUrl,
      jwtid: randomUUID(),
    }
  );
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
