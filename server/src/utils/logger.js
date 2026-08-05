
const isProd = (process.env.NODE_ENV || "development") === "production";

function write(level, msg, meta) {
  if (isProd) {
    console[level === "error" ? "error" : "log"](JSON.stringify({
      level, time: new Date().toISOString(), msg, ...(meta || {}),
    }));
  } else {
    console[level === "error" ? "error" : "log"](`[${level.toUpperCase()}] ${msg}`, meta ? `\n${JSON.stringify(meta)}` : "");
  }
}

export const logger = {
  info: (m, meta) => write("info", m, meta),
  warn: (m, meta) => write("warn", m, meta),
  error: (m, meta) => write("error", m, meta),
};