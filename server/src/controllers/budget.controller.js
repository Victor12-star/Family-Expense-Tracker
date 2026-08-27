import { asyncHandler } from "../utils/asyncHandler.js";
import { budgetSummary, getBudget, setBudget } from "../services/budget.service.js";

export const readBudget = asyncHandler(async (req, res) => {
  const budget = await getBudget({
    userId: req.user.id,
    familyId: req.query.familyId,
    view: req.query.view,
    month: req.query.month,
  });
  res.json(budget);
});

export const upsertBudget = asyncHandler(async (req, res) => {
  const budget = await setBudget({
    userId: req.user.id,
    familyId: req.body.familyId,
    view: req.body.view,
    month: req.body.month,
    amount: req.body.amount,
    currency: req.body.currency,
  });
  res.json(budget);
});

export const readBudgetSummary = asyncHandler(async (req, res) => {
  const summary = await budgetSummary({
    userId: req.user.id,
    familyId: req.query.familyId,
    view: req.query.view,
    month: req.query.month,
  });
  res.json(summary);
});
