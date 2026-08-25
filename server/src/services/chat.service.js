// =====================================================================
// Chat service — message history for family chat
// =====================================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listMessages(familyId, limit = 100) {
  // Only family-group messages (directWithId is null). Direct 1-on-1 messages
  // are handled by listDirectMessages and don't appear in the group chat.
  return prisma.chatMessage.findMany({
    where: { familyId, directWithId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}

export async function createMessage({ userId, familyId, message, isVoice, duration }) {
  return prisma.chatMessage.create({
    data: {
      userId,
      familyId,
      message,
      isVoice: isVoice === true,
      duration: isVoice === true ? (duration || 0) : 0, // only store duration for voice
      directWithId: null, // this is a group message
    },
    include: { user: { select: { name: true } } },
  });
}

// List the 1-on-1 conversation between two members of a family.
// We match on both directions so the same thread is shown to each person.
export async function listDirectMessages(familyId, userA, userB, limit = 100) {
  return prisma.chatMessage.findMany({
    where: {
      familyId,
      OR: [
        { userId: userA, directWithId: userB },
        { userId: userB, directWithId: userA },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}

// Create a direct (1-on-1) message between two members of a family.
export async function createDirectMessage({ userId, familyId, toUserId, message, isVoice, duration }) {
  return prisma.chatMessage.create({
    data: {
      userId,
      familyId,
      message,
      isVoice: isVoice === true,
      duration: isVoice === true ? (duration || 0) : 0,
      directWithId: toUserId, // marks this as a private thread with `toUserId`
    },
    include: { user: { select: { name: true } } },
  });
}

export async function deleteMessage({ id, userId, familyId }) {
  const message = await prisma.chatMessage.findUnique({ where: { id } });
  if (!message) throw new Error("Message not found");
  if (message.userId !== userId) throw new Error("Not authorized");
  await prisma.chatMessage.delete({ where: { id } });
  return true;
}

export async function deleteAllMessages(familyId) {
  await prisma.chatMessage.deleteMany({ where: { familyId } });
  return true;
}
