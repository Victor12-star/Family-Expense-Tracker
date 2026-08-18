// =====================================================================
// Expense routes — all protected (requireAuth)
// =====================================================================
import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getExpenses, addExpense, editExpense, removeExpense } from "../controllers/expense.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", getExpenses);

router.post(
  "/",
  validate([
    body("familyId").notEmpty().withMessage("familyId required"),
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("Valid amount required"),
    body("category").optional(),
    body("date").optional().isISO8601(),
  ]),
  addExpense
);

router.put("/:id", editExpense);
router.delete("/:id", removeExpense);

export default router;
