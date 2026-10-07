import { Worker } from "bullmq";
import { PREP_QUEUE, type PrepJob } from "../jobs/prep-queue.js";
import { bullConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { runPlan } from "../modules/prep/generation.service.js";
import { runPack } from "../modules/prep/pack.service.js";

/** Top-100 plan generation and interview-pack PDFs. Each job marks its own row FAILED on error. */
export function startPrepWorker() {
  const worker = new Worker<PrepJob>(
    PREP_QUEUE,
    async (job) => (job.data.kind === "plan" ? runPlan(job.data.planId) : runPack(job.data.packId)),
    // Long AI jobs: keep the lock alive well past a single slow model call.
    { connection: bullConnection(), concurrency: 2, lockDuration: 180_000 },
  );
  worker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Prep job failed"));
  logger.info("Prep worker started");
  return worker;
}
