import { Queue, Worker } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { purgeExpiredRecordings } from "../modules/career/interview.service.js";
import { recoverStuckPrepWork } from "../modules/prep/recovery.js";

const QUEUE = "maintenance";

/** Housekeeping: daily purge of expired interview audio; every 5 minutes, re-queue stuck Top-100 work. */
export async function startMaintenanceWorker() {
  const queue = new Queue(QUEUE, { connection: bullConnection() });
  await queue.upsertJobScheduler("purge-recordings", { pattern: "30 3 * * *", tz: "Asia/Kolkata" }, { name: "purge-recordings" });
  await queue.upsertJobScheduler("recover-prep", { every: 5 * 60_000 }, { name: "recover-prep" });
  const worker = new Worker(
    QUEUE,
    async (job) => {
      if (job.name === "purge-recordings") {
        const n = await purgeExpiredRecordings();
        logger.info({ deleted: n }, "Purged expired interview recordings");
      } else if (job.name === "recover-prep") {
        await recoverStuckPrepWork();
      }
    },
    { connection: bullConnection(), concurrency: 1 },
  );
  return { queue, worker };
}
