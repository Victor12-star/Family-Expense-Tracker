
import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

export async function listExpenses({ userId, familyId, view }) {
    if (view === "individual") {
    return prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } });
    }
    if (!familyId) throw createError(400, "familyId required for family view", "MISSING_FAMILY");
    return prisma.expense.findMany({
    where: { familyId, OR: [{ isPrivate: false }, { isPrivate: true, userId }] },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
    });
}

export async function createExpense({ userId, familyId, data }) {
    return prisma.expense.create({ data: { ...data, userId, familyId } });
}

export async function updateExpense({ id, userId, data }) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
    if (expense.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
    return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense({ id, userId }) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw createError(404, "Expense not found", "NOT_FOUND");
    if (expense.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
    return prisma.expense.delete({ where: { id } });
}