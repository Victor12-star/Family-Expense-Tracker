import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { create, get, my, join, updateRole, remove } from "../controllers/family.controller.js";

const router = Router();
router.use(requireAuth);

// Create family
router.post(
  "/",
  validate([body("name").trim().isLength({ min: 1, max: 60 }).withMessage("Name is required")]),
  create
);

// Get the user's families (auto-load on login)
router.get("/me", my);

// Join family with invite code
router.post("/join", validate([body("inviteCode").notEmpty().withMessage("Invite code required")]), join);

// Get family (must be a member)
router.get("/:id", requireFamilyMember, get);

// Role management (only OWNER/ADMIN)
router.patch("/:familyId/members", requireFamilyMember, requireRole("ADMIN"), updateRole);
router.delete("/:familyId/members/:userId", requireFamilyMember, requireRole("ADMIN"), remove);

export default router;