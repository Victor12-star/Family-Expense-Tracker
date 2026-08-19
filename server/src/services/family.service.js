// =====================================================================
// Family service — create/join families, manage members & roles, invite codes
// =====================================================================
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

function generateInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase(); // 8-char code
}

export async function createFamily({ name, ownerId }) {
  const inviteCode = generateInviteCode();
  const family = await prisma.family.create({
    data: { name, ownerId, inviteCode },
  });
  // Make the creator the OWNER
  await prisma.membership.create({
    data: { userId: ownerId, familyId: family.id, role: "OWNER" },
  });
  return family;
}

export async function getFamily(familyId) {
  return prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function joinFamily({ inviteCode, userId }) {
  const family = await prisma.family.findUnique({ where: { inviteCode } });
  if (!family) throw createError(404, "Invalid invite code", "INVALID_CODE");

  const existing = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: family.id } },
  });
  if (existing) throw createError(409, "Already a member", "ALREADY_MEMBER");

  await prisma.membership.create({ data: { userId, familyId: family.id, role: "MEMBER" } });
  return family;
}

export async function setMemberRole({ familyId, targetUserId, role }) {
  return prisma.membership.update({
    where: { userId_familyId: { userId: targetUserId, familyId } },
    data: { role },
  });
}

export async function removeMember({ familyId, targetUserId }) {
  // Prevent removing the owner
  const member = await prisma.membership.findUnique({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
  if (member?.role === "OWNER") throw createError(400, "Cannot remove the owner", "FORBIDDEN");
  return prisma.membership.delete({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
}

// Get the user's families (the ones they are a member of)
export async function getUserFamilies(userId) {
  return prisma.membership.findMany({
    where: { userId },
    include: { family: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
  });
}