import "../config/load-env.js";
import { logger } from "../lib/logger.js";
import { startCodeWorker } from "./code-worker.js";
import { startMaintenanceWorker } from "./maintenance-worker.js";
import { startPrepWorker } from "./prep-worker.js";

const worker = startCodeWorker();
const maintenance = await startMaintenanceWorker();
const prep = startPrepWorker();

async function shutdown(signal: string) {
  logger.info({ signal }, "Worker shutting down");
  await Promise.all([worker.close(), prep.close(), maintenance.worker.close(), maintenance.queue.close()]);
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
