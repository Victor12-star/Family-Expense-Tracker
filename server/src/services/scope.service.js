import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";

export function isSingleView(view) {
  return view === "single" || view === "individual";
}

export async function resolveScope({ userId, view, familyId }) {
  if (isSingleView(view)) {
    return { view: "single", familyId: null, userId };
  }

  if (!familyId) throw createError(400, "familyId required for family view", "MISSING_FAMILY");

  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
  if (!membership) throw createError(403, "Not a member of this family", "FORBIDDEN");

  return { view: "family", familyId, userId, membership };
}

export async function authorizeOwnedScopedRecord({ userId, familyId, ownerId }) {
  if (ownerId !== userId) throw createError(403, "Forbidden", "FORBIDDEN");
  if (!familyId) return;

  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
  if (!membership) throw createError(403, "Not a member of this family", "FORBIDDEN");
}
