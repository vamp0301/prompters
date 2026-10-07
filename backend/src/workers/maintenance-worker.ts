import { Queue, Worker } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { purgeExpiredRecordings } from "../modules/career/interview.service.js";

const QUEUE = "maintenance";

/** Daily housekeeping: deletes interview audio past its retention period. */
export async function startMaintenanceWorker() {
  const queue = new Queue(QUEUE, { connection: bullConnection() });
  await queue.upsertJobScheduler("purge-recordings", { pattern: "30 3 * * *", tz: "Asia/Kolkata" }, { name: "purge-recordings" });
  const worker = new Worker(
    QUEUE,
    async (job) => {
      if (job.name === "purge-recordings") {
        const n = await purgeExpiredRecordings();
        logger.info({ deleted: n }, "Purged expired interview recordings");
      }
    },
    { connection: bullConnection(), concurrency: 1 },
  );
  return { queue, worker };
}
