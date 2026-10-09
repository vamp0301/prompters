import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { CODE_QUEUE } from "../jobs/queues.js";
import { bullConnection, IDLE_WORKER_OPTIONS } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { sandbox, MAX_CODE_BYTES, type RunRequest, type RunResult } from "../sandbox/index.js";

export function startCodeWorker() {
  const worker = new Worker<RunRequest, RunResult>(
    CODE_QUEUE,
    async (job) => {
      if (Buffer.byteLength(job.data.code, "utf8") > MAX_CODE_BYTES * 2) throw new Error("Program too large");
      return sandbox().run(job.data);
    },
    { connection: bullConnection(), concurrency: env.SANDBOX_CONCURRENCY, ...IDLE_WORKER_OPTIONS },
  );
  worker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Code job failed"));
  logger.info({ driver: sandbox().name, concurrency: env.SANDBOX_CONCURRENCY }, "Code worker started");
  return worker;
}
