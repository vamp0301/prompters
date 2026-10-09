import type { InterviewTurn, PrepQuestion } from "@prisma/client";
import { isTargetRole } from "../prep/roles.js";
import type { BankQuestion } from "./schemas.js";

/**
 * Interview blueprint: which areas an interview covers and how much of it each gets, so one
 * technology never takes over the whole interview (Phase 4 / 14 of the Manisha spec).
 */
export const AREAS = ["RESUME", "PROJECTS", "FUNDAMENTALS", "ROLE", "PRACTICAL", "PROBLEM_SOLVING", "SYSTEM_DESIGN"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABEL: Record<Area, string> = {
  RESUME: "Resume & background",
  PROJECTS: "Projects",
  FUNDAMENTALS: "Core fundamentals",
  ROLE: "Role-specific knowledge",
  PRACTICAL: "Practical engineering",
  PROBLEM_SOLVING: "Problem solving",
  SYSTEM_DESIGN: "System & design thinking",
};

/** One question Manisha can ask, wherever it came from. */
export interface BankItem {
  id: string;
  question: string;
  skill: string;
  level: number;
  area: Area;
  claimId?: string | null;
  /** The resume claim being probed, verbatim, when there is one. */
  claim?: string | null;
  why?: string;
}

export interface Blueprint {
  areas: { area: Area; target: number }[];
  /** Readiness score when the interview started, for the before/after comparison in the report. */
  readinessBefore?: number | null;
}

export type Difficulty = "STANDARD" | "HARD";

/** Share of the main questions per area, by target role. Follow-ups come on top. */
const WEIGHTS: Record<string, Partial<Record<Area, number>>> = {
  backend: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.1 },
  frontend: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.3, PRACTICAL: 0.15, PROBLEM_SOLVING: 0.05, SYSTEM_DESIGN: 0.05 },
  fullstack: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.1 },
  sde: { RESUME: 0.05, PROJECTS: 0.15, FUNDAMENTALS: 0.2, ROLE: 0.15, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.25, SYSTEM_DESIGN: 0.1 },
  data_analyst: { RESUME: 0.05, PROJECTS: 0.25, FUNDAMENTALS: 0.25, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1 },
  devops: { RESUME: 0.05, PROJECTS: 0.15, FUNDAMENTALS: 0.15, ROLE: 0.3, PRACTICAL: 0.2, PROBLEM_SOLVING: 0.05, SYSTEM_DESIGN: 0.1 },
  ml_engineer: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.25, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.05 },
};

const SYSTEM_DESIGN_RE = /system design|scal|architect|load balanc|cach|queue|microservice|distributed|sharding|replica|rate limit|high availability/i;

/** Analysis (job-match) bank → blueprint areas. */
export function fromMatchBank(bank: BankQuestion[], claims: { id: string; claim: string }[]): BankItem[] {
  return bank.map((q) => {
    const claim = q.claimId ? claims.find((c) => c.id === q.claimId)?.claim ?? null : null;
    const area: Area =
      q.level >= 5 || SYSTEM_DESIGN_RE.test(q.skill) ? "SYSTEM_DESIGN" : q.category === "CONCEPTUAL" ? "FUNDAMENTALS" : q.category === "MAY_BE_ASKED" ? "PRACTICAL" : claim ? "PROJECTS" : "ROLE";
    return { id: q.id, question: q.question, skill: q.skill, level: q.level, area, claimId: q.claimId ?? null, claim, why: q.why };
  });
}

/** Top-100 plan questions → blueprint areas (role-only interviews reuse the candidate's own plan). */
export function fromPrepPlan(questions: Pick<PrepQuestion, "id" | "question" | "skill" | "category" | "difficulty" | "claimId" | "why">[], claims: Map<string, string>): BankItem[] {
  return questions.map((q) => {
    const claim = q.claimId ? claims.get(q.claimId) ?? null : null;
    const area: Area =
      q.category === "GENERAL" || q.category === "ACHIEVEMENT"
        ? "RESUME"
        : q.category === "PROJECT" || q.category === "CLAIM"
          ? "PROJECTS"
          : q.category === "CONCEPTUAL"
            ? "FUNDAMENTALS"
            : q.category === "SCENARIO"
              ? q.difficulty >= 5 || SYSTEM_DESIGN_RE.test(`${q.skill} ${q.question}`)
                ? "SYSTEM_DESIGN"
                : "PRACTICAL"
              : "ROLE";
    return { id: `p_${q.id}`, question: q.question, skill: q.skill, level: Math.max(1, Math.min(5, q.difficulty)), area, claimId: q.claimId, claim, why: q.why };
  });
}

/**
 * Splits the main questions across areas by role weights. Areas with nothing to ask (no bank items,
 * or no problem-solving source) get 0 and their share goes to the rest.
 */
export function buildBlueprint(role: string | null, questionTarget: number, bank: BankItem[], problemSolvingAvailable: boolean): Blueprint {
  const weights = WEIGHTS[role ?? ""] ?? WEIGHTS.fullstack;
  const has = (a: Area) => (a === "PROBLEM_SOLVING" ? problemSolvingAvailable : bank.some((q) => q.area === a));
  const live = AREAS.filter((a) => (weights[a] ?? 0) > 0 && has(a));
  const total = live.reduce((s, a) => s + (weights[a] ?? 0), 0) || 1;
  // About 70% of the turns are main questions; the rest are follow-ups.
  const mains = Math.max(3, Math.round(questionTarget * 0.7));
  const raw = live.map((a) => ({ area: a, exact: ((weights[a] ?? 0) / total) * mains }));
  const areas = raw.map((r) => ({ area: r.area, target: Math.floor(r.exact) }));
  // Hand out the remainder to the largest fractional parts so the targets add up to `mains`.
  let left = mains - areas.reduce((s, a) => s + a.target, 0);
  for (const r of [...raw].sort((x, y) => (y.exact % 1) - (x.exact % 1))) {
    if (left <= 0) break;
    areas.find((a) => a.area === r.area)!.target++;
    left--;
  }
  // Every interview of 4+ main questions gets at least one problem-solving question when there's one to ask.
  const ps = areas.find((a) => a.area === "PROBLEM_SOLVING");
  if (ps && ps.target === 0 && mains >= 4) {
    // Take the slot from the biggest area, or else from a lower-priority area that got one.
    const w = (a: { area: Area }) => weights[a.area] ?? 0;
    const donor = [...areas].sort((a, b) => b.target - a.target)[0].target > 1
      ? [...areas].sort((a, b) => b.target - a.target)[0]
      : [...areas].filter((a) => a !== ps && a.target > 0 && w(a) <= w(ps)).sort((a, b) => w(a) - w(b))[0];
    if (donor) {
      donor.target--;
      ps.target = 1;
    }
  }
  return { areas: areas.filter((a) => a.target > 0) };
}

export const normalizeQuestion = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export interface PickContext {
  bank: BankItem[];
  turns: Pick<InterviewTurn, "kind" | "bankId" | "area" | "level" | "skill" | "evaluation" | "skipped" | "codeResult" | "excluded">[];
  blueprint: Blueprint;
  difficulty: Difficulty;
  focusAreas: string[];
  /** Normalised texts of questions asked in this candidate's earlier interviews. */
  previouslyAsked: Set<string>;
  score: (t: PickContext["turns"][number]) => number;
}

const isMain = (k: string) => k === "QUESTION" || k === "CODING" || k === "PROBLEM";

/** Which area should the next main question come from: the one furthest behind its target. */
export function nextArea(ctx: Pick<PickContext, "turns" | "blueprint">, available: (a: Area) => boolean): Area | null {
  const asked = new Map<string, number>();
  for (const t of ctx.turns) if (isMain(t.kind) && t.area) asked.set(t.area, (asked.get(t.area) ?? 0) + 1);
  const open = ctx.blueprint.areas
    .filter((a) => available(a.area))
    .map((a) => ({ area: a.area, deficit: (a.target - (asked.get(a.area) ?? 0)) / a.target }))
    .sort((a, b) => b.deficit - a.deficit);
  return open[0]?.area ?? null;
}

/**
 * Adaptive pick inside the chosen area: the level follows how the candidate is doing (harder after
 * strong answers, simpler after weak ones), skills don't repeat back-to-back, earlier weak skills get
 * priority, and questions from earlier interviews are avoided.
 */
export function pickQuestion(ctx: PickContext, area: Area | null): BankItem | null {
  const asked = new Set(ctx.turns.map((t) => t.bankId).filter(Boolean));
  let remaining = ctx.bank.filter((q) => !asked.has(q.id));
  const fresh = remaining.filter((q) => !ctx.previouslyAsked.has(normalizeQuestion(q.question)));
  if (fresh.length) remaining = fresh;
  if (!remaining.length) return null;

  const scored = ctx.turns.filter((t) => !t.excluded && (t.evaluation || t.codeResult || t.skipped));
  const recent = scored.slice(-3).map(ctx.score);
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
  const lastMain = [...ctx.turns].reverse().find((t) => isMain(t.kind));
  const floor = ctx.difficulty === "HARD" ? 2 : 1;
  const start = ctx.difficulty === "HARD" ? 3 : 2;
  const current = lastMain?.level ?? start;
  const target = Math.max(floor, Math.min(5, avg === null ? start : avg >= 70 ? current + 1 : avg <= 40 ? current - 1 : current));
  const lastSkill = lastMain?.skill.toLowerCase();
  const focus = ctx.focusAreas.map((f) => f.toLowerCase());

  const pool = area ? remaining.filter((q) => q.area === area) : remaining;
  const candidates = (pool.length ? pool : remaining)
    .map((q) => {
      const skill = q.skill.toLowerCase();
      const focusHit = focus.some((f) => skill.includes(f) || f.includes(skill));
      return { q, cost: Math.abs(q.level - target) * 2 + (skill === lastSkill ? 3 : 0) - (focusHit ? 2.5 : 0) - (q.claim ? 0.5 : 0) };
    })
    .sort((a, b) => a.cost - b.cost);
  return candidates[0]?.q ?? null;
}

/** Interview length → number of turns (main questions + follow-ups). */
export const QUESTIONS_FOR_DURATION: Record<number, number> = { 15: 8, 20: 10, 30: 14, 45: 20 };

export { isTargetRole };
