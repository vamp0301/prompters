import "../config/load-env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { closeRedis } from "../lib/redis.js";
import { startWorkers } from "./run.js";

const stopWorkers = await startWorkers();

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
  await stopWorkers();
  await Promise.allSettled([closeRedis(), prisma.$disconnect()]);
  logger.info("Worker stopped cleanly");
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
