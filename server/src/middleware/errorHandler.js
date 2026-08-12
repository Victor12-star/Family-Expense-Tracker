// =====================================================================
// Central error handler — safe, consistent responses, no info leaks
// =====================================================================
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, "Route not found", "NOT_FOUND"));
}

export function errorHandler(err, _req, res, _next) {
  if (!(err instanceof ApiError)) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack });
  }

  const status = err.status || 500;
  const message = status >= 500 ? "Internal server error" : err.message;
  const isDev = (process.env.NODE_ENV || "development") !== "production";

  const body = { status, code: err.code || "ERROR" };
  if (isDev) body.message = err.message;
  else body.message = message;
  if (err.details) body.details = err.details;

  res.status(status).json(body);
}
