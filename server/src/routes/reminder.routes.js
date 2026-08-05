
import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { getReminders, addReminder, editReminder, removeReminder } from "../controllers/reminder.controller.js";

const router = Router();
router.use(requireAuth);
router.use("/:familyId", requireFamilyMember);

router.get("/:familyId", getReminders);

router.post(
    "/:familyId",
    validate([
    body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
    body("date").isISO8601().withMessage("Valid date required"),
    body("time").optional(),
    ]),
    addReminder
);

router.put("/:id", editReminder);
router.delete("/:id", removeReminder);

export default router;