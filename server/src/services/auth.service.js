// =====================================================================
// Auth service — registration, login, refresh, logout
// Security: bcrypt hashing, refresh token hashing & rotation, generic errors
// =====================================================================
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";
import { signAccessToken, signRefreshToken, hashToken } from "./token.service.js";

const GENERIC_LOGIN_ERROR = "Invalid email or password";

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw createError(409, "An account with this email already exists", "EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash },
  });

  return issueTokens(user);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError(401, GENERIC_LOGIN_ERROR, "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError(401, GENERIC_LOGIN_ERROR, "INVALID_CREDENTIALS");

  return issueTokens(user);
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Store only the SHA-256 hash of the refresh token (leak-resilient)
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(rawToken) {
  const hash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.revoked) throw createError(401, "Invalid refresh token", "INVALID_REFRESH");
  if (stored.expiresAt < new Date()) throw createError(401, "Refresh token expired", "REFRESH_EXPIRED");

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw createError(401, "User no longer exists", "USER_NOT_FOUND");

  // Rotation: revoke old token, issue new one (detects reuse)
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokens(user);
}

export async function logoutUser(rawToken) {
  if (!rawToken) return;
  const hash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revoked: true } });
}
