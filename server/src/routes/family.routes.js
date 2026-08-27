import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMemberParam, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  create,
  get,
  my,
  join,
  updateRole,
  remove,
  createInvite,
  invites,
  revokeInvite,
} from "../controllers/family.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate([body("name").trim().isLength({ min: 1, max: 60 }).withMessage("Name is required")]), create);
router.get("/me", my);
router.post("/join", validate([body("inviteCode").notEmpty().withMessage("Invite code required")]), join);
router.get("/:id", requireFamilyMemberParam("id"), get);

router.get("/:familyId/invites", requireFamilyMemberParam(), requireRole("ADMIN"), invites);
router.post(
  "/:familyId/invites",
  requireFamilyMemberParam(),
  requireRole("ADMIN"),
  validate([
    body("expiresInHours").optional({ nullable: true }).isInt({ min: 1, max: 8760 }),
    body("maxUses").optional({ nullable: true }).isInt({ min: 1, max: 100 }),
  ]),
  createInvite
);
router.delete("/:familyId/invites/:inviteId", requireFamilyMemberParam(), requireRole("ADMIN"), revokeInvite);

router.patch("/:familyId/members", requireFamilyMemberParam(), requireRole("ADMIN"), updateRole);
router.delete("/:familyId/members/:userId", requireFamilyMemberParam(), requireRole("ADMIN"), remove);

export default router;
