import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { createMessage } from "../services/chat.service.js";
import { corsOrigin } from "../middleware/security.js";

async function isFamilyMember(userId, familyId) {
  if (!userId || !familyId) return false;
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
    select: { id: true },
  });
  return Boolean(membership);
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, env.accessTokenSecret);
      socket.userId = payload.sub;
      next();
    } catch (_) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-family", async (familyId, acknowledge) => {
      try {
        if (!(await isFamilyMember(socket.userId, familyId))) {
          acknowledge?.({ ok: false, error: "Forbidden" });
          return;
        }
        await socket.join(`family:${familyId}`);
        acknowledge?.({ ok: true });
      } catch (_) {
        acknowledge?.({ ok: false, error: "Unable to join family chat" });
      }
    });

    socket.on("send-message", async ({ familyId, message }, acknowledge) => {
      try {
        if (!(await isFamilyMember(socket.userId, familyId))) {
          acknowledge?.({ ok: false, error: "Forbidden" });
          return;
        }

        const normalizedMessage = typeof message === "string" ? message.trim() : "";
        if (!normalizedMessage || normalizedMessage.length > 2000) {
          acknowledge?.({ ok: false, error: "Invalid message" });
          return;
        }

        const saved = await createMessage({
          userId: socket.userId,
          familyId,
          message: normalizedMessage,
        });
        io.to(`family:${familyId}`).emit("new-message", saved);
        acknowledge?.({ ok: true, message: saved });
      } catch (_) {
        acknowledge?.({ ok: false, error: "Failed to send" });
      }
    });
  });

  return io;
}
