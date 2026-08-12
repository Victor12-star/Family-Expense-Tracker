// =====================================================================
// Chat service — message history for family chat
// =====================================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listMessages(familyId, limit = 100) {
  return prisma.chatMessage.findMany({
    where: { familyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}

export async function createMessage({ userId, familyId, message, isVoice }) {
  return prisma.chatMessage.create({
    data: { userId, familyId, message, isVoice: isVoice === true },
    include: { user: { select: { name: true } } },
  });
}
