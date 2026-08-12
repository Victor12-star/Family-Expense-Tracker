// =====================================================================
// Async handler — wraps async controllers so errors go to the
// central error handler (no need for try/catch in every controller)
// =====================================================================
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
