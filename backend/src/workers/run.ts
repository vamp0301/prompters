import { codeExecutionEnabled } from "../config/env.js";
import { CODE_QUEUE } from "../jobs/queues.js";
import { PACK_QUEUE, PREP_QUEUE } from "../jobs/prep-queue.js";
import { startHeartbeat } from "../lib/heartbeat.js";
import { logger } from "../lib/logger.js";
import { startCodeWorker } from "./code-worker.js";
import { startMaintenanceWorker } from "./maintenance-worker.js";
import { startPrepWorker } from "./prep-worker.js";

/**
 * Starts every background worker; returns a function that stops taking jobs and waits for the active
 * ones. Used by the worker process, or by the API itself when RUN_WORKERS_IN_API=true.
 */
export async function startWorkers() {
  // No code runner at all when execution is disabled — not even the process driver.
  // The only step that can fail (it talks to Redis) goes first, so a failed start leaves nothing running.
  const maintenance = await startMaintenanceWorker();
  const worker = codeExecutionEnabled() ? startCodeWorker() : null;
  if (!worker) logger.warn("Code execution disabled (SANDBOX_DRIVER=disabled): code worker not started");
  const prep = startPrepWorker();
  const stopHeartbeat = startHeartbeat([...(worker ? [CODE_QUEUE] : []), PREP_QUEUE, PACK_QUEUE, "maintenance"]);
  return async () => {
    await Promise.allSettled([worker?.close(), prep.close(), maintenance.worker.close()]);
    await Promise.allSettled([maintenance.queue.close(), stopHeartbeat()]);
  };
}

/**
 * Starts the workers without holding up the caller: retries with backoff (2 s doubling, capped at 60 s)
 * until it succeeds or `stopped()` turns true. The API uses this so it serves requests even while Redis
 * is unreachable or over quota at boot.
 */
export function startWorkersInBackground(opts: { start?: () => Promise<() => Promise<void>>; stopped: () => boolean; onStarted: (stop: () => Promise<void>) => void; baseDelayMs?: number }) {
  const start = opts.start ?? startWorkers;
  const base = opts.baseDelayMs ?? 2_000;
  return (async () => {
    for (let attempt = 0; !opts.stopped(); attempt++) {
      try {
        opts.onStarted(await start());
        return true;
      } catch (err) {
        const retryInMs = Math.min(60_000, base * 2 ** attempt);
        logger.error({ err, attempt: attempt + 1, retryInMs }, "Background workers failed to start; the API keeps serving and will retry");
        await new Promise((r) => setTimeout(r, retryInMs).unref());
      }
    }
    return false;
  })();
}
