// =====================================================================
// Shopping & Activities controller
// =====================================================================
import {
  listShopping, createShoppingItem, toggleShoppingItem, deleteShoppingItem,
  listActivities, createActivity, toggleActivity,
} from "../services/shopping.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Shopping
export const getShopping = asyncHandler(async (req, res) => {
  res.json(await listShopping(req.params.familyId));
});
export const addShoppingItem = asyncHandler(async (req, res) => {
  const item = await createShoppingItem({ userId: req.user.id, familyId: req.params.familyId, name: req.body.name });
  res.status(201).json(item);
});
export const toggleItem = asyncHandler(async (req, res) => {
  res.json(await toggleShoppingItem({ id: req.params.id, userId: req.user.id }));
});
export const removeShoppingItem = asyncHandler(async (req, res) => {
  await deleteShoppingItem({ id: req.params.id, userId: req.user.id });
  res.status(204).end();
});

// Activities
export const getActivities = asyncHandler(async (req, res) => {
  res.json(await listActivities(req.params.familyId));
});
export const addActivity = asyncHandler(async (req, res) => {
  const activity = await createActivity({
    userId: req.user.id,
    familyId: req.params.familyId,
    data: { title: req.body.title, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null },
  });
  res.status(201).json(activity);
});
export const toggle = asyncHandler(async (req, res) => {
  res.json(await toggleActivity({ id: req.params.id, userId: req.user.id }));
});
