import type { Prisma, Recommendation } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { generateCandidates, type Candidate } from "./candidates.js";
import { careerContext, conceptStates, loadStudentData, skillRelevance, studentDifficulty, studentFeatures, type StudentData } from "./data.js";
import { actionLabel, explain, REASON_LABEL } from "./explain.js";
import { DIFFICULTY_MODEL, LEVELS, priorityOf, SKILL_STATE_MODEL } from "./model.js";
import { outcomeOf } from "./outcomes.js";
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

  await resolveOutcomes(userId, d, now);

  const candidates = generateCandidates(d, career, states, difficulty);
  const { ranked, engine } = await rank(candidates, student);
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
        meta: { mode: engine.mode, modelStatus: engine.modelStatus, baselineScore: top[i].baselineScore } as Prisma.InputJsonValue,
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

/** Labels earlier recommendations from what the student did next, and expires stale ones. */
export async function resolveOutcomes(userId: string, d: StudentData, now: Date) {
  const open = await prisma.recommendation.findMany({ where: { userId, outcome: null, status: { in: ["ACTIVE", "SUPERSEDED", "DISMISSED"] } } });
  for (const r of open) {
    const outcome = outcomeOf(r, d);
    if (outcome) {
      await prisma.$transaction([
        prisma.recommendation.update({ where: { id: r.id }, data: { status: "DONE", outcome, resolvedAt: now } }),
        prisma.recommendationFeedback.createMany({
          data: [
            { recommendationId: r.id, userId, action: "COMPLETED", source: "SYSTEM" },
            { recommendationId: r.id, userId, action: outcome === "SUCCESS" ? "SUCCESSFUL" : "UNSUCCESSFUL", source: "SYSTEM" },
          ],
        }),
      ]);
    } else if (r.expiresAt.getTime() <= now.getTime()) {
      // Shown and never acted on → a negative example ("didn't help / didn't happen"). Never shown → no label.
      await prisma.$transaction([
        prisma.recommendation.update({ where: { id: r.id }, data: { status: "EXPIRED", outcome: r.shownAt ? "FAILURE" : null, resolvedAt: now } }),
        ...(r.shownAt ? [prisma.recommendationFeedback.create({ data: { recommendationId: r.id, userId, action: "IGNORED", source: "SYSTEM" } })] : []),
      ]);
    }
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
  const meta = (p.meta ?? {}) as { mode?: "ml" | "baseline"; modelStatus?: string };
  return { mode: meta.mode ?? "baseline", modelStatus: meta.modelStatus ?? "unknown", modelName: p.modelName, modelVersion: p.modelVersion };
}
