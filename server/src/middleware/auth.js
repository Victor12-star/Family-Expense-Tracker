// =====================================================================
// Auth middleware — verifies JWT access token, attaches req.user
// =====================================================================
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createError } from "../utils/apiError.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createError(401, "Not authenticated", "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, env.accessTokenSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(createError(401, "Token expired", "TOKEN_EXPIRED"));
    }
    return next(createError(401, "Invalid token", "INVALID_TOKEN"));
  }
}

// Verify a refresh token (used on the refresh route)
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.refreshTokenSecret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw createError(401, "Refresh token expired", "REFRESH_EXPIRED");
    }
    throw createError(401, "Invalid refresh token", "INVALID_REFRESH");
  }
}
