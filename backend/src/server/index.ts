import "../config/load-env.js";
import { env } from "../config/env.js";
import { closeQueues } from "../jobs/queues.js";
import { closePrepQueue } from "../jobs/prep-queue.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { closeRedis } from "../lib/redis.js";
import { createApp } from "./app.js";

const server = createApp().listen(env.PORT, () => logger.info(`Prompters API listening on :${env.PORT}`));

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close();
  await Promise.allSettled([closeQueues(), closePrepQueue(), closeRedis(), prisma.$disconnect()]);
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
