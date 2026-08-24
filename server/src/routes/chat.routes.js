import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { getMessages, sendMessage, removeMessage, clearMessages } from "../controllers/chat.controller.js";

const router = Router();
router.use(requireAuth);
router.use("/:familyId", requireFamilyMember);

router.get("/:familyId", getMessages);
// Text messages are capped at 2000 chars. Voice messages are base64 audio data
// (much larger), so we allow them up to ~6MB. The `message` column is Postgres `text`,
// so it can hold the audio data URI safely.
router.post(
  "/:familyId",
  validate([
    body("message").trim().isLength({ min: 1 }).withMessage("Message required"),
    body("message")
      .custom((msg, { req }) => {
        const isVoice = req.body?.isVoice === true;
        const limit = isVoice ? 6_000_000 : 2000;
        if (msg.length > limit) {
          throw new Error(isVoice ? "Voice message too large" : "Message too long (max 2000 chars)");
        }
        return true;
      }),
  ]),
  sendMessage
);

// Delete single message
router.delete("/:familyId/messages/:id", removeMessage);
// Delete all messages in the family
router.delete("/:familyId/messages", clearMessages);

export default router;