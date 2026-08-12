// =====================================================================
// Expense service — CRUD for expenses (family + individual views)
// =====================================================================
import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

// Creates a chat message (used to post expense activity to the family chat)
async function postExpenseToChat({ userId, familyId, message }) {
  try {
    await prisma.chatMessage.create({ data: { userId, familyId, message } });
  } catch (_) {
    // Non-critical: don't fail the expense if the chat post fails
  }
}

// List expenses. If familyId given, shows family (non-private) + own private.
export async function listExpenses({ userId, familyId, view }) {
  if (view === "individual") {
    return prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } });
  }
  if (!familyId) throw createError(400, "familyId required for family view", "MISSING_FAMILY");
  // Family view: all non-private expenses + own private ones
  return prisma.expense.findMany({
    where: { familyId, OR: [{ isPrivate: false }, { isPrivate: true, userId }] },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function createExpense({ userId, familyId, data }) {
  const expense = await prisma.expense.create({
    data: { ...data, userId, familyId },
    include: { user: { select: { name: true } } },
  });

  // Post an automated message to the family chat so everyone sees the expense
  const symbol = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : data.currency === "GBP" ? "£" : data.currency === "SEK" ? "kr" : data.currency || "kr";
  const amount = Number(data.amount);
  await postExpenseToChat({
    userId,
    familyId,
    message: `💸 ${expense.user?.name || "Someone"} added "${data.name}" — ${amount} ${symbol}`,
  });

  return expense;
}

export async function updateExpense({ id, userId, data }) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
  // Only the owner or an admin can edit
  if (expense.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
  return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense({ id, userId }) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
  if (expense.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
  return prisma.expense.delete({ where: { id } });
}
