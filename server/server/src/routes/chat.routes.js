// =====================================================================
// Chat routes
// =====================================================================
import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { getMessages, sendMessage } from "../controllers/chat.controller.js";

const router = Router();
router.use(requireAuth);
router.use("/:familyId", requireFamilyMember);

router.get("/:familyId", getMessages);
router.post("/:familyId", validate([body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Message required")]), sendMessage);

export default router;
