import { Router } from "express";
import { body, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { readBudget, readBudgetSummary, upsertBudget } from "../controllers/budget.controller.js";

const router = Router();
router.use(requireAuth);

const queryValidation = [
  query("view").isIn(["family", "single"]),
  query("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
  query("month").matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("month must be YYYY-MM"),
];

router.get("/", validate(queryValidation), readBudget);
router.get("/summary", validate(queryValidation), readBudgetSummary);
router.put(
  "/",
  validate([
    body("view").isIn(["family", "single"]),
    body("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
    body("month").matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("month must be YYYY-MM"),
    body("amount").isFloat({ gt: 0, max: 9999999999.99 }).withMessage("Valid budget amount required"),
    body("currency").isString().matches(/^[A-Z]{3}$/),
  ]),
  upsertBudget
);

export default router;
