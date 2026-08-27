import { Router } from "express";
import { body, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMemberParam, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { clearMessages, getMessages, removeMessage, sendMessage } from "../controllers/chat.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/:familyId", requireFamilyMemberParam(), validate([query("limit").optional().isInt({ min: 20, max: 250 })]), getMessages);
router.post(
  "/:familyId",
  requireFamilyMemberParam(),
  validate([
    body("message").custom((value) => {
      if (typeof value !== "string" || value.length < 1) throw new Error("Message required");
      const isData = value.startsWith("data:image/") || value.startsWith("data:audio/");
      if (!isData && value.trim().length > 5000) throw new Error("Message is too long");
      if (isData && value.length > 2_700_000) throw new Error("Media is too large");
      return true;
    }),
    body("duration").optional().isInt({ min: 0, max: 3600 }),
    body("replyToId").optional({ nullable: true }).isString(),
  ]),
  sendMessage
);
router.delete("/:familyId/messages/:id", requireFamilyMemberParam(), removeMessage);
router.delete("/:familyId/messages", requireFamilyMemberParam(), requireRole("ADMIN"), clearMessages);

export default router;
