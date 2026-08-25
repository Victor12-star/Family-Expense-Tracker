import { PrismaClient } from "@prisma/client";
import {
  listMessages,
  createMessage,
  deleteMessage,
  deleteAllMessages,
  listDirectMessages,
  createDirectMessage,
} from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/apiError.js";

const prisma = new PrismaClient();

// Confirm a user is a member of a given family (for direct-message recipients).
async function ensureFamilyMember(userId, familyId) {
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
  if (!membership) {
    throw createError(403, "Recipient is not a member of this family", "FORBIDDEN");
  }
}

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

// GET a 1-on-1 conversation with another member of the family
export const getDirectMessages = asyncHandler(async (req, res) => {
  const { familyId, userId } = req.params;
  if (userId === req.user.id) {
    throw createError(400, "Cannot view a direct chat with yourself", "INVALID_RECIPIENT");
  }
  await ensureFamilyMember(userId, familyId);
  const messages = await listDirectMessages(familyId, req.user.id, userId);
  res.json(messages);
});

// POST a direct (1-on-1) message to another member of the family
export const sendDirectMessage = asyncHandler(async (req, res) => {
  const { familyId, userId } = req.params;
  // You can't message yourself, and the recipient must be in the same family.
  if (userId === req.user.id) {
    throw createError(400, "Cannot send a direct message to yourself", "INVALID_RECIPIENT");
  }
  await ensureFamilyMember(userId, familyId);
  const message = await createDirectMessage({
    userId: req.user.id,
    familyId,
    toUserId: userId,
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