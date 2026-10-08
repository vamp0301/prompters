import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { canonicalSkill } from "../prep/text.js";
import { refreshIfStale } from "./engine.js";
import { LEVELS, levelOf, type DifficultyLevel } from "./model.js";

/**
 * "For you" order for the Top-100: the same questions, re-ranked by this student's skill state.
 * Additive to the existing API (sort=personal); without personalization data it still works.
 */

export const TOP100_WEIGHTS = { skillWeakness: 0.25, importance: 0.2, relevance: 0.15, previousPerformance: 0.15, readiness: 0.15, interviewWeakness: 0.1 } as const;

type Q = { id: string; skill: string; difficulty: number; probability: number };
type Signals = { jobRelevance?: number; required?: boolean; inRole?: boolean; onResume?: boolean; interviewAverage?: number | null };

export async function personalScores(userId: string, questions: Q[]) {
  // Make sure the skill state is current; personalization must never break the Top-100.
  await refreshIfStale(userId).catch((e) => logger.warn({ err: e, userId }, "Personalization refresh failed; Top-100 uses stored state"));
  const [states, attempts, diff] = await Promise.all([
    prisma.studentSkillState.findMany({ where: { userId, conceptId: { startsWith: "skill:" } } }),
    prisma.prepAttempt.groupBy({ by: ["questionId"], where: { userId, questionId: { in: questions.map((q) => q.id) } }, _avg: { score: true } }),
    prisma.mLPrediction.findFirst({ where: { userId, target: "OPTIMAL_DIFFICULTY" }, orderBy: { createdAt: "desc" } }),
  ]);
  const state = new Map(states.map((s) => [s.conceptId.slice(6), s]));
  const avg = new Map(attempts.map((a) => [a.questionId, a._avg.score]));
  const optimal = ((diff?.meta ?? null) as { level?: DifficultyLevel } | null)?.level ?? null;

  return new Map(
    questions.map((q) => {
      const s = state.get(canonicalSkill(q.skill));
      const sig = (s?.signals ?? {}) as Signals;
      const reasons: string[] = [];
      const mastery = s?.mastery ?? 0.3;
      const skillWeakness = 1 - mastery;
      if (!s || s.attempts === 0) reasons.push("not_yet_practised");
      else if (mastery < 0.5) reasons.push("weak_skill");
      const interviewWeakness = sig.interviewAverage != null ? 1 - sig.interviewAverage : 0;
      if (sig.interviewAverage != null && sig.interviewAverage < 0.6) reasons.push("interview_weakness");
      const relevance = sig.jobRelevance ?? 0.5;
      if (sig.required) reasons.push("in_job_description");
      else if (sig.inRole) reasons.push("high_role_relevance");
      if (sig.onResume) reasons.push("on_your_resume");
      if (q.probability >= 0.8) reasons.push("often_asked");
      const previous = avg.get(q.id);
      const previousPerformance = previous == null ? 1 : previous < 70 ? 0.8 : 0.1;
      if (previous != null && previous < 70) reasons.push("needs_retry");
      // Readiness: how close the question is to the level the student succeeds at.
      const gap = optimal ? Math.abs(LEVELS.indexOf(levelOf(q.difficulty)) - LEVELS.indexOf(optimal)) : q.difficulty <= 3 ? 0 : 1;
      const readiness = 1 - gap / 2;
      if (gap === 0) reasons.push("matches_your_level");
      const f = { skillWeakness, importance: q.probability, relevance, previousPerformance, readiness, interviewWeakness };
      const score = Math.round((Object.keys(TOP100_WEIGHTS) as (keyof typeof f)[]).reduce((a, k) => a + TOP100_WEIGHTS[k] * f[k], 0) * 10000) / 10000;
      return [q.id, { score, reasons }];
    }),
  );
}
