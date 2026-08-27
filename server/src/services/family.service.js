import { randomBytes } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 10) {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return result;
}

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    const existing = await prisma.familyInvite.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw createError(500, "Could not generate invitation", "INVITE_GENERATION_FAILED");
}

export async function createFamily({ name, ownerId }) {
  // Keep the legacy code populated for backwards compatibility during migration.
  const inviteCode = randomBytes(8).toString("hex").toUpperCase();
  return prisma.$transaction(async (tx) => {
    const family = await tx.family.create({ data: { name, ownerId, inviteCode } });
    await tx.membership.create({ data: { userId: ownerId, familyId: family.id, role: "OWNER" } });
    return family;
  });
}

export async function getFamily(familyId) {
  return prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function createFamilyInvite({ familyId, createdById, expiresInHours = 168, maxUses = 5 }) {
  const code = await uniqueInviteCode();
  const hours = expiresInHours == null ? null : Number(expiresInHours);
  const uses = maxUses == null ? null : Number(maxUses);
  const expiresAt = hours == null || !Number.isFinite(hours)
    ? null
    : new Date(Date.now() + Math.max(hours, 1) * 60 * 60 * 1000);

  return prisma.familyInvite.create({
    data: {
      familyId,
      createdById,
      code,
      expiresAt,
      maxUses: uses == null || !Number.isFinite(uses) ? null : Math.max(Math.trunc(uses), 1),
    },
  });
}

export async function listFamilyInvites(familyId) {
  return prisma.familyInvite.findMany({
    where: { familyId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function revokeFamilyInvite({ familyId, inviteId }) {
  const invite = await prisma.familyInvite.findFirst({ where: { id: inviteId, familyId } });
  if (!invite) throw createError(404, "Invitation not found", "NOT_FOUND");
  return prisma.familyInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
}

function ensureInviteUsable(invite) {
  if (invite.revokedAt) throw createError(410, "This invitation has been revoked", "INVITE_REVOKED");
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw createError(410, "This invitation has expired", "INVITE_EXPIRED");
  }
  if (invite.maxUses != null && invite.uses >= invite.maxUses) {
    throw createError(410, "This invitation has reached its usage limit", "INVITE_USED");
  }
}

export async function joinFamily({ inviteCode, userId }) {
  const normalized = String(inviteCode || "").trim().toUpperCase();
  let invite = await prisma.familyInvite.findUnique({ where: { code: normalized } });
  let family;

  if (invite) {
    ensureInviteUsable(invite);
    family = await prisma.family.findUnique({ where: { id: invite.familyId } });
  } else {
    // Temporary legacy fallback for links created before the new invitation model.
    family = await prisma.family.findUnique({ where: { inviteCode: normalized } });
  }

  if (!family) throw createError(404, "Invalid invite code", "INVALID_CODE");

  const existing = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: family.id } },
  });
  if (existing) throw createError(409, "Already a member", "ALREADY_MEMBER");

  await prisma.$transaction(async (tx) => {
    await tx.membership.create({ data: { userId, familyId: family.id, role: "MEMBER" } });
    if (invite) await tx.familyInvite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
  });

  return getFamily(family.id);
}

export async function setMemberRole({ familyId, targetUserId, role }) {
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    throw createError(400, "Role must be ADMIN or MEMBER", "INVALID_ROLE");
  }
  return prisma.membership.update({
    where: { userId_familyId: { userId: targetUserId, familyId } },
    data: { role },
  });
}

export async function removeMember({ familyId, targetUserId }) {
  const member = await prisma.membership.findUnique({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
  if (!member) throw createError(404, "Member not found", "NOT_FOUND");
  if (member.role === "OWNER") throw createError(400, "Cannot remove the owner", "FORBIDDEN");
  return prisma.membership.delete({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
}

export async function getUserFamilies(userId) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      family: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });
}
