import type { PrepCategory, Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { env } from "../../config/env.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, conflict, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { allocateQuestions, calibratePriorities, PREP_CATEGORIES, rankQuestions, TOTAL_QUESTIONS } from "./allocation.js";
import { ensureResumeIntelligence } from "./intelligence.service.js";
import { buildProfile, type CandidateProfile } from "./profile.js";
import { prepPrompts } from "./prompts.js";
import { TARGET_ROLES, type TargetRoleKey } from "./roles.js";
import { dedupeSchema, questionBatchSchema } from "./schemas.js";
import { contentTokens, normalize } from "./text.js";
import { emptyStats, mergeStats, validateBatch, type ValidationStats, type ValidQuestion } from "./validator.js";

const BATCH = 10;
/** Candidates generated per allocated question, so de-dup and selection can drop the weakest. */
const OVER_GENERATE = 1.3;
const AI_TIMEOUT = 120_000;
/** Concurrent model calls per plan. */
const AI_CONCURRENCY = 5;
/** Below this many validated questions the plan fails rather than presenting a thin "Top 100". */
const MIN_QUESTIONS = 60;

type StepState = "pending" | "running" | "done" | "failed";
export interface PlanProgress {
  resume: { state: StepState; chunks?: number };
  skills: { state: StepState; count?: number };
  projects: { state: StepState; count?: number };
  categories: Partial<Record<PrepCategory, { target: number; done: number; state: StepState }>>;
  dedupe?: { state: StepState; removed?: number };
  ranking: { state: StepState };
}

const initialProgress = (): PlanProgress => ({ resume: { state: "pending" }, skills: { state: "pending" }, projects: { state: "pending" }, categories: {}, ranking: { state: "pending" } });

// ───────────────────────── API-facing ─────────────────────────

const DAY_MS = 24 * 60 * 60_000;

/**
 * Plan generations in the last 24 hours. Counted from the event log, which outlives deleted
 * plans, so deleting and re-creating a plan doesn't get around the limit.
 */
export async function generationUsage(userId: string) {
  const since = new Date(Date.now() - DAY_MS);
  const events = await prisma.learningEvent.findMany({ where: { userId, type: "prep_plan_requested", createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
  const limit = env.PREP_DAILY_PLAN_LIMIT;
  return {
    limit,
    used: events.length,
    remaining: Math.max(0, limit - events.length),
    /** When the oldest generation in the window expires and a slot frees up. */
    resetAt: events.length >= limit ? new Date(events[events.length - limit].createdAt.getTime() + DAY_MS) : null,
  };
}

/**
 * Creates (or reuses) a Top-100 plan. A finished or in-progress plan for the same resume and
 * target is returned as-is — regenerating it is an explicit action (`regenerate: true`) and
 * counts against the daily limit, because one plan costs ~20–25 model calls.
 */
export async function createPlan(userId: string, input: { resumeId: string; jobId?: string; targetRole?: TargetRoleKey; regenerate?: boolean }) {
  if (!!input.jobId === !!input.targetRole) throw badRequest("Choose either a job description or a target role.");
  const resume = await prisma.careerResume.findFirst({ where: { id: input.resumeId, userId } });
  if (!resume) throw notFound("Resume");
  const job = input.jobId ? await prisma.jobTarget.findFirst({ where: { id: input.jobId, userId } }) : null;
  if (input.jobId && !job) throw notFound("Job description");

  if (!input.regenerate) {
    const existing = await prisma.prepPlan.findFirst({
      where: { userId, resumeId: resume.id, jobId: job?.id ?? null, targetRole: job ? null : input.targetRole, status: { in: ["QUEUED", "RUNNING", "READY"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return { plan: existing, reused: true };
  }

  const running = await prisma.prepPlan.count({ where: { userId, status: { in: ["QUEUED", "RUNNING"] } } });
  if (running >= 2) throw conflict("You already have plans being generated. Wait for them to finish.");
  const usage = await generationUsage(userId);
  if (usage.remaining <= 0) {
    const hours = Math.max(1, Math.ceil(((usage.resetAt?.getTime() ?? Date.now()) - Date.now()) / 3_600_000));
    throw new AppError(429, "PREP_DAILY_LIMIT", `You can generate ${usage.limit} preparation plan${usage.limit === 1 ? "" : "s"} per day. Your next one is available in about ${hours} hour${hours === 1 ? "" : "s"} — your existing plans stay available.`, usage);
  }

  const title = job ? `${job.title}${job.company ? ` · ${job.company}` : ""}` : TARGET_ROLES[input.targetRole!].label;
  const plan = await prisma.prepPlan.create({
    data: { userId, resumeId: resume.id, jobId: job?.id, targetRole: job ? null : input.targetRole, title, progress: initialProgress() as unknown as Prisma.InputJsonValue, allocation: {} },
  });
  await logEvent(userId, "prep_plan_requested", { meta: { planId: plan.id, mode: job ? "jd" : "role", regenerate: !!input.regenerate } });
  await enqueuePrep({ kind: "plan", planId: plan.id });
  return { plan, reused: false };
}

/** Resumes a failed plan: categories already filled keep their validated questions. */
export async function retryPlan(userId: string, planId: string) {
  const plan = await prisma.prepPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw notFound("Preparation plan");
  if (plan.status !== "FAILED") throw conflict("Only a failed plan can be retried.");
  await prisma.prepPlan.update({ where: { id: plan.id }, data: { status: "QUEUED", error: null } });
  await enqueuePrep({ kind: "plan", planId: plan.id });
  return { queued: true };
}

// ───────────────────────── worker ─────────────────────────

class ProgressWriter {
  private chain: Promise<unknown> = Promise.resolve();
  constructor(private planId: string, readonly value: PlanProgress) {}
  /** Serialises writes so concurrent categories never clobber each other's progress. */
  save() {
    const snapshot = JSON.parse(JSON.stringify(this.value)) as Prisma.InputJsonValue;
    this.chain = this.chain.then(() => prisma.prepPlan.update({ where: { id: this.planId }, data: { progress: snapshot } }));
    return this.chain;
  }
}

/** Caps concurrent model calls across the whole plan (free-tier rate limits). */
function limiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= max) await new Promise<void>((r) => waiting.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}

async function generateCategory(opts: {
  planId: string;
  category: PrepCategory;
  target: number;
  have: number;
  profile: CandidateProfile;
  resumeText: string;
  accepted: { norm: string; tokens: Set<string> }[];
  avoid: string[];
  /** Model-call failures, so the plan can report an outage/quota error instead of a validation failure. */
  aiErrors: unknown[];
  onAccepted: (n: number) => Promise<unknown>;
  limit: ReturnType<typeof limiter>;
  /** Sequential top-up calls after the first (parallel) round, made only while below `minimum`. */
  topUps?: number;
  minimum?: number;
  /** Items (skills, projects, claims…) spread across the parallel batches so they don't all ask about the same thing. */
  focus?: string[];
}) {
  let have = opts.have;
  let stats = emptyStats();

  const batch = async (need: number, focus?: string[]) => {
    // Ask for a few extra: the validator will drop some.
    const ask = Math.min(14, need + Math.ceil(need * 0.25) + 1);
    const p = prepPrompts.questions({
      category: opts.category,
      count: ask,
      profile: opts.profile.text,
      target: opts.profile.target,
      level: opts.profile.level,
      avoid: opts.avoid.slice(-80).map((q) => q.slice(0, 140)),
      focus,
    });
    let items: unknown[];
    try {
      items = (await opts.limit(() => aiJson(`prep_${opts.category.toLowerCase()}`, p.system, p.user, questionBatchSchema, 12000, { timeoutMs: AI_TIMEOUT }))).questions;
    } catch (e) {
      logger.warn({ err: e, planId: opts.planId, category: opts.category }, "Prep batch failed");
      opts.aiErrors.push(e);
      return;
    }
    // Validation is synchronous, so concurrent batches still de-duplicate against each other.
    const { questions, stats: s } = validateBatch(items, {
      category: opts.category,
      resumeText: opts.resumeText,
      sources: opts.profile.sources,
      matchSkill: opts.profile.matchSkill,
      accepted: opts.accepted,
      fallbackSource: opts.profile.targetSource,
    });
    stats = mergeStats(stats, s);
    // Keep the most likely ones when the model over-delivered; reserve the slots before any await.
    const keep = questions.sort((a, b) => b.probability - a.probability).slice(0, Math.max(0, opts.target - have));
    have += keep.length;
    // Over-generated extras were added to `accepted` by the validator; release them so other categories can use similar ground.
    for (const d of questions.slice(keep.length)) {
      const i = opts.accepted.findIndex((a) => a.norm === normalize(d.question));
      if (i >= 0) opts.accepted.splice(i, 1);
    }
    if (keep.length) {
      opts.avoid.push(...keep.map((q) => q.question));
      await prisma.prepQuestion.createMany({ data: keep.map((q) => toRow(opts.planId, q)) });
      await opts.onAccepted(have);
    }
  };

  // First round in parallel (one call per BATCH questions), then a few sequential top-ups for what the validator dropped.
  const need = opts.target - have;
  const sizes = Array.from({ length: Math.ceil(need / BATCH) }, (_, i) => Math.min(BATCH, need - i * BATCH));
  const focusFor = (i: number) => (opts.focus?.length && sizes.length > 1 ? opts.focus.filter((_, j) => j % sizes.length === i) : undefined);
  await Promise.all(sizes.map((n, i) => batch(n, focusFor(i))));
  const minimum = opts.minimum ?? opts.target;
  for (let call = 0; call < (opts.topUps ?? 2) && have < minimum; call++) await batch(Math.min(BATCH, minimum - have));
  return { have, stats };
}

/**
 * Asks the model which questions are the same ask in different words, keeps the most likely
 * question of each group (resume-anchored wins ties) and deletes the rest. Never fails the plan.
 */
async function semanticDedupe(planId: string) {
  const rows = await prisma.prepQuestion.findMany({ where: { planId }, select: { id: true, question: true, category: true, probability: true } });
  if (rows.length < 2) return [];
  const ids = rows.map((_, i) => `q${i + 1}`);
  const p = prepPrompts.dedupe(rows.map((r, i) => ({ id: ids[i], question: r.question })));
  let groups: string[][];
  try {
    groups = (await aiJson("prep_dedupe", p.system, p.user, dedupeSchema, 6000, { timeoutMs: AI_TIMEOUT })).groups;
  } catch (e) {
    logger.warn({ err: e, planId }, "Semantic de-duplication skipped");
    return [];
  }
  const byId = new Map(ids.map((id, i) => [id, rows[i]]));
  const anchored = (c: PrepCategory) => (c === "PROJECT" || c === "CLAIM" || c === "ACHIEVEMENT" ? 1 : 0);
  const remove = new Map<string, (typeof rows)[number]>();
  for (const g of groups) {
    const members = [...new Set(g)].map((id) => byId.get(id)).filter((r): r is (typeof rows)[number] => !!r && !remove.has(r.id));
    if (members.length < 2) continue;
    members.sort((a, b) => b.probability - a.probability || anchored(b.category) - anchored(a.category));
    for (const m of members.slice(1)) remove.set(m.id, m);
  }
  // Guard against a model that lumps everything together: never drop more than a third in one pass.
  const dropped = [...remove.values()].slice(0, Math.floor(rows.length / 3));
  if (dropped.length) await prisma.prepQuestion.deleteMany({ where: { id: { in: dropped.map((d) => d.id) } } });
  return dropped;
}

/**
 * Picks the final 100: the most likely questions of each category up to its allocation, then
 * the best remaining questions (any category) for slots a thin category couldn't fill.
 */
export function selectTop<T extends { category: PrepCategory; probability: number; priority: PrepPriorityLike; difficulty: number }>(rows: T[], allocation: Record<PrepCategory, number>) {
  const picked = new Set<T>();
  for (const c of PREP_CATEGORIES) {
    rows.filter((r) => r.category === c).sort((a, b) => b.probability - a.probability).slice(0, allocation[c] ?? 0).forEach((r) => picked.add(r));
  }
  for (const r of rankQuestions(rows.filter((x) => !picked.has(x)))) {
    if (picked.size >= TOTAL_QUESTIONS) break;
    picked.add(r);
  }
  return [...picked].slice(0, TOTAL_QUESTIONS);
}
type PrepPriorityLike = Parameters<typeof rankQuestions>[0][number]["priority"];

const toRow = (planId: string, q: ValidQuestion): Prisma.PrepQuestionCreateManyInput => ({ planId, ...q });

export async function runPlan(planId: string) {
  const plan = await prisma.prepPlan.findUnique({ where: { id: planId }, include: { job: true } });
  if (!plan || plan.status === "READY") return;
  const progress = new ProgressWriter(plan.id, { ...initialProgress(), ...(plan.progress as unknown as Partial<PlanProgress>) });
  await prisma.prepPlan.update({ where: { id: plan.id }, data: { status: "RUNNING", error: null } });

  try {
    // 1. Resume intelligence (cached per resume).
    progress.value.resume.state = "running";
    await progress.save();
    const intel = await ensureResumeIntelligence(plan.resumeId);
    const profile = buildProfile(intel, { job: plan.job, role: (plan.targetRole as TargetRoleKey | null) ?? null });
    progress.value.resume = { state: "done", chunks: intel.chunks.length };
    progress.value.skills = { state: "done", count: profile.counts.skills };
    progress.value.projects = { state: "done", count: profile.counts.projects };

    // 2. How many questions per category — decided by code from what the resume contains.
    const allocation =
      Object.keys((plan.allocation ?? {}) as object).length > 0
        ? (plan.allocation as Record<PrepCategory, number>)
        : allocateQuestions({ projects: profile.counts.projects, claims: profile.counts.claims, achievements: profile.counts.achievements, gapSkills: profile.counts.gapSkills });
    await prisma.prepPlan.update({ where: { id: plan.id }, data: { allocation, model: process.env.AI_MODEL ?? process.env.AI_PROVIDER ?? null } });

    // Questions saved by an earlier (failed) run are kept and count towards their category.
    const existing = await prisma.prepQuestion.findMany({ where: { planId: plan.id }, select: { question: true, category: true } });
    const accepted = existing.map((q) => ({ norm: normalize(q.question), tokens: contentTokens(q.question) }));
    const avoid = existing.map((q) => q.question);
    const have = Object.fromEntries(PREP_CATEGORIES.map((c) => [c, existing.filter((q) => q.category === c).length])) as Record<PrepCategory, number>;
    for (const c of PREP_CATEGORIES) {
      if (allocation[c] > 0) progress.value.categories[c] = { target: allocation[c], done: have[c], state: have[c] >= allocation[c] ? "done" : "pending" };
    }
    await progress.save();

    let stats: ValidationStats = (plan.validation as unknown as ValidationStats | null) ?? emptyStats();
    const limit = limiter(AI_CONCURRENCY);
    const aiErrors: unknown[] = [];
    const ctx = { planId: plan.id, profile, resumeText: intel.resume.text, accepted, avoid, limit, aiErrors };
    const total = () => Object.values(have).reduce((a, b) => a + b, 0);

    /**
     * Fills every category. With `overGenerate`, asks for ~30% extra candidates so the semantic
     * de-dup pass and final selection have room to drop paraphrases without a refill round.
     * Then tops up any overall shortfall with flexible categories.
     */
    const fill = async (topUps: number, overGenerate: boolean) => {
      const runOne = async (category: PrepCategory) => {
        const entry = (progress.value.categories[category] ??= { target: allocation[category], done: have[category], state: "pending" });
        entry.state = "running";
        await progress.save();
        const r = await generateCategory({
          ...ctx, category, have: have[category], topUps,
          target: overGenerate ? Math.ceil(allocation[category] * OVER_GENERATE) : allocation[category],
          minimum: allocation[category],
          focus: profile.focus[category],
          onAccepted: (n) => {
            entry.done = Math.min(n, allocation[category]);
            return progress.save();
          },
        });
        have[category] = r.have;
        entry.done = Math.min(r.have, allocation[category]);
        stats = mergeStats(stats, r.stats);
        entry.state = r.have > 0 ? "done" : "failed";
        await progress.save();
      };
      await Promise.all(PREP_CATEGORIES.filter((c) => allocation[c] > have[c]).map(runOne));

      // Shortfall: categories that couldn't fill (thin resume, validator drops) are topped up with skill/conceptual/general questions.
      for (const category of ["SKILL", "CONCEPTUAL", "GENERAL", "SCENARIO"] as const) {
        if (total() >= TOTAL_QUESTIONS) break;
        const entry = (progress.value.categories[category] ??= { target: 0, done: have[category], state: "pending" });
        const target = have[category] + TOTAL_QUESTIONS - total();
        entry.target = target;
        entry.state = "running";
        await progress.save();
        const r = await generateCategory({
          ...ctx, category, target, have: have[category], topUps: 1,
          onAccepted: (n) => {
            entry.done = n;
            return progress.save();
          },
        });
        have[category] = r.have;
        allocation[category] = r.have;
        entry.target = r.have;
        entry.done = r.have;
        entry.state = "done";
        stats = mergeStats(stats, r.stats);
        await progress.save();
      }
    };

    // 3. Generate the candidate bank (with headroom).
    await fill(1, true);

    // 4. Semantic de-duplication: paraphrases slip past word overlap ("compound index field order" asked
    //    four ways). One model pass over the whole bank groups same-ask questions; the most likely of
    //    each group survives. Refill only if that leaves fewer than 100.
    if (!progress.value.dedupe || progress.value.dedupe.state !== "done") {
      progress.value.dedupe = { state: "running" };
      await progress.save();
      const removed = await semanticDedupe(plan.id);
      for (const r of removed) {
        have[r.category]--;
        const i = accepted.findIndex((a) => a.norm === normalize(r.question));
        if (i >= 0) accepted.splice(i, 1);
        const entry = progress.value.categories[r.category];
        if (entry) entry.done = Math.min(have[r.category], allocation[r.category]);
      }
      stats = { ...stats, rejected: { ...stats.rejected, near_duplicate: (stats.rejected.near_duplicate ?? 0) + removed.length } };
      progress.value.dedupe = { state: "done", removed: removed.length };
      await progress.save();
      if (total() < TOTAL_QUESTIONS) await fill(1, false);
    }
    await prisma.prepPlan.update({ where: { id: plan.id }, data: { validation: stats as unknown as Prisma.InputJsonValue } });

    if (total() < MIN_QUESTIONS) {
      // Nothing came back from the model at all → it's an outage, quota or configuration problem, not validation.
      const lastAiError = aiErrors.at(-1);
      if (stats.generated === 0 && lastAiError instanceof AppError) {
        throw new AppError(lastAiError.status, lastAiError.code, `${lastAiError.message} Your plan is saved — use Retry once the AI service is available.`);
      }
      throw new AppError(502, "AI_BAD_OUTPUT", `Only ${total()} questions passed quality checks. Retry to continue — the ones already generated are kept.`);
    }

    // 5. Rank the validated bank into the final Top 100 and publish it.
    progress.value.ranking.state = "running";
    await progress.save();
    const rows = await prisma.prepQuestion.findMany({ where: { planId: plan.id } });
    const ranked = rankQuestions(selectTop(rows, allocation));
    const priorities = calibratePriorities(ranked);
    const extras = rows.filter((r) => !ranked.includes(r)).map((r) => r.id);
    await prisma.$transaction([
      ...(extras.length ? [prisma.prepQuestion.deleteMany({ where: { id: { in: extras } } })] : []),
      ...ranked.map((q, i) => prisma.prepQuestion.update({ where: { id: q.id }, data: { rank: i + 1, priority: priorities[i] } })),
    ]);
    progress.value.ranking.state = "done";
    await progress.save();
    await prisma.prepPlan.update({ where: { id: plan.id }, data: { status: "READY", completedAt: new Date() } });
    await logEvent(plan.userId, "prep_plan_ready", { meta: { planId: plan.id, questions: ranked.length } });
  } catch (e) {
    logger.error({ err: e, planId }, "Prep plan failed");
    for (const step of [progress.value.resume, progress.value.dedupe, progress.value.ranking]) if (step?.state === "running") step.state = "failed";
    await progress.save().catch(() => undefined);
    const message = e instanceof AppError ? e.message : "Generation stopped unexpectedly. Retry to continue.";
    await prisma.prepPlan.update({ where: { id: planId }, data: { status: "FAILED", error: message } });
  }
}
