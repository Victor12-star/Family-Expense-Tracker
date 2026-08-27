import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";
import { budgetScopeKey, normalizeCurrency } from "../utils/finance.js";
import { resolveScope } from "./scope.service.js";

function validMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month || "");
}

export async function getBudget({ userId, familyId, view, month }) {
  if (!validMonth(month)) throw createError(400, "month must be YYYY-MM", "INVALID_MONTH");
  const scope = await resolveScope({ userId, familyId, view });
  const scopeKey = budgetScopeKey({ ...scope, userId });
  return prisma.budget.findUnique({
    where: { scopeKey_month: { scopeKey, month } },
  });
}

export async function setBudget({ userId, familyId, view, month, amount, currency }) {
  if (!validMonth(month)) throw createError(400, "month must be YYYY-MM", "INVALID_MONTH");
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw createError(400, "Budget amount must be greater than 0", "INVALID_AMOUNT");
  }

  const scope = await resolveScope({ userId, familyId, view });
  const scopeKey = budgetScopeKey({ ...scope, userId });
  const resolvedCurrency = normalizeCurrency(currency);

  // The unique scope/month key makes this atomic under concurrent requests.
  return prisma.budget.upsert({
    where: { scopeKey_month: { scopeKey, month } },
    update: { amount: numericAmount, currency: resolvedCurrency },
    create: {
      scopeKey,
      userId,
      familyId: scope.familyId,
      month,
      amount: numericAmount,
      currency: resolvedCurrency,
    },
  });
}

export async function budgetSummary({ userId, familyId, view, month }) {
  const scope = await resolveScope({ userId, familyId, view });
  const budget = await getBudget({ userId, familyId, view, month });
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

  const expenseWhere = scope.view === "single"
    ? { userId, familyId: null, date: { gte: start, lt: end } }
    : { familyId: scope.familyId, date: { gte: start, lt: end } };

  const aggregate = await prisma.expense.aggregate({
    where: expenseWhere,
    _sum: { amount: true },
    _count: { _all: true },
  });

  const spent = Number(aggregate._sum.amount || 0);
  const budgetAmount = Number(budget?.amount || 0);
  return {
    budget,
    spent,
    remaining: budget ? budgetAmount - spent : null,
    percentUsed: budget && budgetAmount > 0 ? (spent / budgetAmount) * 100 : null,
    expenseCount: aggregate._count._all,
  };
}
