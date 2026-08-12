import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { initSocket } from "./socket/index.js";

try {
  const server = http.createServer(app);
  initSocket(server);

  server.on("error", (err) => {
    console.error("SERVER ERROR:", err.message);
    process.exit(1);
  });

  server.listen(env.port, "0.0.0.0", () => {
    logger.info(`Family Expense Tracker API listening on 0.0.0.0:${env.port} [${env.nodeEnv}]`);
  });

  function shutdown(signal) {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
} catch (err) {
  console.error("FATAL STARTUP ERROR:", err);
  process.exit(1);
}