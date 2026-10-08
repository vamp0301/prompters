import type { PrepCategory } from "@prisma/client";
import { PREP_CATEGORIES, rankQuestions } from "./allocation.js";

/**
 * The difficulty ladder. A plan is written and published in three stages — Basics, Core,
 * Advanced — so the list always climbs in difficulty and the candidate can start on the basics
 * while the harder questions are still being written. How many questions each stage gets is
 * decided by code from the candidate's experience (or the job's seniority, when that is higher):
 * a student gets an entry-level mix; an experienced engineer gets the superset — the same
 * fundamentals asked quickly, plus far more depth.
 */

export const EXPERIENCE_BANDS = ["STUDENT", "JUNIOR", "MID", "SENIOR"] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export const BAND_LABEL: Record<ExperienceBand, string> = {
  STUDENT: "Student / fresher",
  JUNIOR: "Junior (up to 2 years)",
  MID: "Mid-level (2–5 years)",
  SENIOR: "Senior (5+ years)",
};

/** What an interviewer expects at each band — given to the model so questions are pitched right. */
export const BAND_BRIEF: Record<ExperienceBand, string> = {
  STUDENT:
    "an ENTRY-LEVEL candidate (student / fresher). Interviewers check fundamentals (DSA, OOP, DBMS, OS, networking, the role's core skills) and whether the candidate can explain their own projects. Do not ask about leading teams, owning large production systems or architecture far beyond their projects.",
  JUNIOR:
    "a JUNIOR developer (up to 2 years). Interviewers expect working knowledge: writing and debugging production code, testing, how their stack works under the hood, and the fundamentals.",
  MID:
    "a MID-LEVEL developer (2–5 years). Interviewers expect ownership of features in production: design trade-offs, performance, data modelling, reliability, security and code quality — and still check fundamentals quickly.",
  SENIOR:
    "a SENIOR engineer (5+ years). Interviewers expect the SUPERSET: everything a junior must know (asked quickly), plus architecture, scaling, failure modes, observability, security, migrations and the technical reasoning behind major decisions.",
};

export function bandFor(months: number): ExperienceBand {
  if (months <= 6) return "STUDENT";
  if (months <= 24) return "JUNIOR";
  if (months <= 60) return "MID";
  return "SENIOR";
}

/** A job description's seniority line ("SDE-2", "Senior", "3+ years") as a band, or null when it says nothing usable. */
export function bandFromSeniority(text?: string | null): ExperienceBand | null {
  const t = (text ?? "").toLowerCase();
  if (!t.trim()) return null;
  const years = t.match(/(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)/);
  if (years) return bandFor(Number(years[1]) * 12 + (Number(years[1]) > 0 ? 1 : 0));
  if (/\b(senior|sr\.?|lead|staff|principal|architect|sde[\s-]?(3|iii)|manager)\b/.test(t)) return "SENIOR";
  if (/\b(mid|sde[\s-]?(2|ii)|engineer ii|intermediate)\b/.test(t)) return "MID";
  if (/\b(junior|jr\.?|associate|sde[\s-]?(1|i)\b|engineer i\b)/.test(t)) return "JUNIOR";
  if (/\b(intern|internship|fresher|graduate|entry|trainee|campus)\b/.test(t)) return "STUDENT";
  return null;
}

/** The candidate prepares for the harder of: their own experience, or what the job asks for (seniority or required experience). */
export function effectiveBand(months: number, job?: { seniority?: string | null; requiredExperienceMonths?: number | null } | null): ExperienceBand {
  const order = (b: ExperienceBand) => EXPERIENCE_BANDS.indexOf(b);
  let band = bandFor(months);
  for (const b of [bandFromSeniority(job?.seniority), job?.requiredExperienceMonths ? bandFor(job.requiredExperienceMonths) : null]) {
    if (b && order(b) > order(band)) band = b;
  }
  return band;
}

export const STAGES = [
  { stage: 1, label: "Basics", min: 1, max: 2, brief: "STAGE 1 · BASICS — difficulty 1-2 only: practical fundamentals and how-to questions. ONE focused question each, at most 25 words, with no second part (no '…, and how…'), and only a short mention of the project. Answerable in 1-2 minutes. No system design or architecture." },
  { stage: 2, label: "Core", min: 3, max: 3, brief: "STAGE 2 · CORE — difficulty 3 only: how it works under the hood, why it behaves that way, comparisons, and debugging one specific problem." },
  { stage: 3, label: "Advanced", min: 4, max: 5, brief: "STAGE 3 · ADVANCED — difficulty 4-5 only: scenarios, failure handling, scaling, design and trade-offs — ideally applied to the candidate's own projects." },
] as const;
export type StageNo = 1 | 2 | 3;

/** Questions per stage (Basics, Core, Advanced) for each band; always sums to 100. */
export const STAGE_MIX: Record<ExperienceBand, [number, number, number]> = {
  STUDENT: [50, 35, 15],
  JUNIOR: [35, 40, 25],
  MID: [20, 40, 40],
  SENIOR: [15, 35, 50],
};

/** How naturally each category fits each stage (scenarios are advanced; general fundamentals are mostly basics). */
const STAGE_FIT: Record<PrepCategory, [number, number, number]> = {
  GENERAL: [0.6, 0.3, 0.1],
  SKILL: [0.4, 0.4, 0.2],
  CONCEPTUAL: [0.4, 0.45, 0.15],
  PROJECT: [0.25, 0.4, 0.35],
  CLAIM: [0.15, 0.45, 0.4],
  ACHIEVEMENT: [0.3, 0.4, 0.3],
  SCENARIO: [0, 0.3, 0.7],
};

/**
 * Splits each stage's count across categories in proportion to (category allocation × how well it
 * fits the stage). Each stage sums exactly to its count (largest remainder).
 */
export function stagePlan(allocation: Record<PrepCategory, number>, band: ExperienceBand): Record<StageNo, Record<PrepCategory, number>> {
  const out = {} as Record<StageNo, Record<PrepCategory, number>>;
  STAGES.forEach(({ stage }, s) => {
    const count = STAGE_MIX[band][s];
    const weights = PREP_CATEGORIES.map((c) => ({ c, w: (allocation[c] ?? 0) * STAGE_FIT[c][s] }));
    const total = weights.reduce((a, x) => a + x.w, 0);
    const raw = weights.map(({ c, w }) => ({ c, exact: total > 0 ? (count * w) / total : 0 }));
    const cells = Object.fromEntries(raw.map((r) => [r.c, Math.floor(r.exact)])) as Record<PrepCategory, number>;
    let left = count - raw.reduce((a, r) => a + Math.floor(r.exact), 0);
    for (const r of [...raw].filter((r) => r.exact > 0).sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))) {
      if (left-- <= 0) break;
      cells[r.c]++;
    }
    // Nothing fit (impossible with a non-empty allocation) → skill questions carry the stage.
    if (total === 0) cells.SKILL = count;
    out[stage] = cells;
  });
  return out;
}

/** Topics only experienced candidates are drilled on — added on top of the entry-level universe. */
export const ADVANCED_TOPICS = ["Performance", "Profiling", "Concurrency", "Security", "Observability", "Distributed systems", "Architecture", "Migrations", "Testing strategy", "Reliability", "Code review"];

/**
 * Rotates a focus list so each regeneration (and each stage) leads with different items:
 * a fresh plan asks about different parts of the resume first instead of the same ones again.
 */
export function rotate<T>(items: T[], by: number): T[] {
  if (items.length < 2) return items;
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Order inside a stage: easier first, then most likely to be asked (the usual ranking). */
export function ladderOrder<T extends Parameters<typeof rankQuestions>[0][number]>(qs: T[]): T[] {
  return rankQuestions(qs).sort((a, b) => a.difficulty - b.difficulty);
}
