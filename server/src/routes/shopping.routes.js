// =====================================================================
// Shopping & Activities routes
// =====================================================================
import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMember } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  getShopping, addShoppingItem, toggleItem, removeShoppingItem,
  getActivities, addActivity, toggle,
} from "../controllers/shopping.controller.js";

const router = Router();
router.use(requireAuth);
router.use("/:familyId", requireFamilyMember);

// Shopping
router.get("/:familyId/shopping", getShopping);
router.post("/:familyId/shopping", validate([body("name").trim().isLength({ min: 1 }).withMessage("Name required")]), addShoppingItem);
router.patch("/shopping/:id", toggleItem);
router.delete("/shopping/:id", removeShoppingItem);

// Activities
router.get("/:familyId/activities", getActivities);
router.post("/:familyId/activities", validate([body("title").trim().isLength({ min: 1 }).withMessage("Title required")]), addActivity);
router.patch("/activities/:id", toggle);

export default router;
