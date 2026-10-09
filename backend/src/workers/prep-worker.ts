import { Worker } from "bullmq";
import { PACK_QUEUE, PREP_QUEUE, type PrepJob } from "../jobs/prep-queue.js";
import { bullConnection, IDLE_WORKER_OPTIONS } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { runPlan } from "../modules/prep/generation.service.js";
import { runPack } from "../modules/prep/pack.service.js";

const run = (job: { data: PrepJob }) => (job.data.kind === "plan" ? runPlan(job.data.planId) : runPack(job.data.packId));

/**
 * Top-100 plan generation and interview-pack PDFs, on separate queues with their own concurrency
 * (a long plan never blocks a PDF). Each job claims its row first and marks it FAILED on error.
 */
export function startPrepWorker() {
  // Long AI jobs: keep the lock alive well past a single slow model call.
  const plans = new Worker<PrepJob>(PREP_QUEUE, run, { connection: bullConnection(), concurrency: 2, lockDuration: 180_000, ...IDLE_WORKER_OPTIONS });
  const packs = new Worker<PrepJob>(PACK_QUEUE, run, { connection: bullConnection(), concurrency: 1, lockDuration: 180_000, ...IDLE_WORKER_OPTIONS });
  for (const w of [plans, packs]) w.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Prep job failed"));
  logger.info("Prep workers started (plans, packs)");
  return { close: async () => void (await Promise.allSettled([plans.close(), packs.close()])) };
}
