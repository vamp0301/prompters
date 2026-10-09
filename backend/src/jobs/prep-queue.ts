import { Queue } from "bullmq";
import { bullConnection } from "../lib/redis.js";

export const PREP_QUEUE = "career-prep";
/** PDF packs: separate from plan generation so a long plan never blocks a PDF. */
export const PACK_QUEUE = "career-pack";

export type PrepJob = { kind: "plan"; planId: string } | { kind: "pack"; packId: string };

const queues = new Map<string, Queue<PrepJob>>();

function queueFor(name: string) {
  let q = queues.get(name);
  if (!q) {
    q = new Queue<PrepJob>(name, {
      connection: bullConnection(),
      defaultJobOptions: { removeOnComplete: { age: 3600, count: 500 }, removeOnFail: { age: 86400 }, attempts: 1 },
    });
    queues.set(name, q);
  }
  return q;
}
const prepQueue = () => queueFor(PREP_QUEUE);
const packQueue = () => queueFor(PACK_QUEUE);

/** Top-100 generation and PDF packs are long-running AI work, so they run on the worker, never in the request. */
export async function enqueuePrep(job: PrepJob) {
  // Unique per enqueue: BullMQ silently ignores an add whose jobId still exists (kept completed/failed
  // jobs), which would make a re-queue after recovery a no-op.
  const id = job.kind === "plan" ? `plan-${job.planId}-${Date.now()}` : `pack-${job.packId}-${Date.now()}`;
  await (job.kind === "plan" ? prepQueue() : packQueue()).add(job.kind, job, { jobId: id });
}

/** Plan/pack ids that currently have a live job (waiting, active, delayed…). */
export async function liveTargets() {
  const states = ["active", "waiting", "delayed", "prioritized", "waiting-children"] as const;
  const jobs = [...(await prepQueue().getJobs([...states])), ...(await packQueue().getJobs([...states]))];
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
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
  queues.clear();
}
