
import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { create, get, join, updateRole, remove } from "../controllers/family.controller.js";

const router = Router();
router.use(requireAuth);

router.post(
    "/",
    validate([body("name").trim().isLength({ min: 1, max: 60 }).withMessage("Name is required")]),
    create
);

router.post("/join", validate([body("inviteCode").notEmpty().withMessage("Invite code required")]), join);

router.get("/:id", requireFamilyMember, get);

router.patch("/:familyId/members", requireFamilyMember, requireRole("ADMIN"), updateRole);
router.delete("/:familyId/members/:userId", requireFamilyMember, requireRole("ADMIN"), remove);

export default router;