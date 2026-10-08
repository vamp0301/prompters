import type { Candidate } from "./candidates.js";
import { ACTIONS } from "./candidates.js";
import type { StudentFeatures } from "./data.js";
import { mlRank } from "./ml-client.js";
import { BASELINE_RANKER, baselineScore } from "./model.js";

/**
 * Ranking. The transparent weighted baseline always runs; a trained model (from the Python
 * service) replaces its scores when — and only when — one exists and answers in time. The API
 * and the stored shape are the same either way; every score records which model produced it.
 */

/** The ML feature vector, in a fixed order shared with the training export. */
export const ML_FEATURES = [
  "skillGap", "jobRelevance", "forgettingRisk", "prerequisiteReadiness", "interviewRelevance", "successProbability",
  "mastery", "confidence", "questionImportance", "dueForReview",
  ...ACTIONS.map((a) => `action_${a}`),
  "s_activeDays7d", "s_activeDays30d", "s_studyConsistency", "s_quizAccuracy30d", "s_buildSuccessRate", "s_interviewAverage", "s_prepAverage", "s_daysSinceLastActive",
] as const;

/** Missing student signals are -1 ("unknown"), never a guessed value — tree models can split on it. */
export function mlVector(c: Pick<Candidate, "action" | "features">, s: StudentFeatures): Record<string, number> {
  const v: Record<string, number> = { ...c.features };
  for (const a of ACTIONS) v[`action_${a}`] = c.action === a ? 1 : 0;
  const n = (x: number | null) => (x === null ? -1 : x);
  Object.assign(v, {
    s_activeDays7d: s.activeDays7d,
    s_activeDays30d: s.activeDays30d,
    s_studyConsistency: s.studyConsistency,
    s_quizAccuracy30d: n(s.quizAccuracy30d),
    s_buildSuccessRate: n(s.buildSuccessRate),
    s_interviewAverage: n(s.interviewAverage),
    s_prepAverage: n(s.prepAverage),
    s_daysSinceLastActive: n(s.daysSinceLastActive),
  });
  return Object.fromEntries(ML_FEATURES.map((k) => [k, v[k] ?? 0]));
}

export interface EngineStatus {
  /** ml = a trained model ranked these; baseline = the transparent weighted formula. */
  mode: "ml" | "baseline";
  /** trained | cold_start | not_configured | timeout | unavailable | error */
  modelStatus: string;
  modelName: string;
  modelVersion: string;
}

export interface Ranked extends Candidate {
  score: number;
  baselineScore: number;
  mlFeatures: Record<string, number>;
}

export async function rank(candidates: Candidate[], student: StudentFeatures): Promise<{ ranked: Ranked[]; engine: EngineStatus }> {
  const rows = candidates.map((c, i) => ({ c, id: String(i), base: baselineScore(c.features), vec: mlVector(c, student) }));
  const ml = rows.length ? await mlRank(rows.map((r) => ({ id: r.id, features: r.vec }))) : { ok: false as const, reason: "no_candidates" };
  const useMl = ml.ok && rows.every((r) => typeof ml.scores[r.id] === "number");
  const ranked = rows
    .map((r) => ({ ...r.c, baselineScore: r.base, score: useMl && ml.ok ? Math.round(ml.scores[r.id] * 10000) / 10000 : r.base, mlFeatures: r.vec }))
    .sort((a, b) => b.score - a.score || b.baselineScore - a.baselineScore || a.itemId.localeCompare(b.itemId));
  const engine: EngineStatus =
    useMl && ml.ok
      ? { mode: "ml", modelStatus: "trained", modelName: ml.modelName, modelVersion: ml.modelVersion }
      : { mode: "baseline", modelStatus: ml.ok ? "error" : ml.reason, modelName: BASELINE_RANKER.name, modelVersion: BASELINE_RANKER.version };
  return { ranked, engine };
}
