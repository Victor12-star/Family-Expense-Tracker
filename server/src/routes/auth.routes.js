// =====================================================================
// Auth routes
// =====================================================================
import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/security.js";
import { requireAuth } from "../middleware/auth.js";
import { register, login, refresh, logout, me, removeAccount } from "../controllers/auth.controller.js";

const router = Router();
router.use(authLimiter);

router.post(
  "/register",
  validate([
    body("name").trim().isLength({ min: 1, max: 60 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8, max: 72 }).withMessage("Password must be 8-72 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password needs upper, lower and a number"),
  ]),
  register
);

router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login
);

router.post(
  "/refresh",
  validate([body("refreshToken").notEmpty().withMessage("Refresh token required")]),
  refresh
);

router.post(
  "/logout",
  validate([body("refreshToken").notEmpty().withMessage("Refresh token required")]),
  logout
);

router.get("/me", requireAuth, me);
router.delete(
  "/account",
  requireAuth,
  validate([body("password").isString().notEmpty().withMessage("Password is required")]),
  removeAccount
);

export default router;
