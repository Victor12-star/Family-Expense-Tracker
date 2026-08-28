import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";
import { authorizeOwnedScopedRecord, resolveScope } from "./scope.service.js";

async function postExpenseToChat({ userId, familyId, name, amount, currency, userName }) {
  if (!familyId) return;
  try {
    await prisma.chatMessage.create({
      data: {
        userId,
        familyId,
        message: `💸 ${userName || "Someone"} added an expense: ${name} — ${Number(amount)} ${currency || ""}`.trim(),
      },
    });
  } catch (_) {
    // Chat activity is non-critical; expense creation must still succeed.
  }
}

export async function listExpenses({ userId, familyId, view }) {
  const scope = await resolveScope({ userId, familyId, view });
  if (scope.view === "single") {
    return prisma.expense.findMany({
      where: { userId, familyId: null },
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } },
    });
  }

  return prisma.expense.findMany({
    where: { familyId: scope.familyId },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function createExpense({ userId, familyId, view, shareWithChat = false, data }) {
  const scope = await resolveScope({ userId, familyId, view });
  const expense = await prisma.expense.create({
    data: {
      ...data,
      userId,
      familyId: scope.familyId,
      isPrivate: scope.view === "single" ? true : Boolean(data.isPrivate),
    },
    include: { user: { select: { name: true } } },
  });

  if (scope.view === "family" && !expense.isPrivate && shareWithChat) {
    await postExpenseToChat({
      userId,
      familyId: scope.familyId,
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      userName: expense.user?.name,
    });
  }

  return expense;
}

export async function updateExpense({ id, userId, data }) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
  await authorizeOwnedScopedRecord({ userId, familyId: expense.familyId, ownerId: expense.userId });
  return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense({ id, userId }) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
  await authorizeOwnedScopedRecord({ userId, familyId: expense.familyId, ownerId: expense.userId });
  return prisma.expense.delete({ where: { id } });
}
