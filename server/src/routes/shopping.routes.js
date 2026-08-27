import { Router } from "express";
import { body, param, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyMemberParam } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  getShopping,
  addShoppingItem,
  toggleItem,
  removeShoppingItem,
  getActivities,
  addActivity,
  toggle,
  getShoppingScoped,
  addShoppingItemScoped,
  shoppingSummary,
  completeShoppingList,
  shoppingHistory,
  clearPurchasedItems,
  clearShoppingList,
} from "../controllers/shopping.controller.js";

const router = Router();
router.use(requireAuth);

// Shared scope validators keep Single and Family data separation explicit at
// the HTTP boundary. The service layer repeats membership checks as the final
// authorization boundary.
const queryScopeValidation = [
  query("view").isIn(["family", "single"]).withMessage("view must be family or single"),
  query("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
];

const bodyScopeValidation = [
  body("view").isIn(["family", "single"]).withMessage("view must be family or single"),
  body("familyId").optional({ nullable: true }).isString().isLength({ min: 1, max: 64 }),
];

// Modern scoped Shopping API (Family or Single)
router.get("/shopping", validate(queryScopeValidation), getShoppingScoped);
router.get("/shopping/summary", validate(queryScopeValidation), shoppingSummary);
router.get(
  "/shopping/history",
  validate([...queryScopeValidation, query("limit").optional().isInt({ min: 1, max: 100 })]),
  shoppingHistory
);
router.post(
  "/shopping",
  validate([
    ...bodyScopeValidation,
    body("name").trim().isLength({ min: 1, max: 160 }).withMessage("Name required"),
    body("quantity").optional().isFloat({ gt: 0 }),
    body("estimatedUnitPrice").optional({ values: "falsy" }).isFloat({ min: 0 }),
    body("category").optional().isString().isLength({ max: 80 }),
    body("unit").optional().isString().isLength({ max: 40 }),
    body("store").optional({ nullable: true }).isString().isLength({ max: 160 }),
    body("notes").optional({ nullable: true }).isString().isLength({ max: 1000 }),
    body("assigneeId").optional({ nullable: true }).isString().isLength({ max: 64 }),
  ]),
  addShoppingItemScoped
);
router.post(
  "/shopping/complete",
  validate([
    ...bodyScopeValidation,
    body("actualTotal").isFloat({ min: 0, max: 9999999999.99 }),
    body("currency").isString().matches(/^[A-Z]{3}$/),
    body("store").optional({ nullable: true }).isString().isLength({ max: 160 }),
  ]),
  completeShoppingList
);
router.post("/shopping/clear-purchased", validate(bodyScopeValidation), clearPurchasedItems);
router.post("/shopping/clear", validate(bodyScopeValidation), clearShoppingList);
router.patch("/shopping/:id", validate([param("id").isString().isLength({ min: 1, max: 64 })]), toggleItem);
router.delete("/shopping/:id", validate([param("id").isString().isLength({ min: 1, max: 64 })]), removeShoppingItem);

// Legacy family endpoints retained for compatibility during staged rollout.
router.get("/:familyId/shopping", requireFamilyMemberParam(), getShopping);
router.post(
  "/:familyId/shopping",
  requireFamilyMemberParam(),
  validate([body("name").trim().isLength({ min: 1 }).withMessage("Name required")]),
  addShoppingItem
);
router.get("/:familyId/activities", requireFamilyMemberParam(), getActivities);
router.post(
  "/:familyId/activities",
  requireFamilyMemberParam(),
  validate([body("title").trim().isLength({ min: 1 }).withMessage("Title required")]),
  addActivity
);
router.patch("/activities/:id", toggle);

export default router;
