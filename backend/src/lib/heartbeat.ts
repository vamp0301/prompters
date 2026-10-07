import { redis } from "./redis.js";

const KEY = "worker:heartbeat";
const EVERY_MS = 20_000;
/** A worker is considered down if it hasn't checked in for this long. */
const TTL_S = 60;

/** Called by the worker process: refreshes a short-lived Redis key while it is alive. */
export function startHeartbeat(queues: string[]) {
  const beat = () =>
    redis()
      .set(KEY, JSON.stringify({ at: new Date().toISOString(), pid: process.pid, queues }), "EX", TTL_S)
      .catch(() => undefined);
  void beat();
  const timer = setInterval(beat, EVERY_MS);
  timer.unref();
  return async () => {
    clearInterval(timer);
    await redis().del(KEY).catch(() => undefined);
  };
}

/** For health checks: is at least one worker alive? (Code runs, Top-100 plans and PDFs depend on it.) */
export async function workerAlive() {
  return (await redis().exists(KEY)) === 1;
}
