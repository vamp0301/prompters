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
  // Unique per enqueue: BullMQ silently ignores an add whose jobId still exists (kept completed/failed
  // jobs), which would make a re-queue after recovery a no-op.
  const id = job.kind === "plan" ? `plan-${job.planId}-${Date.now()}` : `pack-${job.packId}-${Date.now()}`;
  await prepQueue().add(job.kind, job, { jobId: id });
}

/** Plan/pack ids that currently have a live job (waiting, active, delayed…). */
export async function liveTargets() {
  const jobs = await prepQueue().getJobs(["active", "waiting", "delayed", "prioritized", "waiting-children"]);
  const plans = new Set<string>();
  const packs = new Set<string>();
  for (const j of jobs) {
    if (!j?.data) continue;
    if (j.data.kind === "plan") plans.add(j.data.planId);
    else packs.add(j.data.packId);
  }
  return { plans, packs };
}

export async function closePrepQueue() {
  await queue?.close();
  queue = undefined;
}
