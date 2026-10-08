/**
 * Deterministic estimators behind personalization. Pure functions of the evidence and `now`, so the
 * same database always produces the same features (and tests can pin them exactly). Each one is a
 * transparent baseline meant to be replaced by a learned model (e.g. Bayesian Knowledge Tracing)
 * without changing its inputs or outputs.
 */

export const SKILL_STATE_MODEL = { name: "skill-state-baseline", version: "1" } as const;
export const DIFFICULTY_MODEL = { name: "difficulty-baseline", version: "1" } as const;

const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / DAY);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

// ───────────────────────── skill state ─────────────────────────

export type EvidenceSource = "quiz" | "review" | "build" | "prep" | "interview" | "explain";

/** One piece of evidence about a concept: a quiz, a review, a build, a practice or interview answer… */
export interface Observation {
  source: EvidenceSource;
  /** 0–1 (a quiz percentage, a practice score, tests passed…). */
  score: number;
  at: Date;
  /** How much this kind of evidence counts (a live interview answer counts more than one quiz). */
  weight: number;
  timeSec?: number | null;
  /** 1 fundamental … 5 architecture, when known. */
  difficulty?: number | null;
}

/** How much each kind of evidence counts. */
export const EVIDENCE_WEIGHT: Record<EvidenceSource, number> = { quiz: 1, review: 1.2, build: 0.8, prep: 1, interview: 1.5, explain: 1 };

/** Evidence older than this counts half as much (and keeps halving). */
const HALF_LIFE_DAYS = 60;
/** "Correct" for counting purposes. */
const CORRECT = 0.7;
/** Review is due when estimated retention falls to this. */
const REVIEW_RETENTION = 0.7;

export interface SkillStateEstimate {
  mastery: number;
  confidence: number;
  forgettingRisk: number;
  attempts: number;
  correctAttempts: number;
  averageTimeSec: number | null;
  lastSeen: Date | null;
  nextReview: Date | null;
  signals: Record<EvidenceSource, number> & { resumePrior: boolean };
}

/**
 * Mastery is a recency-weighted average of every observation, pulled towards a prior (which may
 * come from the resume) by a small pseudo-weight — so one quiz moves it but never decides it.
 * Confidence grows with the amount of real evidence. Forgetting follows an exponential curve
 * whose stability doubles with each successful recall (on separate days) and grows with mastery.
 */
export function estimateSkillState(
  observations: Observation[],
  opts: { now: Date; prior: number; priorWeight: number; resumePrior?: boolean; scheduledReview?: Date | null },
): SkillStateEstimate {
  const obs = [...observations].sort((a, b) => a.at.getTime() - b.at.getTime());
  let sumW = 0;
  let sumWS = 0;
  for (const o of obs) {
    const w = o.weight * 0.5 ** (daysBetween(o.at, opts.now) / HALF_LIFE_DAYS);
    sumW += w;
    sumWS += w * clamp01(o.score);
  }
  const mastery = (opts.prior * opts.priorWeight + sumWS) / (opts.priorWeight + sumW);
  const confidence = obs.length ? 1 - Math.exp(-sumW / 3) : 0;
  const correct = obs.filter((o) => o.score >= CORRECT);
  const timed = obs.filter((o) => typeof o.timeSec === "number" && o.timeSec > 0);
  const lastSeen = obs.length ? obs[obs.length - 1].at : null;
  // Successful recalls: correct answers on distinct days (cramming in one sitting is one recall).
  const recallDays = new Set(correct.map((o) => o.at.toISOString().slice(0, 10))).size;
  const stabilityDays = 2 * 2 ** Math.min(recallDays, 6) * (0.5 + mastery);
  const forgettingRisk = lastSeen ? 1 - Math.exp(-daysBetween(lastSeen, opts.now) / stabilityDays) : 0;
  const computedReview = lastSeen ? new Date(lastSeen.getTime() + stabilityDays * Math.log(1 / REVIEW_RETENTION) * DAY) : null;
  const signals = { quiz: 0, review: 0, build: 0, prep: 0, interview: 0, explain: 0, resumePrior: !!opts.resumePrior };
  for (const o of obs) signals[o.source]++;
  return {
    mastery: round(clamp01(mastery)),
    confidence: round(confidence),
    forgettingRisk: round(clamp01(forgettingRisk)),
    attempts: obs.length,
    correctAttempts: correct.length,
    averageTimeSec: timed.length ? round(timed.reduce((a, o) => a + (o.timeSec ?? 0), 0) / timed.length, 1) : null,
    lastSeen,
    // The curriculum's spaced-review schedule stays the source of truth for topics that have one.
    nextReview: opts.scheduledReview ?? computedReview,
    signals,
  };
}

// ───────────────────────── difficulty ─────────────────────────

export type DifficultyLevel = "easy" | "medium" | "hard";
export const LEVELS: DifficultyLevel[] = ["easy", "medium", "hard"];
export const levelOf = (difficulty: number): DifficultyLevel => (difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard");

export interface DifficultyEstimate {
  level: DifficultyLevel;
  confidence: number;
  /** learned = from the student's own answers; cold_start = from onboarding/experience only. */
  status: "learned" | "cold_start";
  /** Recent-performance nudge: step up, step down or stay. */
  trend: "increase" | "decrease" | "hold";
  byLevel: Record<DifficultyLevel, { answers: number; successRate: number | null }>;
  observations: number;
}

/** Fewer answers than this and the student's level comes from onboarding, not their performance. */
export const MIN_DIFFICULTY_OBSERVATIONS = 5;
/** Target success rate: hard enough to learn from, easy enough to succeed (≈ 70%). */
const TARGET_SUCCESS = 0.7;

/**
 * Optimal difficulty = the hardest level where the student's recency-weighted success rate
 * (Laplace-smoothed) is still at least 70%. Very slow answers count slightly less. With too few
 * answers it falls back to the onboarding hint and says so (cold_start).
 */
export function estimateDifficulty(observations: Observation[], opts: { now: Date; coldStartHint: DifficultyLevel }): DifficultyEstimate {
  const graded = observations.filter((o) => typeof o.difficulty === "number");
  const times = graded.map((o) => o.timeSec).filter((t): t is number => typeof t === "number" && t > 0).sort((a, b) => a - b);
  const medianTime = times.length ? times[Math.floor(times.length / 2)] : null;
  const acc: Record<DifficultyLevel, { w: number; ws: number; n: number }> = { easy: { w: 0, ws: 0, n: 0 }, medium: { w: 0, ws: 0, n: 0 }, hard: { w: 0, ws: 0, n: 0 } };
  for (const o of graded) {
    const slow = medianTime && o.timeSec && o.timeSec > 3 * medianTime ? 0.9 : 1;
    const w = 0.5 ** (daysBetween(o.at, opts.now) / 45);
    const b = acc[levelOf(o.difficulty!)];
    b.w += w;
    b.ws += w * clamp01(o.score) * slow;
    b.n++;
  }
  const rate = (l: DifficultyLevel) => (acc[l].n ? (acc[l].ws + 1) / (acc[l].w + 2) : null);
  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, { answers: acc[l].n, successRate: rate(l) === null ? null : round(rate(l)!) }])) as DifficultyEstimate["byLevel"];

  if (graded.length < MIN_DIFFICULTY_OBSERVATIONS) {
    return { level: opts.coldStartHint, confidence: 0.2, status: "cold_start", trend: "hold", byLevel, observations: graded.length };
  }
  let level: DifficultyLevel = "easy";
  for (const l of LEVELS) if (acc[l].n >= 2 && (rate(l) ?? 0) >= TARGET_SUCCESS) level = l;
  // Recent answers at that level: clearly too easy → step up; clearly too hard → step down.
  const recent = graded.filter((o) => levelOf(o.difficulty!) === level).slice(-5);
  const recentAvg = recent.length ? recent.reduce((a, o) => a + o.score, 0) / recent.length : null;
  const trend: DifficultyEstimate["trend"] = recentAvg === null ? "hold" : recentAvg >= 0.85 && level !== "hard" ? "increase" : recentAvg <= 0.4 && level !== "easy" ? "decrease" : "hold";
  return { level, confidence: round(Math.min(0.95, graded.length / 20)), status: "learned", trend, byLevel, observations: graded.length };
}

/** The student's chance of success at a level, from the same estimate (prior 0.5 where unseen). */
export const successAt = (d: DifficultyEstimate, level: DifficultyLevel) => d.byLevel[level].successRate ?? (d.status === "cold_start" ? (LEVELS.indexOf(level) <= LEVELS.indexOf(d.level) ? 0.7 : 0.45) : 0.5);

// ───────────────────────── ranking ─────────────────────────

/** What the ranker sees for each candidate (all 0–1). The same vector is stored for training. */
export interface CandidateFeatures {
  skillGap: number;
  jobRelevance: number;
  forgettingRisk: number;
  prerequisiteReadiness: number;
  interviewRelevance: number;
  successProbability: number;
  mastery: number;
  confidence: number;
  questionImportance: number;
  dueForReview: number;
}

export const BASELINE_RANKER = { name: "baseline-weighted", version: "1" } as const;

/** The transparent baseline (weights from the product spec). A trained ranker replaces this function, not the API. */
export const BASELINE_WEIGHTS = { skillGap: 0.3, jobRelevance: 0.2, forgettingRisk: 0.15, prerequisiteReadiness: 0.15, interviewRelevance: 0.1, successProbability: 0.1 } as const;

export function baselineScore(f: CandidateFeatures) {
  return round(
    (Object.keys(BASELINE_WEIGHTS) as (keyof typeof BASELINE_WEIGHTS)[]).reduce((a, k) => a + BASELINE_WEIGHTS[k] * clamp01(f[k]), 0),
    4,
  );
}

export const priorityOf = (score: number) => (score >= 0.6 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW");
