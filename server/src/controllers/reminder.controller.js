import {
  clearOwnedReminders,
  createReminder,
  createScopedReminder,
  deleteReminder,
  listReminders,
  listScopedReminders,
  updateReminder,
} from "../services/reminder.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function reminderData(body) {
  return {
    title: body.title,
    date: body.date,
    time: body.time,
    repeat: body.repeat,
    type: body.type,
    category: body.category,
    remindBeforeMinutes: body.remindBeforeMinutes,
    sound: body.sound,
  };
}

export const getScopedReminders = asyncHandler(async (req, res) => {
  res.json(await listScopedReminders({ userId: req.user.id, view: req.query.view, familyId: req.query.familyId }));
});

export const addScopedReminder = asyncHandler(async (req, res) => {
  const reminder = await createScopedReminder({
    userId: req.user.id,
    view: req.body.view,
    familyId: req.body.familyId,
    data: reminderData(req.body),
  });
  res.status(201).json(reminder);
});

export const clearScopedReminders = asyncHandler(async (req, res) => {
  const result = await clearOwnedReminders({ userId: req.user.id, view: req.body.view, familyId: req.body.familyId });
  res.json({ deleted: result.count });
});

export const getReminders = asyncHandler(async (req, res) => res.json(await listReminders(req.params.familyId)));
export const addReminder = asyncHandler(async (req, res) => {
  const reminder = await createReminder({ userId: req.user.id, familyId: req.params.familyId, data: reminderData(req.body) });
  res.status(201).json(reminder);
});
export const editReminder = asyncHandler(async (req, res) => res.json(await updateReminder({ id: req.params.id, userId: req.user.id, data: reminderData(req.body) })));
export const removeReminder = asyncHandler(async (req, res) => { await deleteReminder({ id: req.params.id, userId: req.user.id }); res.status(204).end(); });
