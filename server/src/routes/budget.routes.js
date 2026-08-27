import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { readBudget, readBudgetSummary, upsertBudget } from "../controllers/budget.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", readBudget);
router.get("/summary", readBudgetSummary);
router.put(
  "/",
  validate([
    body("month").matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("month must be YYYY-MM"),
    body("amount").isFloat({ gt: 0 }).withMessage("Valid budget amount required"),
  ]),
  upsertBudget
);

export default router;
