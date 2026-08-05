
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createMessage } from "../services/chat.service.js";

export function initSocket(httpServer) {
    const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
    });

    io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        const payload = jwt.verify(token, env.accessTokenSecret);
        socket.userId = payload.sub;
        next();
    } catch (err) {
        next(new Error("Unauthorized"));
    }
    });

    io.on("connection", (socket) => {
    socket.on("join-family", (familyId) => {
        socket.join(`family:${familyId}`);
    });

    socket.on("send-message", async ({ familyId, message }) => {
        try {
        const saved = await createMessage({ userId: socket.userId, familyId, message });
        io.to(`family:${familyId}`).emit("new-message", saved);
        } catch (err) {
        socket.emit("error", { message: "Failed to send" });
        }
    });
    });

    return io;
}