import type { PrepCategory, Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { env } from "../../config/env.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { LockBusyError, withLock } from "../../lib/lock.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, conflict, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { allocateQuestions, calibratePriorities, PREP_CATEGORIES, priorityFor, rankQuestions, TOTAL_QUESTIONS } from "./allocation.js";
import { ensureResumeIntelligence } from "./intelligence.service.js";
import { BAND_LABEL, ladderOrder, rotate, stagePlan, STAGES, type ExperienceBand } from "./ladder.js";
import { buildProfile, type CandidateProfile } from "./profile.js";
import { prepPrompts } from "./prompts.js";
import { targetRole, type TargetRoleKey } from "./roles.js";
import { dedupeSchema, questionBatchSchema } from "./schemas.js";
import { contentTokens, normalize } from "./text.js";
import { emptyStats, isDuplicate, mergeStats, PREVIOUS_THRESHOLD, validateBatch, type ValidationStats, type ValidQuestion } from "./validator.js";

const BATCH = 10;
/** Candidates generated per allocated question, so de-dup and selection can drop the weakest. */
const OVER_GENERATE = 1.3;
const AI_TIMEOUT = 120_000;
/** Concurrent model calls per plan. */
const AI_CONCURRENCY = 5;
/** A stage that can't reach this share of its questions fails rather than publishing a thin stage. */
const MIN_STAGE_SHARE = 0.6;
/** Questions from earlier plans shown to the model as "ask something different" (all of them are still checked). */
const PREVIOUS_IN_PROMPT = 40;
/** Earlier-plan questions included in each stage's semantic de-duplication pass. */
const PREVIOUS_IN_DEDUPE = 100;

type StepState = "pending" | "running" | "done" | "failed";
export interface PlanProgress {
  resume: { state: StepState; chunks?: number };
  skills: { state: StepState; count?: number; names?: string[] };
  projects: { state: StepState; count?: number; names?: string[] };
  /** Plans made before the ladder: per-category progress. */
  categories: Partial<Record<PrepCategory, { target: number; done: number; state: StepState }>>;
  /** Experience band the plan is pitched at. */
  level?: { band: ExperienceBand; label: string; months: number };
  /** The ladder: each stage is written, checked and published before the next starts. */
  stages?: { stage: number; label: string; target: number; done: number; published: number; state: StepState }[];
  /** How many earlier plans for this target were avoided, and how many questions still had to repeat. */
  fresh?: { previousPlans: number; repeated: number };
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
type CreatePlanInput = { resumeId: string; jobId?: string; targetRole?: TargetRoleKey; regenerate?: boolean };

export async function createPlan(userId: string, input: CreatePlanInput) {
  if (!!input.jobId === !!input.targetRole) throw badRequest("Choose either a job description or a target role.");
  const resume = await prisma.careerResume.findFirst({ where: { id: input.resumeId, userId } });
  if (!resume) throw notFound("Resume");
  const job = input.jobId ? await prisma.jobTarget.findFirst({ where: { id: input.jobId, userId } }) : null;
  if (input.jobId && !job) throw notFound("Job description");

  // One create at a time per user: the "already exists / too many running / daily limit" checks
  // below would otherwise race between two tabs or a double-click.
  return withLock(`lock:prep-create:${userId}`, 15_000, () => createPlanLocked(userId, input, resume, job), 5_000).catch((e) => {
    if (e instanceof LockBusyError) throw conflict("A preparation plan is already being created. Try again in a moment.");
    throw e;
  });
}

async function createPlanLocked(userId: string, input: CreatePlanInput, resume: { id: string }, job: { id: string; title: string; company: string | null } | null) {
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

  const title = job ? `${job.title}${job.company ? ` · ${job.company}` : ""}` : targetRole(input.targetRole)!.label;
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
  // Conditional: a double-click queues it once.
  const { count } = await prisma.prepPlan.updateMany({ where: { id: plan.id, status: "FAILED" }, data: { status: "QUEUED", error: null } });
  if (!count) return { queued: true };
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
  /** The ladder stage being written. */
  stage?: (typeof STAGES)[number];
  /** Earlier plans' questions: rejected as "asked before" so a regenerated plan is a fresh set. */
  previous?: { norm: string; tokens: Set<string> }[];
  previousText?: string[];
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
      stage: opts.stage,
      previous: opts.previousText?.slice(0, PREVIOUS_IN_PROMPT).map((q) => q.slice(0, 140)),
    });
    let items: unknown[];
    try {
      items = (await opts.limit(() => aiJson(`prep_${opts.category.toLowerCase()}`, p.system, p.user, questionBatchSchema, 12000, { timeoutMs: AI_TIMEOUT, fast: true }))).questions;
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
      stage: opts.stage,
      previous: opts.previous,
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
 * Asks the model which questions are the same ask in different words, within one stage's
 * candidates and against everything already published — and against the candidate's previous
 * plan, so a regenerated plan doesn't reword old questions. A candidate that repeats a published
 * or previous question is dropped; otherwise the most likely of each group survives (resume-anchored
 * wins ties). Published questions are never removed. Never fails the plan.
 */
async function semanticDedupe(planId: string, stage: number, previous: string[] = []) {
  const candidates = await prisma.prepQuestion.findMany({ where: { planId, stage, rank: 0 }, select: { id: true, question: true, category: true, probability: true } });
  if (candidates.length < 2) return [];
  const published = await prisma.prepQuestion.findMany({ where: { planId, rank: { gt: 0 } }, select: { id: true, question: true } });
  const items = [
    ...candidates.map((c) => ({ ...c, published: false })),
    ...published.map((p) => ({ ...p, category: "SKILL" as PrepCategory, probability: 1, published: true })),
    ...previous.slice(0, PREVIOUS_IN_DEDUPE).map((question, i) => ({ id: `previous-${i}`, question, category: "SKILL" as PrepCategory, probability: 1, published: true })),
  ];
  const ids = items.map((_, i) => `q${i + 1}`);
  const p = prepPrompts.dedupe(items.map((r, i) => ({ id: ids[i], question: r.question })));
  let groups: string[][];
  try {
    groups = (await aiJson("prep_dedupe", p.system, p.user, dedupeSchema, 6000, { timeoutMs: AI_TIMEOUT, fast: true })).groups;
  } catch (e) {
    logger.warn({ err: e, planId, stage }, "Semantic de-duplication skipped");
    return [];
  }
  const byId = new Map(ids.map((id, i) => [id, items[i]]));
  const anchored = (c: PrepCategory) => (c === "PROJECT" || c === "CLAIM" || c === "ACHIEVEMENT" ? 1 : 0);
  const remove = new Map<string, (typeof items)[number]>();
  for (const g of groups) {
    const members = [...new Set(g)].map((id) => byId.get(id)).filter((r): r is (typeof items)[number] => !!r && !remove.has(r.id));
    if (members.length < 2) continue;
    const fresh = members.filter((m) => !m.published).sort((a, b) => b.probability - a.probability || anchored(b.category) - anchored(a.category));
    for (const m of members.some((m) => m.published) ? fresh : fresh.slice(1)) remove.set(m.id, m);
  }
  // Guard against a model that lumps everything together: never drop more than a third in one pass.
  const dropped = [...remove.values()].slice(0, Math.floor(candidates.length / 3));
  if (dropped.length) await prisma.prepQuestion.deleteMany({ where: { id: { in: dropped.map((d) => d.id) } } });
  return dropped;
}

/**
 * Picks the final 100: the most likely questions of each category up to its allocation, then
 * the best remaining questions (any category) for slots a thin category couldn't fill.
 */
export function selectTop<T extends { category: PrepCategory; probability: number; priority: PrepPriorityLike; difficulty: number }>(rows: T[], allocation: Record<PrepCategory, number>, cap = TOTAL_QUESTIONS) {
  const picked = new Set<T>();
  for (const c of PREP_CATEGORIES) {
    rows.filter((r) => r.category === c).sort((a, b) => b.probability - a.probability).slice(0, allocation[c] ?? 0).forEach((r) => picked.add(r));
  }
  for (const r of rankQuestions(rows.filter((x) => !picked.has(x)))) {
    if (picked.size >= cap) break;
    picked.add(r);
  }
  return [...picked].slice(0, cap);
}
type PrepPriorityLike = Parameters<typeof rankQuestions>[0][number]["priority"];

const toRow = (planId: string, q: ValidQuestion): Prisma.PrepQuestionCreateManyInput => ({ planId, ...q });

/**
 * Priority bands are relative to the candidate's own bank (see calibratePriorities). Re-run after
 * each stage is published so the bands always describe everything visible so far.
 */
async function recalibrate(planId: string) {
  const rows = await prisma.prepQuestion.findMany({ where: { planId, rank: { gt: 0 } }, select: { id: true, probability: true, category: true, difficulty: true, priority: true } });
  const ranked = rankQuestions(rows.map((r) => ({ ...r, current: r.priority, priority: priorityFor(r.probability) })));
  const bands = calibratePriorities(ranked);
  const changed = ranked.map((r, i) => ({ id: r.id, priority: bands[i], current: r.current })).filter((c) => c.priority !== c.current);
  if (changed.length) await prisma.$transaction(changed.map((c) => prisma.prepQuestion.update({ where: { id: c.id }, data: { priority: c.priority } })));
}

export async function runPlan(planId: string) {
  const plan = await prisma.prepPlan.findUnique({ where: { id: planId }, include: { job: true } });
  if (!plan) return;
  // Claim: only a QUEUED plan is run, so a duplicate or stale job exits instead of running it twice.
  const { count } = await prisma.prepPlan.updateMany({ where: { id: plan.id, status: "QUEUED" }, data: { status: "RUNNING", error: null } });
  if (!count) {
    logger.info({ planId, status: plan.status }, "Prep plan not claimed (already running or done)");
    return;
  }
  const progress = new ProgressWriter(plan.id, { ...initialProgress(), ...(plan.progress as unknown as Partial<PlanProgress>) });

  try {
    // 1. Resume intelligence (cached per resume). What was found is shown while the resume is read.
    progress.value.resume.state = "running";
    await progress.save();
    const intel = await ensureResumeIntelligence(plan.resumeId);
    const profile = buildProfile(intel, { job: plan.job, role: (plan.targetRole as TargetRoleKey | null) ?? null });
    progress.value.resume = { state: "done", chunks: intel.chunks.length };
    progress.value.skills = { state: "done", count: profile.counts.skills, names: profile.found.skills };
    progress.value.projects = { state: "done", count: profile.counts.projects, names: profile.found.projects };
    progress.value.level = { band: profile.band, label: BAND_LABEL[profile.band], months: intel.parsed.totalExperienceMonths };

    // 2. Questions per category (from what the resume contains), then per ladder stage (from experience).
    const allocation =
      Object.keys((plan.allocation ?? {}) as object).length > 0
        ? (plan.allocation as Record<PrepCategory, number>)
        : allocateQuestions({ projects: profile.counts.projects, claims: profile.counts.claims, achievements: profile.counts.achievements, gapSkills: profile.counts.gapSkills });
    const matrix = stagePlan(allocation, profile.band);
    await prisma.prepPlan.update({ where: { id: plan.id }, data: { allocation, band: profile.band, model: process.env.AI_MODEL ?? process.env.AI_PROVIDER ?? null } });

    // 3. A regenerated plan is a fresh set: earlier plans for the same resume + target are avoided.
    const sameTarget = { userId: plan.userId, resumeId: plan.resumeId, jobId: plan.jobId, targetRole: plan.targetRole, id: { not: plan.id }, createdAt: { lt: plan.createdAt } };
    const [earlier, variant] = await Promise.all([
      prisma.prepPlan.findMany({ where: sameTarget, orderBy: { createdAt: "desc" }, take: 3, select: { id: true } }),
      prisma.prepPlan.count({ where: sameTarget }),
    ]);
    const previousRows = earlier.length ? await prisma.prepQuestion.findMany({ where: { planId: { in: earlier.map((e) => e.id) }, rank: { gt: 0 } }, orderBy: [{ plan: { createdAt: "desc" } }, { rank: "asc" }], select: { question: true }, take: 300 }) : [];
    const previous = previousRows.map((q) => ({ norm: normalize(q.question), tokens: contentTokens(q.question) }));
    const previousText = rotate(previousRows.map((q) => q.question), variant * 7);

    // Questions saved by an earlier (failed) run are kept. Unpublished candidates from before the ladder can't be placed in a stage.
    if (!plan.band) await prisma.prepQuestion.deleteMany({ where: { planId: plan.id, rank: 0, stage: 0 } });
    const existing = await prisma.prepQuestion.findMany({ where: { planId: plan.id }, select: { question: true, category: true, stage: true, rank: true } });
    const accepted = existing.map((q) => ({ norm: normalize(q.question), tokens: contentTokens(q.question) }));
    const avoid = existing.map((q) => q.question);
    let nextRank = existing.reduce((m, q) => Math.max(m, q.rank), 0) + 1;

    const stageTarget = (stage: number) => Object.values(matrix[stage as 1 | 2 | 3]).reduce((a, b) => a + b, 0);
    progress.value.stages ??= STAGES.map((st) => ({ stage: st.stage, label: st.label, target: stageTarget(st.stage), done: 0, published: 0, state: "pending" as StepState }));
    progress.value.fresh = { previousPlans: earlier.length, repeated: progress.value.fresh?.repeated ?? 0 };
    await progress.save();

    let stats: ValidationStats = (plan.validation as unknown as ValidationStats | null) ?? emptyStats();
    const limit = limiter(AI_CONCURRENCY);
    const aiErrors: unknown[] = [];
    const ctx = { planId: plan.id, profile, resumeText: intel.resume.text, accepted, avoid, limit, aiErrors, previousText };

    for (const st of STAGES) {
      const entry = progress.value.stages.find((e) => e.stage === st.stage)!;
      if (entry.state === "done") continue;
      const cells = matrix[st.stage];
      const target = stageTarget(st.stage);
      const have = Object.fromEntries(PREP_CATEGORIES.map((c) => [c, existing.filter((q) => q.stage === st.stage && q.rank === 0 && q.category === c).length])) as Record<PrepCategory, number>;
      const total = () => Object.values(have).reduce((a, b) => a + b, 0);
      entry.state = "running";
      entry.target = target;
      entry.done = Math.min(total(), target);
      await progress.save();

      const run = async (category: PrepCategory, want: number, minimum: number, avoidEarlier: boolean) => {
        const r = await generateCategory({
          ...ctx, category, have: have[category], target: want, minimum, topUps: 1, stage: st,
          previous: avoidEarlier ? previous : undefined,
          previousText: avoidEarlier ? previousText : undefined,
          // Each regeneration and each stage leads with different resume items.
          focus: profile.focus[category] ? rotate(profile.focus[category]!, variant * 3 + st.stage) : undefined,
          onAccepted: (n) => {
            have[category] = n;
            entry.done = Math.min(total(), target);
            return progress.save();
          },
        });
        have[category] = r.have;
        stats = mergeStats(stats, r.stats);
      };
      // Shortfall (thin resume, validator drops) is filled by the flexible categories that suit this stage.
      const flexible: PrepCategory[] = st.stage === 3 ? ["SCENARIO", "SKILL", "CONCEPTUAL"] : ["SKILL", "CONCEPTUAL", "GENERAL"];
      const topUp = async (avoidEarlier: boolean) => {
        for (const c of flexible) {
          if (total() >= target) break;
          const want = have[c] + target - total();
          await run(c, want, want, avoidEarlier);
        }
      };

      // 4a. The stage's candidates, with headroom for de-duplication.
      await Promise.all(PREP_CATEGORIES.filter((c) => cells[c] > have[c]).map((c) => run(c, Math.ceil(cells[c] * OVER_GENERATE), cells[c], true)));
      await topUp(true);
      // A resume can only support so many distinct questions: rather than publish a thin stage,
      // allow questions from earlier plans (the plan reports how many repeated).
      if (total() < target && previous.length) await topUp(false);

      // 4b. Semantic de-duplication within the stage and against what's already published.
      progress.value.dedupe = { state: "running", removed: progress.value.dedupe?.removed ?? 0 };
      await progress.save();
      const removed = await semanticDedupe(plan.id, st.stage, previousRows.map((q) => q.question));
      for (const r of removed) {
        have[r.category]--;
        const i = accepted.findIndex((a) => a.norm === normalize(r.question));
        if (i >= 0) accepted.splice(i, 1);
      }
      stats = { ...stats, rejected: { ...stats.rejected, near_duplicate: (stats.rejected.near_duplicate ?? 0) + removed.length } };
      progress.value.dedupe = { state: "done", removed: (progress.value.dedupe.removed ?? 0) + removed.length };
      if (total() < target) await topUp(true);
      if (total() < target && previous.length) await topUp(false);
      await prisma.prepPlan.update({ where: { id: plan.id }, data: { validation: stats as unknown as Prisma.InputJsonValue } });

      if (total() < Math.ceil(target * MIN_STAGE_SHARE)) {
        // Nothing came back from the model at all → it's an outage, quota or configuration problem, not validation.
        const lastAiError = aiErrors.at(-1);
        if (stats.generated === 0 && lastAiError instanceof AppError) {
          throw new AppError(lastAiError.status, lastAiError.code, `${lastAiError.message} Your plan is saved — use Retry once the AI service is available.`);
        }
        throw new AppError(502, "AI_BAD_OUTPUT", `Only ${total()} ${st.label.toLowerCase()} questions passed quality checks. Retry to continue — the ones already generated are kept.`);
      }

      // 4c. Publish the stage: easier first, then most likely. It is visible as soon as this commits.
      const rows = await prisma.prepQuestion.findMany({ where: { planId: plan.id, stage: st.stage, rank: 0 } });
      const chosen = ladderOrder(selectTop(rows, cells, target));
      const extras = rows.filter((r) => !chosen.includes(r)).map((r) => r.id);
      await prisma.$transaction([
        ...(extras.length ? [prisma.prepQuestion.deleteMany({ where: { id: { in: extras } } })] : []),
        ...chosen.map((q, i) => prisma.prepQuestion.update({ where: { id: q.id }, data: { rank: nextRank + i } })),
      ]);
      nextRank += chosen.length;
      await recalibrate(plan.id);
      progress.value.fresh.repeated += previous.length ? chosen.filter((q) => isDuplicate(q.question, previous, PREVIOUS_THRESHOLD)).length : 0;
      entry.state = "done";
      entry.done = entry.published = chosen.length;
      await progress.save();
      await logEvent(plan.userId, "prep_stage_published", { meta: { planId: plan.id, stage: st.stage, questions: chosen.length } });
    }

    progress.value.ranking.state = "done";
    await progress.save();
    const published = nextRank - 1;
    await prisma.prepPlan.update({ where: { id: plan.id }, data: { status: "READY", completedAt: new Date() } });
    await logEvent(plan.userId, "prep_plan_ready", { meta: { planId: plan.id, questions: published, band: profile.band } });
  } catch (e) {
    logger.error({ err: e, planId }, "Prep plan failed");
    for (const step of [progress.value.resume, progress.value.dedupe, progress.value.ranking, ...(progress.value.stages ?? [])]) if (step?.state === "running") step.state = "failed";
    await progress.save().catch(() => undefined);
    const message = e instanceof AppError ? e.message : "Generation stopped unexpectedly. Retry to continue.";
    // The plan may have been deleted meanwhile: updateMany never throws for a missing row.
    await prisma.prepPlan.updateMany({ where: { id: planId, status: "RUNNING" }, data: { status: "FAILED", error: message } });
  }
}
