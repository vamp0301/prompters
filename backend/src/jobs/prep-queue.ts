import { Queue } from "bullmq";
import { bullConnection } from "../lib/redis.js";

export const PREP_QUEUE = "career-prep";

export type PrepJob = { kind: "plan"; planId: string } | { kind: "pack"; packId: string };

let queue: Queue<PrepJob> | undefined;

function prepQueue() {
  queue ??= new Queue<PrepJob>(PREP_QUEUE, {
    connection: bullConnection(),
    defaultJobOptions: { removeOnComplete: { age: 3600, count: 500 }, removeOnFail: { age: 86400 }, attempts: 1 },
  });
  return queue;
}

/** Top-100 generation and PDF packs are long-running AI work, so they run on the worker, never in the request. */
export async function enqueuePrep(job: PrepJob) {
  const id = job.kind === "plan" ? `plan-${job.planId}-${Date.now()}` : `pack-${job.packId}`;
  await prepQueue().add(job.kind, job, { jobId: id });
}

export async function closePrepQueue() {
  await queue?.close();
  queue = undefined;
}
