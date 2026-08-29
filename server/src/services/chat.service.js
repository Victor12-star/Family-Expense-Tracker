import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";

const userSelect = { id: true, name: true };

function chatStorageNeedsRepair(error) {
  return error?.code === "P2021" || error?.code === "P2022";
}

async function listLegacyMessages(familyId, limit) {
  const safeLimit = Math.min(Math.max(Number(limit) || 120, 20), 250);
  const rows = await prisma.$queryRaw`
    SELECT m."id", m."familyId", m."userId", m."message", m."createdAt",
           u."id" AS "authorId", u."name" AS "authorName"
    FROM "ChatMessage" m
    JOIN "User" u ON u."id" = m."userId"
    WHERE m."familyId" = ${familyId}
    ORDER BY m."createdAt" DESC
    LIMIT ${safeLimit}
  `;
  return rows.map((row) => ({
    id: row.id,
    familyId: row.familyId,
    userId: row.userId,
    message: row.message,
    isVoice: typeof row.message === "string" && row.message.startsWith("data:audio/"),
    duration: 0,
    replyToId: null,
    deletedAt: null,
    createdAt: row.createdAt,
    user: { id: row.authorId, name: row.authorName },
    replyTo: null,
  }));
}

export async function listMessages(familyId, limit = 120) {
  try {
    return await prisma.chatMessage.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(Number(limit) || 120, 20), 250),
      include: {
        user: { select: userSelect },
        replyTo: { include: { user: { select: userSelect } } },
      },
    });
  } catch (error) {
    if (!chatStorageNeedsRepair(error)) throw error;
    return listLegacyMessages(familyId, limit);
  }
}

export async function createMessage({ userId, familyId, message, isVoice, duration, replyToId }) {
  let replyTo = null;
  if (replyToId) {
    replyTo = await prisma.chatMessage.findFirst({ where: { id: replyToId, familyId } });
    if (!replyTo) throw createError(400, "Reply target is not available in this chat", "INVALID_REPLY");
  }

  try {
    return await prisma.chatMessage.create({
      data: {
        userId,
        familyId,
        message,
        isVoice: isVoice === true,
        duration: Math.max(0, Number(duration) || 0),
        replyToId: replyTo?.id || null,
      },
      include: {
        user: { select: userSelect },
        replyTo: { include: { user: { select: userSelect } } },
      },
    });
  } catch (error) {
    if (!chatStorageNeedsRepair(error)) throw error;
    const id = randomUUID();
    const createdAt = new Date();
    await prisma.$executeRaw`
      INSERT INTO "ChatMessage" ("id", "familyId", "userId", "message", "createdAt")
      VALUES (${id}, ${familyId}, ${userId}, ${message}, ${createdAt})
    `;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    return {
      id, familyId, userId, message, createdAt, user,
      isVoice: isVoice === true || message.startsWith("data:audio/"),
      duration: Math.max(0, Number(duration) || 0),
      replyToId: null, deletedAt: null, replyTo: null,
    };
  }
}

export async function deleteMessageForEveryone({ id, userId, familyId }) {
  const message = await prisma.chatMessage.findFirst({ where: { id, familyId } });
  if (!message) throw createError(404, "Message not found", "NOT_FOUND");
  if (message.userId !== userId) throw createError(403, "You can only delete your own message for everyone", "FORBIDDEN");
  return prisma.chatMessage.update({
    where: { id },
    data: { message: "", isVoice: false, duration: 0, deletedAt: new Date() },
  });
}

export async function deleteAllMessages(familyId) {
  return prisma.chatMessage.deleteMany({ where: { familyId } });
}
