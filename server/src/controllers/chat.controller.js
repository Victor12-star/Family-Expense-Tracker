import { listMessages, createMessage, deleteMessage, deleteAllMessages } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/apiError.js";

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await listMessages(req.params.familyId);
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await createMessage({
    userId: req.user.id,
    familyId: req.params.familyId,
    message: req.body.message,
    isVoice: req.body.isVoice,
    duration: req.body.duration,
  });
  res.status(201).json(message);
});

// Delete a single message (sender only)
export const removeMessage = asyncHandler(async (req, res) => {
  try {
    await deleteMessage({ id: req.params.id, userId: req.user.id, familyId: req.params.familyId });
    res.status(204).end();
  } catch (err) {
    throw createError(403, err.message || "Cannot delete message", "FORBIDDEN");
  }
});

// Delete all messages in the family
export const clearMessages = asyncHandler(async (req, res) => {
  await deleteAllMessages(req.params.familyId);
  res.status(204).end();
});