import {
  createFamily,
  getFamily,
  joinFamily,
  setMemberRole,
  removeMember,
  getUserFamilies,
  createFamilyInvite,
  listFamilyInvites,
  revokeFamilyInvite,
} from "../services/family.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
  const family = await createFamily({ name: req.body.name, ownerId: req.user.id });
  res.status(201).json(family);
});

export const get = asyncHandler(async (req, res) => {
  res.json(await getFamily(req.params.id));
});

export const my = asyncHandler(async (req, res) => {
  const memberships = await getUserFamilies(req.user.id);
  res.json(memberships.map((membership) => membership.family));
});

export const join = asyncHandler(async (req, res) => {
  res.json(await joinFamily({ inviteCode: req.body.inviteCode, userId: req.user.id }));
});

export const updateRole = asyncHandler(async (req, res) => {
  res.json(await setMemberRole({
    familyId: req.params.familyId,
    targetUserId: req.body.userId,
    role: req.body.role,
  }));
});

export const remove = asyncHandler(async (req, res) => {
  await removeMember({ familyId: req.params.familyId, targetUserId: req.params.userId });
  res.status(204).end();
});

export const createInvite = asyncHandler(async (req, res) => {
  const invite = await createFamilyInvite({
    familyId: req.params.familyId,
    createdById: req.user.id,
    expiresInHours: req.body.expiresInHours,
    maxUses: req.body.maxUses,
  });
  res.status(201).json(invite);
});

export const invites = asyncHandler(async (req, res) => {
  res.json(await listFamilyInvites(req.params.familyId));
});

export const revokeInvite = asyncHandler(async (req, res) => {
  res.json(await revokeFamilyInvite({ familyId: req.params.familyId, inviteId: req.params.inviteId }));
});
