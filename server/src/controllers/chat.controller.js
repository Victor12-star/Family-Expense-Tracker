// =====================================================================
// Chat controller
// =====================================================================
import { listMessages, createMessage } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
  });
  res.status(201).json(message);
});
