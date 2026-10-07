import { pino } from "pino";
import { env, isProd } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isProd ? "info" : "debug",
  redact: ["req.headers.cookie", "req.headers.authorization", "*.password", "*.passwordHash"],
  transport: isProd || env.NODE_ENV === "test" ? undefined : { target: "pino-pretty", options: { colorize: true } },
});
