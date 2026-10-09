import { randomUUID } from "node:crypto";
import { redis } from "./redis.js";

/**
 * Short-lived distributed locks in Redis (SET NX PX), released only by their owner. Used to make
 * "check, then create" paths single-flight across tabs, retries and API instances.
 */
const RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LockBusyError extends Error {
  constructor(readonly key: string) {
    super(`Lock busy: ${key}`);
  }
}

/** Tries to take the lock, waiting up to `waitMs`; returns a release function, or null if still busy. */
export async function acquire(key: string, ttlMs: number, waitMs = 0): Promise<(() => Promise<void>) | null> {
  const token = randomUUID();
  const deadline = Date.now() + waitMs;
  for (;;) {
    if ((await redis().set(key, token, "PX", ttlMs, "NX")) === "OK") {
      return async () => {
        await redis().eval(RELEASE, 1, key, token).catch(() => undefined);
      };
    }
    if (Date.now() >= deadline) return null;
    await sleep(Math.min(250, Math.max(25, deadline - Date.now())));
  }
}

/** Runs fn while holding the lock; throws LockBusyError if it can't be taken within waitMs. */
export async function withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>, waitMs = 0): Promise<T> {
  const release = await acquire(key, ttlMs, waitMs);
  if (!release) throw new LockBusyError(key);
  try {
    return await fn();
  } finally {
    await release();
  }
}
