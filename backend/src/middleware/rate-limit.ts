import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../config/env.js";
import { redis } from "../lib/redis.js";

/**
 * If Redis is unreachable, most limiters fail open so a Redis blip doesn't take the whole API down
 * (Redis-backed features report their own errors). The auth limiter fails closed: brute-force
 * protection matters more than availability for login.
 */
function limiter(prefix: string, windowMs: number, limit: number, extra: Partial<Options> = {}) {
  return rateLimit({
    passOnStoreError: true,
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.RATE_LIMIT_DISABLED,
    // Logged-in users are limited per account; anonymous traffic per IP (IPv6 grouped by /56 subnet).
    keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? "")}`),
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        redis().call(command, ...args) as Promise<RedisReply>,
    }),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down.", requestId: req.id },
      });
    },
    ...extra,
  });
}

export const globalLimiter = () => limiter("global", 60_000, 300);
export const authLimiter = () => limiter("auth", 15 * 60_000, 20, { passOnStoreError: false });
export const codeRunLimiter = () => limiter("code", 60_000, 30);
export const aiLimiter = () => limiter("ai", 60_000, 10);
export const careerAnswerLimiter = () => limiter("career", 60_000, 40);
/** Opening skill guides: cached ones are cheap; this caps how fast new ones can be generated. */
export const skillGuideLimiter = () => limiter("skill-guide", 60_000, 20);
