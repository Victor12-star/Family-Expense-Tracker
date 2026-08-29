import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";
import { authorizeOwnedScopedRecord, resolveScope } from "./scope.service.js";

function reminderStorageNeedsRepair(error) {
  return error?.code === "P2021" || error?.code === "P2022";
}

function normalizeLegacyReminder(row) {
  return {
    ...row,
    category: "Other",
    remindBeforeMinutes: 0,
    sound: "soft",
    createdAt: row.createdAt || row.date,
    updatedAt: row.updatedAt || row.date,
  };
}

async function listLegacyReminders(where, order = "ASC") {
  const familyId = where.familyId ?? null;
  const rows = familyId
    ? await prisma.$queryRaw`
        SELECT "id", "familyId", "userId", "title", "date", "time", "repeat", "type", "notified"
        FROM "Reminder" WHERE "familyId" = ${familyId} ORDER BY "date" ASC, "time" ASC
      `
    : await prisma.$queryRaw`
        SELECT "id", "familyId", "userId", "title", "date", "time", "repeat", "type", "notified"
        FROM "Reminder" WHERE "userId" = ${where.userId} AND "familyId" IS NULL ORDER BY "date" ASC, "time" ASC
      `;
  return rows.map(normalizeLegacyReminder);
}

export async function listScopedReminders({ userId, view, familyId }) {
  const scope = await resolveScope({ userId, view, familyId });
  const where = scope.view === "single"
    ? { userId, familyId: null }
    : { familyId: scope.familyId };
  try {
    return await prisma.reminder.findMany({ where, orderBy: [{ date: "asc" }, { time: "asc" }] });
  } catch (error) {
    if (!reminderStorageNeedsRepair(error)) throw error;
    return listLegacyReminders(where);
  }
}

export async function createScopedReminder({ userId, view, familyId, data }) {
  const scope = await resolveScope({ userId, view, familyId });
  const reminderData = {
    userId,
    familyId: scope.familyId,
    title: data.title,
    date: new Date(data.date),
    time: data.time || null,
    repeat: data.repeat || "NONE",
    type: data.type || "REMINDER",
    category: data.category || "Other",
    remindBeforeMinutes: Number(data.remindBeforeMinutes || 0),
    sound: data.sound || "soft",
  };
  try {
    return await prisma.reminder.create({ data: reminderData });
  } catch (error) {
    if (!reminderStorageNeedsRepair(error) || !scope.familyId) throw error;
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Reminder" ("id", "familyId", "userId", "title", "date", "time", "repeat", "type", "notified")
      VALUES (${id}, ${scope.familyId}, ${userId}, ${reminderData.title}, ${reminderData.date}, ${reminderData.time}, ${reminderData.repeat}, ${reminderData.type}, false)
    `;
    return normalizeLegacyReminder({ id, ...reminderData, category: "Other", remindBeforeMinutes: 0, sound: "soft", notified: false });
  }
}

export async function updateReminder({ id, userId, data }) {
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder) throw createError(404, "Reminder not found", "NOT_FOUND");
  await authorizeOwnedScopedRecord({ userId, familyId: reminder.familyId, ownerId: reminder.userId });
  return prisma.reminder.update({
    where: { id },
    data: {
      title: data.title,
      date: data.date ? new Date(data.date) : undefined,
      time: data.time,
      repeat: data.repeat,
      type: data.type,
      category: data.category,
      remindBeforeMinutes: data.remindBeforeMinutes == null ? undefined : Number(data.remindBeforeMinutes),
      sound: data.sound,
    },
  });
}

export async function deleteReminder({ id, userId }) {
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder) throw createError(404, "Reminder not found", "NOT_FOUND");
  await authorizeOwnedScopedRecord({ userId, familyId: reminder.familyId, ownerId: reminder.userId });
  return prisma.reminder.delete({ where: { id } });
}

export async function clearOwnedReminders({ userId, view, familyId }) {
  const scope = await resolveScope({ userId, view, familyId });
  const where = scope.view === "single"
    ? { userId, familyId: null }
    : { userId, familyId: scope.familyId };
  return prisma.reminder.deleteMany({ where });
}

// Legacy family endpoints retained during staged migration.
export async function listReminders(familyId) {
  try {
    return await prisma.reminder.findMany({ where: { familyId }, orderBy: [{ date: "asc" }, { time: "asc" }] });
  } catch (error) {
    if (!reminderStorageNeedsRepair(error)) throw error;
    return listLegacyReminders({ familyId });
  }
}
export async function createReminder({ userId, familyId, data }) {
  return createScopedReminder({ userId, view: "family", familyId, data });
}
