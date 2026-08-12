// =====================================================================
// Server entry point — starts the HTTP server + real-time chat (socket.io)
// Handles graceful shutdown and logs startup errors clearly.
// =====================================================================
import http from "node:http";                 // Node's HTTP server
import app from "./app.js";                   // The Express app
import { env } from "./config/env.js";        // Environment config (port, secrets)
import { logger } from "./utils/logger.js";   // Structured logger
import { initSocket } from "./socket/index.js"; // Real-time chat server

// Wrap startup in try/catch so any error is clearly logged (helps on Render)
try {
  // Create an HTTP server from the Express app
  const server = http.createServer(app);

  // Attach the socket.io server for real-time family chat
  initSocket(server);

  // Log any server-level errors (e.g. port conflicts) instead of crashing silently
  server.on("error", (err) => {
    console.error("SERVER ERROR:", err.message);
    process.exit(1);
  });

  // Listen on all network interfaces (0.0.0.0) so Render/cloud hosting can reach it.
  // The port comes from Render's PORT env var (or defaults to 5000 locally).
  server.listen(env.port, "0.0.0.0", () => {
    logger.info(`Family Expense Tracker API listening on 0.0.0.0:${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown: close the server cleanly on Ctrl+C / SIGTERM
  function shutdown(signal) {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });
    // Force exit after 10s if something hangs
    setTimeout(() => process.exit(1), 10000).unref();
  }

  // Handle termination signals so the server stops gracefully
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
} catch (err) {
  // If anything fails during startup, log it clearly and exit (so Render shows it)
  console.error("FATAL STARTUP ERROR:", err);
  process.exit(1);
}