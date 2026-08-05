
import dotenv from "dotenv";
dotenv.config();

function required(name) {
    const v = process.env[name];
    if (!v || v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
    }
    return v;
}

const isProd = (process.env.NODE_ENV || "development") === "production";

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    isProd,
    port: parseInt(process.env.PORT || "5000", 10),
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    databaseUrl: required("DATABASE_URL"),
    accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
    refreshTokenSecret: required("REFRESH_TOKEN_SECRET"),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "30", 10),
    rateLimitWindowMin: parseInt(process.env.RATE_LIMIT_WINDOW_MIN || "15", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
};

if (isProd) {
    const weak = [env.accessTokenSecret, env.refreshTokenSecret];
    if (weak.some((s) => s.startsWith("change_me"))) {
    throw new Error("Production refused: set real JWT secrets in .env");
    }
}