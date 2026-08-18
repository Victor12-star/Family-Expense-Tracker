// =====================================================================
// Reminder controller
// =====================================================================
import {
  listReminders, createReminder, updateReminder, deleteReminder,
} from "../services/reminder.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getReminders = asyncHandler(async (req, res) => {
  const reminders = await listReminders(req.params.familyId);
  res.json(reminders);
});

export const addReminder = asyncHandler(async (req, res) => {
  const reminder = await createReminder({
    userId: req.user.id,
    familyId: req.params.familyId,
    data: {
      title: req.body.title,
      date: new Date(req.body.date),
      time: req.body.time,
      repeat: req.body.repeat || "NONE",
      type: req.body.type || "REMINDER",
    },
  });
  res.status(201).json(reminder);
});

export const editReminder = asyncHandler(async (req, res) => {
  const reminder = await updateReminder({
    id: req.params.id,
    userId: req.user.id,
    data: {
      title: req.body.title,
      date: req.body.date ? new Date(req.body.date) : undefined,
      time: req.body.time,
      repeat: req.body.repeat,
      type: req.body.type,
    },
  });
  res.json(reminder);
});

export const removeReminder = asyncHandler(async (req, res) => {
  await deleteReminder({ id: req.params.id, userId: req.user.id });
  res.status(204).end();
});
