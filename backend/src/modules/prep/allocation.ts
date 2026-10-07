import type { PrepCategory, PrepPriority } from "@prisma/client";

export const PREP_CATEGORIES = ["GENERAL", "SKILL", "PROJECT", "CLAIM", "ACHIEVEMENT", "CONCEPTUAL", "SCENARIO"] as const satisfies readonly PrepCategory[];

export const CATEGORY_LABEL: Record<PrepCategory, string> = {
  GENERAL: "General technical",
  SKILL: "Skill-based",
  PROJECT: "Project deep-dive",
  CLAIM: "Resume claim",
  ACHIEVEMENT: "Achievement",
  CONCEPTUAL: "Conceptual",
  SCENARIO: "Scenario / debugging",
};

/** The default split when a resume gives every category enough material. */
export const DEFAULT_ALLOCATION: Record<PrepCategory, number> = { GENERAL: 15, SKILL: 25, PROJECT: 25, CLAIM: 15, ACHIEVEMENT: 5, CONCEPTUAL: 10, SCENARIO: 5 };

export const TOTAL_QUESTIONS = 100;

export interface AllocationProfile {
  projects: number;
  claims: number;
  achievements: number;
  /** JD-required skills that the resume doesn't evidence. */
  gapSkills: number;
}

/**
 * Decides how many of the 100 questions each category gets, by code, from what the
 * resume actually contains. Resume-anchored categories scale with their material
 * (no projects → no project questions); the rest is split across the flexible
 * categories by their default weights. Always sums to exactly TOTAL_QUESTIONS.
 */
export function allocateQuestions(p: AllocationProfile): Record<PrepCategory, number> {
  const project = p.projects <= 0 ? 0 : p.projects === 1 ? 12 : p.projects === 2 ? 20 : p.projects <= 4 ? 25 : 30;
  const claim = p.claims <= 0 ? 0 : p.claims < 4 ? p.claims * 4 : Math.min(20, 15 + Math.max(0, p.claims - 8));
  const achievement = Math.min(5, p.achievements * 2);
  const flex = TOTAL_QUESTIONS - project - claim - achievement;
  const weights: [PrepCategory, number][] = [
    ["SKILL", DEFAULT_ALLOCATION.SKILL + Math.min(5, p.gapSkills)],
    ["GENERAL", DEFAULT_ALLOCATION.GENERAL],
    ["CONCEPTUAL", DEFAULT_ALLOCATION.CONCEPTUAL],
    ["SCENARIO", DEFAULT_ALLOCATION.SCENARIO],
  ];
  const totalWeight = weights.reduce((a, [, w]) => a + w, 0);
  // Largest-remainder split so the flexible categories sum exactly to `flex`.
  const raw = weights.map(([c, w]) => ({ c, exact: (flex * w) / totalWeight }));
  const out = { PROJECT: project, CLAIM: claim, ACHIEVEMENT: achievement } as Record<PrepCategory, number>;
  for (const r of raw) out[r.c] = Math.floor(r.exact);
  let left = flex - raw.reduce((a, r) => a + Math.floor(r.exact), 0);
  for (const r of [...raw].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))) {
    if (left-- <= 0) break;
    out[r.c]++;
  }
  return Object.fromEntries(PREP_CATEGORIES.map((c) => [c, out[c]])) as Record<PrepCategory, number>;
}

/** Priority is derived from probability by code so the four bands mean the same thing everywhere. */
export function priorityFor(probability: number): PrepPriority {
  if (probability >= 0.8) return "INTENSE";
  if (probability >= 0.6) return "IMPORTANT";
  if (probability >= 0.4) return "GOOD";
  return "MAY_BE_ASKED";
}

const PRIORITY_RANK: Record<PrepPriority, number> = { INTENSE: 0, IMPORTANT: 1, GOOD: 2, MAY_BE_ASKED: 3 };

/** Final Top-100 order: priority band, then probability, then resume-anchored before generic. */
export function rankQuestions<T extends { priority: PrepPriority; probability: number; category: PrepCategory; difficulty: number }>(qs: T[]): T[] {
  const anchored = (c: PrepCategory) => (c === "PROJECT" || c === "CLAIM" || c === "ACHIEVEMENT" ? 0 : 1);
  return [...qs].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      b.probability - a.probability ||
      anchored(a.category) - anchored(b.category) ||
      a.difficulty - b.difficulty,
  );
}

const BANDS: [number, PrepPriority][] = [
  [0.25, "INTENSE"],
  [0.55, "IMPORTANT"],
  [0.8, "GOOD"],
  [1, "MAY_BE_ASKED"],
];

/**
 * Models rate almost everything 0.9+, which would make every question INTENSE. Priority is
 * therefore relative to the candidate's own ranked bank (top 25% INTENSE, next 30% IMPORTANT,
 * next 25% GOOD, rest MAY_BE_ASKED) — but never higher than the question's probability band.
 */
export function calibratePriorities<T extends { probability: number }>(ranked: T[]): PrepPriority[] {
  return ranked.map((q, i) => {
    const byRank = BANDS.find(([cut]) => (i + 1) / ranked.length <= cut)![1];
    const byProbability = priorityFor(q.probability);
    return PRIORITY_RANK[byRank] >= PRIORITY_RANK[byProbability] ? byRank : byProbability;
  });
}
