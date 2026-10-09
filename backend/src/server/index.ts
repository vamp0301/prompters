import "../config/load-env.js";
import { corsOrigins, env, isProd } from "../config/env.js";
import { closeQueues } from "../jobs/queues.js";
import { closePrepQueue } from "../jobs/prep-queue.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { closeRedis } from "../lib/redis.js";
import { initTaxonomy } from "../modules/roles/taxonomy.js";
import { startWorkers } from "../workers/run.js";
import { createApp } from "./app.js";

if (isProd) {
  // Not fatal (docker-compose runs the production image locally), but worth saying loudly.
  if (corsOrigins.some((o) => /localhost|127\.0\.0\.1/.test(o))) logger.warn({ corsOrigins }, "CORS_ORIGIN allows localhost in production");
  if (env.STORAGE_DRIVER === "local") logger.warn("STORAGE_DRIVER=local: files live on this machine's disk — on hosts with ephemeral disks (e.g. Render free) they are lost on every deploy or restart; use STORAGE_DRIVER=s3");
}

await initTaxonomy();

// Hosts without a separate worker service (Render free plan) run the workers in this process.
const stopWorkers = env.RUN_WORKERS_IN_API ? await startWorkers() : null;
if (stopWorkers) logger.info("Background workers running inside the API process (RUN_WORKERS_IN_API=true)");

const server = createApp().listen(env.PORT, () => logger.info(`Prompters API listening on :${env.PORT}`));
// Slightly above typical load-balancer idle timeouts so the LB closes idle connections first.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

const SHUTDOWN_GRACE_MS = 25_000;
let stopping = false;

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "Shutting down: no new connections, finishing in-flight requests");
  const force = setTimeout(() => {
    logger.error("Shutdown timed out; exiting");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);
  force.unref();
  // Stop accepting connections and wait for in-flight requests; drop idle keep-alive sockets now.
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeIdleConnections();
  });
  await stopWorkers?.().catch(() => undefined);
  await Promise.allSettled([closeQueues(), closePrepQueue()]);
  await Promise.allSettled([closeRedis(), prisma.$disconnect()]);
  logger.info("API stopped cleanly");
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
