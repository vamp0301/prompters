import { enqueuePrep, liveTargets } from "../../jobs/prep-queue.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";

/** Work younger than this may simply not have been picked up yet. */
const GRACE_MS = 3 * 60_000;
/** After this many interruptions in a day the item is failed honestly instead of looping. */
const MAX_RECOVERIES = 3;

async function recoveries(kind: "plan" | "pack", id: string) {
  const key = `prep:recover:${kind}:${id}`;
  const n = await redis().incr(key);
  if (n === 1) await redis().expire(key, 24 * 60 * 60);
  return n;
}

/**
 * Finds Top-100 plans and PDF packs stuck in QUEUED/RUNNING with no live queue job (lost on a
 * Redis blip, a crashed worker, or an enqueue that failed after the row was saved) and re-queues
 * them. Runs are resumable: a plan keeps the questions it already validated.
 */
export async function recoverStuckPrepWork() {
  const cutoff = new Date(Date.now() - GRACE_MS);
  const [plans, packs, live] = await Promise.all([
    prisma.prepPlan.findMany({ where: { status: { in: ["QUEUED", "RUNNING"] }, createdAt: { lt: cutoff } }, select: { id: true } }),
    prisma.prepPack.findMany({ where: { status: { in: ["QUEUED", "RUNNING"] }, createdAt: { lt: cutoff } }, select: { id: true } }),
    liveTargets(),
  ]);
  const result = { requeued: 0, failed: 0 };

  for (const p of plans.filter((x) => !live.plans.has(x.id))) {
    if ((await recoveries("plan", p.id)) > MAX_RECOVERIES) {
      await prisma.prepPlan.updateMany({ where: { id: p.id, status: { in: ["QUEUED", "RUNNING"] } }, data: { status: "FAILED", error: "Generation was interrupted several times. Use Retry — questions already generated are kept." } });
      result.failed++;
      continue;
    }
    // Conditional: a job that finished between our reads must not be flipped back and re-run.
    const { count } = await prisma.prepPlan.updateMany({ where: { id: p.id, status: { in: ["QUEUED", "RUNNING"] } }, data: { status: "QUEUED" } });
    if (!count) continue;
    await enqueuePrep({ kind: "plan", planId: p.id });
    result.requeued++;
  }
  for (const p of packs.filter((x) => !live.packs.has(x.id))) {
    if ((await recoveries("pack", p.id)) > MAX_RECOVERIES) {
      await prisma.prepPack.updateMany({ where: { id: p.id, status: { in: ["QUEUED", "RUNNING"] } }, data: { status: "FAILED", error: "Building the PDF was interrupted. Please request it again." } });
      result.failed++;
      continue;
    }
    const { count } = await prisma.prepPack.updateMany({ where: { id: p.id, status: { in: ["QUEUED", "RUNNING"] } }, data: { status: "QUEUED" } });
    if (!count) continue;
    await enqueuePrep({ kind: "pack", packId: p.id });
    result.requeued++;
  }
  if (result.requeued || result.failed) logger.warn(result, "Recovered stuck Top-100 work");
  return result;
}
