import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";
import { normalizeCurrency, shoppingLineEstimate } from "../utils/finance.js";
import { authorizeOwnedScopedRecord, resolveScope } from "./scope.service.js";

function scopeWhere(scope, userId) {
  return scope.view === "single" ? { userId, familyId: null } : { familyId: scope.familyId };
}

export async function listShoppingScoped({ userId, familyId, view }) {
  const scope = await resolveScope({ userId, familyId, view });
  return prisma.shoppingItem.findMany({
    where: { ...scopeWhere(scope, userId), tripId: null },
    orderBy: [{ done: "asc" }, { createdAt: "asc" }],
  });
}

export async function createShoppingItemScoped({ userId, familyId, view, data }) {
  const scope = await resolveScope({ userId, familyId, view });
  return prisma.shoppingItem.create({
    data: {
      userId,
      familyId: scope.familyId,
      name: data.name,
      category: data.category || "Other",
      quantity: Number(data.quantity || 1),
      unit: data.unit || "piece",
      estimatedUnitPrice: data.estimatedUnitPrice === "" || data.estimatedUnitPrice == null
        ? null
        : Number(data.estimatedUnitPrice),
      store: data.store?.trim() || null,
      notes: data.notes?.trim() || null,
      assigneeId: scope.view === "family" ? data.assigneeId || null : null,
    },
  });
}

export async function toggleShoppingItem({ id, userId }) {
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) throw createError(404, "Item not found", "NOT_FOUND");
  if (item.familyId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_familyId: { userId, familyId: item.familyId } },
    });
    if (!membership) throw createError(403, "Forbidden", "FORBIDDEN");
  } else if (item.userId !== userId) {
    throw createError(403, "Forbidden", "FORBIDDEN");
  }
  return prisma.shoppingItem.update({
    where: { id },
    data: { done: !item.done, purchasedAt: !item.done ? new Date() : null },
  });
}

export async function deleteShoppingItem({ id, userId }) {
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) throw createError(404, "Item not found", "NOT_FOUND");
  if (item.familyId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_familyId: { userId, familyId: item.familyId } },
    });
    if (!membership) throw createError(403, "Forbidden", "FORBIDDEN");
  } else {
    await authorizeOwnedScopedRecord({ userId, familyId: null, ownerId: item.userId });
  }
  return prisma.shoppingItem.delete({ where: { id } });
}

export async function clearPurchased({ userId, familyId, view }) {
  const scope = await resolveScope({ userId, familyId, view });
  return prisma.shoppingItem.deleteMany({
    where: { ...scopeWhere(scope, userId), tripId: null, done: true },
  });
}

export async function clearActiveList({ userId, familyId, view }) {
  const scope = await resolveScope({ userId, familyId, view });
  return prisma.shoppingItem.deleteMany({
    where: { ...scopeWhere(scope, userId), tripId: null },
  });
}

export async function getShoppingSummary({ userId, familyId, view }) {
  const items = await listShoppingScoped({ userId, familyId, view });
  const estimatedTotal = items.reduce((sum, item) => sum + shoppingLineEstimate(item), 0);
  const purchasedCount = items.filter((item) => item.done).length;
  return {
    estimatedTotal,
    itemCount: items.length,
    purchasedCount,
    completionPercent: items.length ? (purchasedCount / items.length) * 100 : 0,
  };
}

export async function completeShopping({ userId, familyId, view, actualTotal, currency, store }) {
  const scope = await resolveScope({ userId, familyId, view });
  const where = { ...scopeWhere(scope, userId), tripId: null };
  const items = await prisma.shoppingItem.findMany({ where });
  if (!items.length) throw createError(400, "Shopping list is empty", "EMPTY_LIST");

  const actual = Number(actualTotal);
  if (!Number.isFinite(actual) || actual < 0) throw createError(400, "Invalid actual total", "INVALID_AMOUNT");
  const estimated = items.reduce((sum, item) => sum + shoppingLineEstimate(item), 0);
  const now = new Date();
  const resolvedStore = store?.trim() || items.find((item) => item.store)?.store || null;
  const resolvedCurrency = normalizeCurrency(currency);

  return prisma.$transaction(async (tx) => {
    const trip = await tx.shoppingTrip.create({
      data: {
        userId,
        familyId: scope.familyId,
        store: resolvedStore,
        estimatedTotal: estimated,
        actualTotal: actual,
        currency: resolvedCurrency,
        completedAt: now,
      },
    });

    await tx.shoppingItem.updateMany({
      where,
      data: { tripId: trip.id, done: true, purchasedAt: now },
    });

    let expense = null;
    if (actual > 0) {
      expense = await tx.expense.create({
        data: {
          userId,
          familyId: scope.familyId,
          name: resolvedStore ? `Shopping · ${resolvedStore}` : "Shopping trip",
          amount: actual,
          currency: resolvedCurrency,
          category: "Shopping",
          date: now,
          isPrivate: scope.view === "single",
        },
      });
    }

    return { trip, expense, estimatedTotal: estimated, actualTotal: actual };
  });
}

export async function listShoppingHistory({ userId, familyId, view, limit = 20 }) {
  const scope = await resolveScope({ userId, familyId, view });
  return prisma.shoppingTrip.findMany({
    where: scopeWhere(scope, userId),
    include: { items: true },
    orderBy: { completedAt: "desc" },
    take: Math.min(Math.max(Number(limit) || 20, 1), 100),
  });
}

// ---- Legacy family activities retained until the activity feature is redesigned ----
export async function listShopping(familyId) {
  return prisma.shoppingItem.findMany({ where: { familyId, tripId: null }, orderBy: { done: "asc" } });
}

export async function createShoppingItem({ userId, familyId, name }) {
  return prisma.shoppingItem.create({ data: { name, userId, familyId } });
}

export async function listActivities(familyId) {
  return prisma.activity.findMany({ where: { familyId }, orderBy: { dueDate: "asc" } });
}

export async function createActivity({ userId, familyId, data }) {
  return prisma.activity.create({ data: { ...data, userId, familyId } });
}

export async function toggleActivity({ id, userId }) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) throw createError(404, "Activity not found", "NOT_FOUND");
  if (activity.familyId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_familyId: { userId, familyId: activity.familyId } },
    });
    if (!membership) throw createError(403, "Forbidden", "FORBIDDEN");
  } else {
    await authorizeOwnedScopedRecord({ userId, familyId: null, ownerId: activity.userId });
  }
  return prisma.activity.update({ where: { id }, data: { done: !activity.done } });
}
