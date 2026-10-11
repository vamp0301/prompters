import { Queue } from "bullmq";
import { bullConnection } from "../lib/redis.js";

export const PREP_QUEUE = "career-prep";
/** PDF packs: separate from plan generation so a long plan never blocks a PDF. */
export const PACK_QUEUE = "career-pack";

export type PrepJob = { kind: "plan"; planId: string } | { kind: "pack"; packId: string; long?: boolean } | { kind: "pipeline"; pipelineId: string } | { kind: "fullAnswer"; questionId: string; lang: "en" | "hinglish" | "hi" } | { kind: "planAnswers"; planId: string };

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
  const target = job.kind === "plan" || job.kind === "planAnswers" ? job.planId : job.kind === "pack" ? job.packId : job.kind === "pipeline" ? job.pipelineId : `${job.questionId}-${job.lang}`;
  // Project pipelines share the plan queue: both are long AI generations.
  // A "Complete answers" pack writes many AI answers: it runs with the long jobs, never blocking quick PDFs.
  await (job.kind === "pack" && !job.long ? packQueue() : prepQueue()).add(job.kind, job, { jobId: `${job.kind}-${target}-${Date.now()}` });
}

/** Plan/pack ids that currently have a live job (waiting, active, delayed…). */
export async function liveTargets() {
  const states = ["active", "waiting", "delayed", "prioritized", "waiting-children"] as const;
  const jobs = [...(await prepQueue().getJobs([...states])), ...(await packQueue().getJobs([...states]))];
  const plans = new Set<string>();
  const packs = new Set<string>();
  const pipelines = new Set<string>();
  for (const j of jobs) {
    if (!j?.data) continue;
    if (j.data.kind === "plan") plans.add(j.data.planId);
    else if (j.data.kind === "pack") packs.add(j.data.packId);
    else if (j.data.kind === "pipeline") pipelines.add(j.data.pipelineId);
  }
  return { plans, packs, pipelines };
}

export async function closePrepQueue() {
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
  queues.clear();
}
