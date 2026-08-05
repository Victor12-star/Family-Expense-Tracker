
import {
    createFamily, getFamily, joinFamily, setMemberRole, removeMember,
} from "../services/family.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
    const family = await createFamily({ name: req.body.name, ownerId: req.user.id });
    res.status(201).json(family);
});

export const get = asyncHandler(async (req, res) => {
    const family = await getFamily(req.params.id);
    res.json(family);
});

export const join = asyncHandler(async (req, res) => {
    const family = await joinFamily({ inviteCode: req.body.inviteCode, userId: req.user.id });
    res.json(family);
});

export const updateRole = asyncHandler(async (req, res) => {
    const family = await setMemberRole({
    familyId: req.params.familyId,
    targetUserId: req.body.userId,
    role: req.body.role,
    });
    res.json(family);
});

export const remove = asyncHandler(async (req, res) => {
    await removeMember({ familyId: req.params.familyId, targetUserId: req.params.userId });
    res.status(204).end();
});