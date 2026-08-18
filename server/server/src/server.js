// =====================================================================
// Server entry point — starts HTTP + socket.io, graceful shutdown
// =====================================================================
import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { initSocket } from "./socket/index.js";

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  logger.info(`Family Expense Tracker API on port ${env.port} [${env.nodeEnv}]`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down...`);
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
