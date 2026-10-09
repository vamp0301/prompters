import { codeExecutionEnabled } from "../config/env.js";
import { CODE_QUEUE } from "../jobs/queues.js";
import { PREP_QUEUE } from "../jobs/prep-queue.js";
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
  const worker = codeExecutionEnabled() ? startCodeWorker() : null;
  if (!worker) logger.warn("Code execution disabled (SANDBOX_DRIVER=disabled): code worker not started");
  const maintenance = await startMaintenanceWorker();
  const prep = startPrepWorker();
  const stopHeartbeat = startHeartbeat([...(worker ? [CODE_QUEUE] : []), PREP_QUEUE, "maintenance"]);
  return async () => {
    await Promise.allSettled([worker?.close(), prep.close(), maintenance.worker.close()]);
    await Promise.allSettled([maintenance.queue.close(), stopHeartbeat()]);
  };
}
