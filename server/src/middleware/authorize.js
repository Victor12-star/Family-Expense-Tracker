// =====================================================================
// Authorization middleware — role-based access control (RBAC)
// =====================================================================
import { prisma } from "../config/prisma.js";
import { createError } from "../utils/apiError.js";

const ROLE_RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

export async function getFamilyMembership(userId, familyId) {
  if (!userId || !familyId) return null;
  return prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
}

// Require membership using an explicitly named route parameter.
// Avoid guessing from generic params such as `id`, because those IDs may refer
// to an expense, reminder, shopping item, or message rather than a family.
export function requireFamilyMemberParam(paramName = "familyId") {
  return async (req, _res, next) => {
    try {
      const familyId = req.params[paramName];
      if (!familyId) {
        return next(createError(400, "familyId required", "MISSING_FAMILY"));
      }

      const membership = await getFamilyMembership(req.user.id, familyId);
      if (!membership) {
        return next(createError(403, "Not a member of this family", "FORBIDDEN"));
      }

      req.familyId = familyId;
      req.membership = membership;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

// Require membership when the family ID is supplied in the request body.
export async function requireFamilyMemberBody(req, _res, next) {
  try {
    const familyId = req.body.familyId;
    if (!familyId) {
      return next(createError(400, "familyId required", "MISSING_FAMILY"));
    }

    const membership = await getFamilyMembership(req.user.id, familyId);
    if (!membership) {
      return next(createError(403, "Not a member of this family", "FORBIDDEN"));
    }

    req.familyId = familyId;
    req.membership = membership;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Requires a minimum role rank after a membership middleware has run.
export function requireRole(minRole) {
  return (req, _res, next) => {
    if (!req.membership) return next(createError(403, "Forbidden", "FORBIDDEN"));
    if (ROLE_RANK[req.membership.role] < ROLE_RANK[minRole]) {
      return next(createError(403, "Insufficient role", "FORBIDDEN"));
    }
    return next();
  };
}
