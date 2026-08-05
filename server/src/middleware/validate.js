import { validationResult } from "express-validator";
import { createError } from "../utils/apiError.js";

export function validate(schema) {
  return [
    ...schema,
    (req, _res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
        return next(createError(400, "Validation failed", "VALIDATION_ERROR", details));
      }
      return next();
    },
  ];
}