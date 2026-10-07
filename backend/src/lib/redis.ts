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
