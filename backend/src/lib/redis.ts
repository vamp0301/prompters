import { Redis } from "ioredis";
import { env } from "../config/env.js";

let client: Redis | undefined;

/** Shared connection for caching and rate limiting. BullMQ creates its own. */
export function redis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: false });
  }
  return client;
}

/**
 * Shared by every worker. When a queue is empty, long-poll for 30 s (a new job still wakes the worker
 * at once) and check for stalled jobs once a minute: idle Redis traffic stays low, which matters on
 * hosted plans that count commands (Upstash free: 500K/month).
 */
export const IDLE_WORKER_OPTIONS = { drainDelay: 30, stalledInterval: 60_000 } as const;

export function bullConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = undefined;
  }
}
