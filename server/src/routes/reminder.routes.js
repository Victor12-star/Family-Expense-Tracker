import { Router } from "express";
import { body, param, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMemberParam } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  addReminder,
  addScopedReminder,
  clearScopedReminders,
  editReminder,
  getReminders,
  getScopedReminders,
  removeReminder,
} from "../controllers/reminder.controller.js";

const router = Router();
router.use(requireAuth);

const reminderValidation = [
  body("title").trim().isLength({ min: 1, max: 120 }).withMessage("Title is required"),
  body("date").isISO8601().withMessage("Valid date required"),
  body("time").optional({ nullable: true }).matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
  body("repeat").optional().isIn(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  body("remindBeforeMinutes").optional().isInt({ min: 0, max: 525600 }),
  body("sound").optional().isIn(["soft", "bell", "digital", "none"]),
];

router.get("/", validate([
  query("view").isIn(["family", "single"]),
  query("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
]), getScopedReminders);
router.post("/", validate([
  ...reminderValidation,
  body("view").isIn(["family", "single"]),
  body("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
]), addScopedReminder);
router.post("/clear", validate([
  body("view").isIn(["family", "single"]),
  body("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
]), clearScopedReminders);

// Legacy family-scoped routes kept for compatibility while clients migrate.
router.get("/:familyId", requireFamilyMemberParam(), getReminders);
router.post("/:familyId", requireFamilyMemberParam(), validate(reminderValidation), addReminder);
router.put("/:id", validate([param("id").isString().isLength({ min: 1, max: 64 }), ...reminderValidation]), editReminder);
router.delete("/:id", validate([param("id").isString().isLength({ min: 1, max: 64 })]), removeReminder);

export default router;
