
import { listMessages, createMessage } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMessages = asyncHandler(async (req, res) => {
    res.json(await listMessages(req.params.familyId));
});

export const sendMessage = asyncHandler(async (req, res) => {
    const message = await createMessage({
    userId: req.user.id,
    familyId: req.params.familyId,
    message: req.body.message,
    });
    res.status(201).json(message);
});