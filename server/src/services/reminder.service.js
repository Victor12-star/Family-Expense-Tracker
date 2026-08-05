import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

export async function listReminders(familyId) {
    return prisma.reminder.findMany({ where: { familyId }, orderBy: { date: "asc" } });
}

export async function createReminder({ userId, familyId, data }) {
    return prisma.reminder.create({ data: { ...data, userId, familyId } });
}

export async function updateReminder({ id, userId, data }) {
    const rem = await prisma.reminder.findUnique({ where: { id } });
    if (!rem) throw createError(404, "Reminder not found", "NOT_FOUND");
    if (rem.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
    return prisma.reminder.update({ where: { id }, data });
}

export async function deleteReminder({ id, userId }) {
    const rem = await prisma.reminder.findUnique({ where: { id } });
    if (!rem) throw createError(404, "Reminder not found", "NOT_FOUND");
    if (rem.userId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
    return prisma.reminder.delete({ where: { id } });
}