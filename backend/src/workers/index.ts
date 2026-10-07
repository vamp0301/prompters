import "../config/load-env.js";
import { codeExecutionEnabled } from "../config/env.js";
import { CODE_QUEUE } from "../jobs/queues.js";
import { PREP_QUEUE } from "../jobs/prep-queue.js";
import { startHeartbeat } from "../lib/heartbeat.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { closeRedis } from "../lib/redis.js";
import { startCodeWorker } from "./code-worker.js";
import { startMaintenanceWorker } from "./maintenance-worker.js";
import { startPrepWorker } from "./prep-worker.js";

// No code runner at all when execution is disabled — not even the process driver.
const worker = codeExecutionEnabled() ? startCodeWorker() : null;
if (!worker) logger.warn("Code execution disabled (SANDBOX_DRIVER=disabled): code worker not started");
const maintenance = await startMaintenanceWorker();
const prep = startPrepWorker();
const stopHeartbeat = startHeartbeat([...(worker ? [CODE_QUEUE] : []), PREP_QUEUE, "maintenance"]);

/** Generous: an in-flight Top-100 batch or sandbox run is allowed to finish before we force exit. */
const SHUTDOWN_GRACE_MS = 150_000;
let stopping = false;

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "Worker shutting down: no new jobs, waiting for active ones");
  const force = setTimeout(() => {
    logger.error("Worker shutdown timed out; exiting. Unfinished jobs will be picked up again as stalled.");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);
  force.unref();
  // close() stops taking jobs and waits for the active ones to finish.
  await Promise.allSettled([worker?.close(), prep.close(), maintenance.worker.close()]);
  await Promise.allSettled([maintenance.queue.close(), stopHeartbeat()]);
  await Promise.allSettled([closeRedis(), prisma.$disconnect()]);
  logger.info("Worker stopped cleanly");
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
