import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";

const userSelect = { id: true, name: true };

export async function listMessages(familyId, limit = 120) {
  return prisma.chatMessage.findMany({
    where: { familyId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(Number(limit) || 120, 20), 250),
    include: {
      user: { select: userSelect },
      replyTo: { include: { user: { select: userSelect } } },
    },
  });
}

export async function createMessage({ userId, familyId, message, isVoice, duration, replyToId }) {
  let replyTo = null;
  if (replyToId) {
    replyTo = await prisma.chatMessage.findFirst({ where: { id: replyToId, familyId } });
    if (!replyTo) throw createError(400, "Reply target is not available in this chat", "INVALID_REPLY");
  }

  return prisma.chatMessage.create({
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
