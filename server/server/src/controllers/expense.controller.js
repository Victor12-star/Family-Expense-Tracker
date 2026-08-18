// =====================================================================
// Expense controller
// =====================================================================
import {
  listExpenses, createExpense, updateExpense, deleteExpense,
} from "../services/expense.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getExpenses = asyncHandler(async (req, res) => {
  const { familyId, view } = req.query;
  const expenses = await listExpenses({ userId: req.user.id, familyId, view });
  res.json(expenses);
});

export const addExpense = asyncHandler(async (req, res) => {
  const expense = await createExpense({
    userId: req.user.id,
    familyId: req.body.familyId,
    data: {
      name: req.body.name,
      amount: req.body.amount,
      currency: req.body.currency,
      category: req.body.category,
      note: req.body.note,
      date: new Date(req.body.date),
      isPrivate: req.body.isPrivate,
    },
  });
  res.status(201).json(expense);
});

export const editExpense = asyncHandler(async (req, res) => {
  const expense = await updateExpense({
    id: req.params.id,
    userId: req.user.id,
    data: {
      name: req.body.name,
      amount: req.body.amount,
      category: req.body.category,
      note: req.body.note,
      date: req.body.date ? new Date(req.body.date) : undefined,
      isPrivate: req.body.isPrivate,
    },
  });
  res.json(expense);
});

export const removeExpense = asyncHandler(async (req, res) => {
  await deleteExpense({ id: req.params.id, userId: req.user.id });
  res.status(204).end();
});
