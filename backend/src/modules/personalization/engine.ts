import { Prisma, type Recommendation } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { acquire } from "../../lib/lock.js";
import { generateCandidates, type Candidate } from "./candidates.js";
import { careerContext, conceptStates, loadStudentData, skillRelevance, studentDifficulty, studentFeatures, type StudentData } from "./data.js";
import { actionLabel, explain, REASON_LABEL } from "./explain.js";
import { DIFFICULTY_MODEL, LEVELS, priorityOf, SKILL_STATE_MODEL } from "./model.js";
import { completedOutcome, interviewDelta, LABEL, outcomeSignals, progressOf, type OutcomeDetail } from "./outcomes.js";
import { rank, type EngineStatus } from "./ranker.js";

/**
 * The personalization loop for one student:
 *   records → features → skill state → candidates → rank → recommendations (+ predictions)
 * and, on the way, resolves earlier recommendations into training labels from what happened next.
 * Runs on demand (when the student opens their dashboard), at most every 30 s, and only
 * recomputes when there is new activity or the last run is over 10 minutes old.
 */

const DAY = 86_400_000;
const MIN_INTERVAL_MS = 30_000;
const STALE_MS = 10 * 60_000;
const TOP_N = 12;
const TTL_DAYS = 7;
/** Below this much real evidence the student is in cold start: recommendations lean on resume, role and roadmap. */
export const COLD_START_EVIDENCE = 20;

export async function refreshIfStale(userId: string, opts: { force?: boolean; now?: Date } = {}) {
  // One refresh per student at a time (two tabs, /next + personal sort): a concurrent caller reads
  // what the running refresh produces instead of creating duplicate recommendations.
  const release = await acquire(`lock:refresh:${userId}`, 60_000);
  if (!release) return { refreshed: false };
  try {
    return await refreshIfStaleLocked(userId, opts);
  } finally {
    await release();
  }
}

async function refreshIfStaleLocked(userId: string, opts: { force?: boolean; now?: Date }) {
  const now = opts.now ?? new Date();
  const last = await prisma.recommendation.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } });
  if (last) {
    const age = now.getTime() - last.updatedAt.getTime();
    // Even a forced refresh waits 30 s, so repeated calls can't hammer the database.
    if (age < MIN_INTERVAL_MS) return { refreshed: false };
    if (opts.force) return { refreshed: true, ...(await refresh(userId, now)) };
    const newer = await prisma.learningEvent.findFirst({ where: { userId, createdAt: { gt: last.updatedAt } }, select: { id: true } });
    if (!newer && age < STALE_MS) return { refreshed: false };
  }
  return { refreshed: true, ...(await refresh(userId, now)) };
}

export async function refresh(userId: string, now = new Date()) {
  const d = await loadStudentData(userId, now);
  const career = careerContext(d);
  const student = studentFeatures(d, career);
  const states = conceptStates(d, career);
  const difficulty = studentDifficulty(d, career);

  // Skill state: one row per concept, with the evidence counts and relevance it was computed from.
  await prisma.$transaction(
    states.map((s) => {
      const key = s.conceptId.slice(s.conceptId.indexOf(":") + 1);
      const rel = s.kind === "skill" ? skillRelevance(key, career) : null;
      const data = {
        label: s.label.slice(0, 120),
        mastery: s.mastery,
        confidence: s.confidence,
        forgettingRisk: s.forgettingRisk,
        attempts: s.attempts,
        correctAttempts: s.correctAttempts,
        averageTimeSec: s.averageTimeSec,
        lastSeen: s.lastSeen,
        nextReview: s.nextReview,
        signals: { ...s.signals, kind: s.kind, interviewAverage: s.interviewAverage, interviewAnswers: s.interviewAnswers, ...(rel ?? {}) } as Prisma.InputJsonValue,
        modelVersion: `${SKILL_STATE_MODEL.name}@${SKILL_STATE_MODEL.version}`,
      };
      return prisma.studentSkillState.upsert({ where: { userId_conceptId: { userId, conceptId: s.conceptId } }, create: { userId, conceptId: s.conceptId, ...data }, update: data });
    }),
  );

  await resolveOutcomes(userId, d, now, new Map(states.map((x) => [x.conceptId, x.mastery])));

  const candidates = generateCandidates(d, career, states, difficulty);
  const { ranked, engine } = await rank(candidates, student, userId);
  const top = ranked.slice(0, TOP_N);

  const open = await prisma.recommendation.findMany({ where: { userId, status: "ACTIVE" } });
  const byKey = new Map(open.map((r) => [`${r.action}:${r.itemId}`, r]));
  const keep = new Set(top.map((c) => `${c.action}:${c.itemId}`));
  const saved: Recommendation[] = await prisma.$transaction(
    top.map((c, i) => {
      const data = {
        title: c.title.slice(0, 300),
        href: c.href,
        score: c.score,
        rank: i + 1,
        difficulty: c.difficulty,
        priority: priorityOf(c.score),
        reasons: c.reasons,
        features: { features: c.features, ml: c.mlFeatures, baselineScore: c.baselineScore, facts: c.facts, subject: c.subject, conceptId: c.conceptId, itemType: c.itemType } as unknown as Prisma.InputJsonValue,
        modelName: engine.modelName,
        modelVersion: engine.modelVersion,
        arm: engine.arm,
      };
      const existing = byKey.get(`${c.action}:${c.itemId}`);
      return existing
        ? prisma.recommendation.update({ where: { id: existing.id }, data })
        : prisma.recommendation.create({ data: { userId, action: c.action, itemType: c.itemType, itemId: c.itemId, expiresAt: new Date(now.getTime() + TTL_DAYS * DAY), ...data } });
    }),
  );
  const dropped = open.filter((r) => !keep.has(`${r.action}:${r.itemId}`)).map((r) => r.id);
  if (dropped.length) await prisma.recommendation.updateMany({ where: { id: { in: dropped } }, data: { status: "SUPERSEDED" } });

  // Every score and estimate is recorded with the model that produced it.
  await prisma.mLPrediction.createMany({
    data: [
      ...saved.map((r, i) => ({
        userId,
        recommendationId: r.id,
        modelName: engine.modelName,
        modelVersion: engine.modelVersion,
        target: "RECOMMENDATION_SCORE",
        prediction: r.score,
        // The baseline has no calibrated confidence and none is invented; a trained model's score is itself a probability.
        confidence: null,
        meta: { mode: engine.mode, modelStatus: engine.modelStatus, arm: engine.arm, baselineScore: top[i].baselineScore } as Prisma.InputJsonValue,
      })),
      {
        userId,
        modelName: DIFFICULTY_MODEL.name,
        modelVersion: DIFFICULTY_MODEL.version,
        target: "OPTIMAL_DIFFICULTY",
        prediction: LEVELS.indexOf(difficulty.level),
        confidence: difficulty.confidence,
        meta: { level: difficulty.level, status: difficulty.status, trend: difficulty.trend, byLevel: difficulty.byLevel, observations: difficulty.observations } as Prisma.InputJsonValue,
      },
    ],
  });
  return { engine, difficulty, student, career, evidence: states.reduce((a, s) => a + s.attempts, 0) };
}

/**
 * Moves earlier recommendations along SHOWN → STARTED → SUCCESS | NO_IMPROVEMENT, or ABANDONED /
 * NOT_ACTED_ON when they expire, from what the student actually did. Improvement is measured with
 * the skill state just computed, against the mastery stored when the recommendation was made.
 */
export async function resolveOutcomes(userId: string, d: StudentData, now: Date, masteryNow: Map<string, number>) {
  const open = await prisma.recommendation.findMany({
    // Not yet judged: no outcome, or started. (Explicit: in SQL, NULL never matches NOT IN.)
    where: { userId, OR: [{ outcomeDetail: null }, { outcomeDetail: "STARTED" }], status: { in: ["ACTIVE", "SUPERSEDED", "DISMISSED"] } },
    include: { feedback: { where: { source: "USER", action: { in: ["ACCEPTED", "STARTED"] } }, select: { action: true } } },
  });
  for (const r of open) {
    const p = progressOf(r, d);
    const started = p.started || r.feedback.length > 0 || !!r.startedAt;
    const f = (r.features ?? {}) as { conceptId?: string | null; features?: { mastery?: number } };
    const before = f.features?.mastery;
    const after = f.conceptId ? masteryNow.get(f.conceptId) : undefined;
    const improvement = typeof before === "number" && typeof after === "number" ? Math.round((after - before) * 1000) / 1000 : null;
    const system = (actions: string[]) => prisma.recommendationFeedback.createMany({ data: actions.map((action) => ({ recommendationId: r.id, userId, action, source: "SYSTEM" })) });
    const signals = () => outcomeSignals(r, d, p, { accepted: r.feedback.some((x) => x.action === "ACCEPTED"), started, masteryDelta: improvement }) as unknown as Prisma.InputJsonValue;

    if (p.completed && p.good !== null) {
      const detail = completedOutcome(r.action, p.good, improvement);
      await prisma.$transaction([
        prisma.recommendation.update({ where: { id: r.id }, data: { status: "DONE", outcome: LABEL[detail], outcomeDetail: detail, improvement, outcomeSignals: signals(), startedAt: r.startedAt ?? now, resolvedAt: now } }),
        system(["COMPLETED", detail === "SUCCESS" ? "SUCCESSFUL" : "UNSUCCESSFUL"]),
      ]);
    } else if (r.expiresAt.getTime() <= now.getTime()) {
      // Began and never finished → ABANDONED (a negative). Shown and never started → NOT_ACTED_ON (no label).
      const detail: OutcomeDetail | null = started ? "ABANDONED" : r.shownAt ? "NOT_ACTED_ON" : null;
      await prisma.$transaction([
        prisma.recommendation.update({ where: { id: r.id }, data: { status: "EXPIRED", outcome: detail ? (LABEL[detail] ?? null) : null, outcomeDetail: detail, outcomeSignals: detail ? signals() : undefined, resolvedAt: now } }),
        ...(detail === "ABANDONED" ? [system(["ABANDONED"])] : detail === "NOT_ACTED_ON" ? [system(["IGNORED"])] : []),
      ]);
    } else if (started && !r.startedAt) {
      await prisma.$transaction([prisma.recommendation.update({ where: { id: r.id }, data: { outcomeDetail: "STARTED", startedAt: now } }), system(["STARTED"])]);
    }
  }

  // The next interview often comes days after a recommendation is resolved: fill in the interview
  // change then (a signal only — the label stays as it was).
  const recent = await prisma.recommendation.findMany({ where: { userId, resolvedAt: { gte: new Date(now.getTime() - 30 * DAY) }, outcomeSignals: { not: Prisma.AnyNull } }, select: { id: true, createdAt: true, features: true, outcomeSignals: true } });
  for (const r of recent) {
    const sig = r.outcomeSignals as { interviewDelta?: number | null } | null;
    const conceptId = (r.features as { conceptId?: string | null } | null)?.conceptId;
    if (!sig || sig.interviewDelta != null || !conceptId?.startsWith("skill:")) continue;
    const delta = interviewDelta(d, conceptId.slice(6), r.createdAt);
    if (delta !== null) await prisma.recommendation.update({ where: { id: r.id }, data: { outcomeSignals: { ...sig, interviewDelta: delta } as Prisma.InputJsonValue } });
  }
}

// ───────────────────────── views ─────────────────────────

export function recView(r: Recommendation) {
  const f = (r.features ?? {}) as { facts?: Record<string, string | number | null>; subject?: string; baselineScore?: number };
  const c = { action: r.action as Candidate["action"], subject: f.subject ?? r.title, reasons: r.reasons, facts: f.facts ?? {} };
  return {
    id: r.id,
    action: r.action,
    actionLabel: actionLabel(c.action),
    itemType: r.itemType,
    itemId: r.itemId,
    title: r.title,
    subject: c.subject,
    href: r.href,
    score: r.score,
    rank: r.rank,
    priority: r.priority,
    difficulty: r.difficulty,
    reasons: r.reasons.map((code) => ({ code, label: REASON_LABEL[code] ?? code })),
    why: explain(c),
    modelName: r.modelName,
    modelVersion: r.modelVersion,
    createdAt: r.createdAt,
  };
}

/** The engine status of the student's latest ranking (from its recorded predictions). */
export async function lastEngine(userId: string): Promise<EngineStatus | null> {
  const p = await prisma.mLPrediction.findFirst({ where: { userId, target: "RECOMMENDATION_SCORE" }, orderBy: { createdAt: "desc" } });
  if (!p) return null;
  const meta = (p.meta ?? {}) as { mode?: "ml" | "baseline"; modelStatus?: string; arm?: "ml" | "baseline" };
  return { mode: meta.mode ?? "baseline", modelStatus: meta.modelStatus ?? "unknown", arm: meta.arm ?? "baseline", modelName: p.modelName, modelVersion: p.modelVersion };
}
