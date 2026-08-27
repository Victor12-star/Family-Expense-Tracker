import { createMessage, deleteAllMessages, deleteMessageForEveryone, listMessages } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMessages = asyncHandler(async (req, res) => {
  res.json(await listMessages(req.params.familyId, req.query.limit));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await createMessage({
    userId: req.user.id,
    familyId: req.params.familyId,
    message: req.body.message,
    isVoice: req.body.isVoice,
    duration: req.body.duration,
    replyToId: req.body.replyToId,
  });
  res.status(201).json(message);
});

export const removeMessage = asyncHandler(async (req, res) => {
  res.json(await deleteMessageForEveryone({ id: req.params.id, userId: req.user.id, familyId: req.params.familyId }));
});

export const clearMessages = asyncHandler(async (req, res) => {
  const result = await deleteAllMessages(req.params.familyId);
  res.json({ deleted: result.count });
});
