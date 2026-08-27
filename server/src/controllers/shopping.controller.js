import {
  listShopping,
  createShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  listActivities,
  createActivity,
  toggleActivity,
  listShoppingScoped,
  createShoppingItemScoped,
  clearPurchased,
  clearActiveList,
  getShoppingSummary,
  completeShopping,
  listShoppingHistory,
} from "../services/shopping.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getShoppingScoped = asyncHandler(async (req, res) => {
  res.json(await listShoppingScoped({ userId: req.user.id, familyId: req.query.familyId, view: req.query.view }));
});

export const addShoppingItemScoped = asyncHandler(async (req, res) => {
  const item = await createShoppingItemScoped({
    userId: req.user.id,
    familyId: req.body.familyId,
    view: req.body.view,
    data: req.body,
  });
  res.status(201).json(item);
});

export const shoppingSummary = asyncHandler(async (req, res) => {
  res.json(await getShoppingSummary({ userId: req.user.id, familyId: req.query.familyId, view: req.query.view }));
});

export const completeShoppingList = asyncHandler(async (req, res) => {
  const result = await completeShopping({
    userId: req.user.id,
    familyId: req.body.familyId,
    view: req.body.view,
    actualTotal: req.body.actualTotal,
    currency: req.body.currency,
    store: req.body.store,
  });
  res.status(201).json(result);
});

export const shoppingHistory = asyncHandler(async (req, res) => {
  res.json(await listShoppingHistory({
    userId: req.user.id,
    familyId: req.query.familyId,
    view: req.query.view,
    limit: req.query.limit,
  }));
});

export const clearPurchasedItems = asyncHandler(async (req, res) => {
  await clearPurchased({ userId: req.user.id, familyId: req.body.familyId, view: req.body.view });
  res.status(204).end();
});

export const clearShoppingList = asyncHandler(async (req, res) => {
  await clearActiveList({ userId: req.user.id, familyId: req.body.familyId, view: req.body.view });
  res.status(204).end();
});

// Legacy routes
export const getShopping = asyncHandler(async (req, res) => res.json(await listShopping(req.params.familyId)));
export const addShoppingItem = asyncHandler(async (req, res) => {
  const item = await createShoppingItem({ userId: req.user.id, familyId: req.params.familyId, name: req.body.name });
  res.status(201).json(item);
});
export const toggleItem = asyncHandler(async (req, res) => res.json(await toggleShoppingItem({ id: req.params.id, userId: req.user.id })));
export const removeShoppingItem = asyncHandler(async (req, res) => {
  await deleteShoppingItem({ id: req.params.id, userId: req.user.id });
  res.status(204).end();
});
export const getActivities = asyncHandler(async (req, res) => res.json(await listActivities(req.params.familyId)));
export const addActivity = asyncHandler(async (req, res) => {
  const activity = await createActivity({
    userId: req.user.id,
    familyId: req.params.familyId,
    data: { title: req.body.title, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null },
  });
  res.status(201).json(activity);
});
export const toggle = asyncHandler(async (req, res) => res.json(await toggleActivity({ id: req.params.id, userId: req.user.id })));
