// =====================================================================
// Consistent API error shape — never leaks internals to clients
// =====================================================================
export class ApiError extends Error {
  constructor(status, message, code = undefined, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (status, message, code, details) =>
  new ApiError(status, message, code, details);
