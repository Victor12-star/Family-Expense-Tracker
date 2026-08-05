
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "../services/auth.service.js";
import { createError } from "../utils/apiError.js";

export async function register(req, res, next) {
    try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
    } catch (err) { next(err); }
}

export async function login(req, res, next) {
    try {
    const result = await loginUser(req.body);
    res.json(result);
    } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
    try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError(400, "Refresh token required", "MISSING_REFRESH");
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
    } catch (err) { next(err); }
}

export async function logout(req, res, next) {
    try {
    const { refreshToken } = req.body;
    await logoutUser(refreshToken);
    res.status(204).end();
    } catch (err) { next(err); }
}

export async function me(req, res) {
    res.json({ user: req.user });
}