
import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();
const ROLE_RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

export async function requireFamilyMember(req, _res, next) {
    try {
    const familyId = req.params.familyId || req.body.familyId;
    if (!familyId) return next(createError(400, "familyId required", "MISSING_FAMILY"));

    const membership = await prisma.membership.findUnique({
        where: { userId_familyId: { userId: req.user.id, familyId } },
    });
    if (!membership) return next(createError(403, "Not a member of this family", "FORBIDDEN"));

    req.membership = membership;
    return next();
    } catch (err) {
    return next(err);
    }
}

export function requireRole(minRole) {
    return (req, _res, next) => {
    if (!req.membership) return next(createError(403, "Forbidden", "FORBIDDEN"));
    if (ROLE_RANK[req.membership.role] < ROLE_RANK[minRole]) {
        return next(createError(403, "Insufficient role", "FORBIDDEN"));
    }
    return next();
    };
}