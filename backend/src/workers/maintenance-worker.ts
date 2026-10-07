import { Queue, Worker } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { purgeExpiredRecordings } from "../modules/career/interview.service.js";
import { recoverStuckPrepWork } from "../modules/prep/recovery.js";

const QUEUE = "maintenance";

/** Housekeeping: daily purge of expired interview audio; every 5 minutes, re-queue stuck Top-100 work. */
export async function startMaintenanceWorker() {
  // Schedulers add a job every run (the recovery sweep ~288/day): keep only a short history in Redis.
  const queue = new Queue(QUEUE, { connection: bullConnection(), defaultJobOptions: { removeOnComplete: { count: 50 }, removeOnFail: { count: 200, age: 7 * 24 * 3600 } } });
  await queue.upsertJobScheduler("purge-recordings", { pattern: "30 3 * * *", tz: "Asia/Kolkata" }, { name: "purge-recordings", opts: { removeOnComplete: { count: 50 }, removeOnFail: { count: 200 } } });
  await queue.upsertJobScheduler("recover-prep", { every: 5 * 60_000 }, { name: "recover-prep", opts: { removeOnComplete: { count: 50 }, removeOnFail: { count: 200 } } });
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
