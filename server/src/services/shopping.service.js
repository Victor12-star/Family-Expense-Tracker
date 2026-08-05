
import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

// Shopping
export async function listShopping(familyId) {
    return prisma.shoppingItem.findMany({ where: { familyId }, orderBy: { done: "asc" } });
}

export async function createShoppingItem({ userId, familyId, name }) {
    return prisma.shoppingItem.create({ data: { name, userId, familyId } });
}

export async function toggleShoppingItem({ id, userId }) {
    const item = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) throw createError(404, "Item not found", "NOT_FOUND");
    return prisma.shoppingItem.update({ where: { id }, data: { done: !item.done } });
}

export async function deleteShoppingItem({ id, userId }) {
    const item = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) throw createError(404, "Item not found", "NOT_FOUND");
    return prisma.shoppingItem.delete({ where: { id } });
}

// Activities
export async function listActivities(familyId) {
    return prisma.activity.findMany({ where: { familyId }, orderBy: { dueDate: "asc" } });
}

export async function createActivity({ userId, familyId, data }) {
    return prisma.activity.create({ data: { ...data, userId, familyId } });
}

export async function toggleActivity({ id, userId }) {
    const a = await prisma.activity.findUnique({ where: { id } });
    if (!a) throw createError(404, "Activity not found", "NOT_FOUND");
    return prisma.activity.update({ where: { id }, data: { done: !a.done } });
}