// =====================================================================
// Authorization middleware — role-based access control (RBAC)
// Ensures the current user is a member of a family with the required role
// =====================================================================
import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

const ROLE_RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

const familyId = req.params.familyId || req.params.id || req.body.familyId;

// Checks the user belongs to the family in the request params/body
export async function requireFamilyMember(req, _res, next) {
  try {
    const familyId = req.params.familyId || req.body.familyId;
    if (!familyId) return next(createError(400, "familyId required", "MISSING_FAMILY"));

    const membership = await prisma.membership.findUnique({
      where: { userId_familyId: { userId: req.user.id, familyId } },
    });
    if (!membership) return next(createError(403, "Not a member of this family", "FORBIDDEN"));

    req.membership = membership; // attach role for later checks
    return next();
  } catch (err) {
    return next(err);
  }
}

// Requires a minimum role rank
export function requireRole(minRole) {
  return (req, _res, next) => {
    if (!req.membership) return next(createError(403, "Forbidden", "FORBIDDEN"));
    if (ROLE_RANK[req.membership.role] < ROLE_RANK[minRole]) {
      return next(createError(403, "Insufficient role", "FORBIDDEN"));
    }
    return next();
  };
}
