import { createRequire } from "node:module";
import { pino } from "pino";
import { env, isProd } from "../config/env.js";

/** pino-pretty is a dev dependency: production images (npm ci --omit=dev) don't have it, so fall back to JSON. */
const hasPretty = (() => {
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
})();

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isProd ? "info" : "debug",
  // Never log credentials: session cookies (both directions), auth headers, passwords, tokens, API keys.
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'req.headers["x-goog-api-key"]',
      'res.headers["set-cookie"]',
      "*.password",
      "*.passwordHash",
      "*.newPassword",
      "*.currentPassword",
      "*.token",
      "*.credential",
      "*.apiKey",
    ],
    censor: "[redacted]",
  },
  transport: isProd || env.NODE_ENV === "test" || !hasPretty ? undefined : { target: "pino-pretty", options: { colorize: true } },
});
