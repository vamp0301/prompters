import type { PrepCategory, PrepPriority } from "@prisma/client";
import { priorityFor } from "./allocation.js";
import { generatedQuestionSchema } from "./schemas.js";
import { contentTokens, jaccard, normalize, verbatimEvidence } from "./text.js";

/**
 * Question-quality gate. Every generated question passes, in order:
 * schema → technical quality → duplicate → asked before → category/source → resume evidence →
 * skill mapping → difficulty (within the stage's band). Nothing is saved unless it passes all of them.
 */

export type SourceType = "PROJECT" | "EXPERIENCE" | "CLAIM" | "ACHIEVEMENT" | "CERTIFICATION" | "ROLE" | "JOB" | "SKILL";

export interface Source {
  type: SourceType;
  label: string;
  evidence: string;
  chunkId?: string;
  claimId?: string;
}

export interface ValidQuestion {
  category: PrepCategory;
  priority: PrepPriority;
  question: string;
  skill: string;
  probability: number;
  difficulty: number;
  followUpDepth: number;
  why: string;
  evidence: string;
  sourceType: string;
  sourceLabel: string;
  chunkId: string | null;
  claimId: string | null;
  hint: string;
  keyPoints: string[];
  followUps: string[];
  /** Ladder stage the question was written for (0 when generated outside a stage). */
  stage: number;
}

export type RejectReason = "schema" | "not_technical" | "malformed" | "duplicate" | "near_duplicate" | "asked_before" | "wrong_level" | "no_source" | "not_anchored" | "unknown_skill";

export interface ValidationStats {
  generated: number;
  accepted: number;
  adjusted: number;
  rejected: Partial<Record<RejectReason, number>>;
}

export interface ValidationContext {
  category: PrepCategory;
  resumeText: string;
  /** Reference ids shown to the model (P1, C3, A1…) → what they point to. */
  sources: Map<string, Source>;
  /** Maps a question skill to a known skill label, or null when it isn't in the candidate/role universe. */
  matchSkill: (skill: string) => string | null;
  /** Questions already accepted for this plan, across every category (mutated as questions are accepted). */
  accepted: { norm: string; tokens: Set<string> }[];
  /** What a question falls back to when it needs no resume anchor (the JD or target role). */
  fallbackSource: Source;
  /** The ladder stage being written: difficulty is kept inside [min, max]. */
  stage?: { stage: number; min: number; max: number };
  /** Questions from the candidate's earlier plans for the same target: a regenerated plan asks new ones. */
  previous?: { norm: string; tokens: Set<string> }[];
  /** Behavioural questions are core for this career (they are rejected otherwise). */
  allowBehavioural?: boolean;
}

const REQUIRED_SOURCES: Partial<Record<PrepCategory, SourceType[]>> = {
  PROJECT: ["PROJECT", "EXPERIENCE"],
  CLAIM: ["CLAIM"],
  ACHIEVEMENT: ["ACHIEVEMENT", "CERTIFICATION"],
};

/** Generic HR filler: never a Top-100 question, for any career. */
const HR_FILLER =
  /(tell me about yourself|introduce yourself|where do you see yourself|why should we hire|why do you want to (join|work)|your (greatest )?(strengths?|weakness(es)?)|\b5 years\b|five years|salary|notice period|hobbies|relocat)/i;
/** Behavioural questions: core for product, business, MBA, sales and design careers; out for technical ones. */
const BEHAVIOURAL = /(conflict with (a|your) (team|manager|colleague)|biggest failure)/i;
const TRIVIAL = /^(do|did|have|are|is|can|were|would) you (know|use|used|familiar|heard|worked|aware|comfortable|like)\b/i;
const QUESTION_FORM = /\?\s*$|^(explain|describe|walk|design|how|what|why|write|compare|implement|debug|suppose|imagine|given|tell|discuss|outline|differentiate|list|show|consider|if|when|which|where)\b/i;
const DEFINITION = /^(what is|what are|define|what does)\b/i;
/** Design/architecture prompts are never a Basics question. */
const DESIGN = /^(design|architect|how would you (design|architect|scale))\b|\bdesign (a|an|the) (robust|scalable|system|architecture|service)/i;
/** Two questions in one ("…? How…", "…, and how do you…") — a Basics question asks one thing. */
const MULTI_PART = /\?.+\?|[,;]\s*and (how|why|what|when|which)\b/i;
const BASICS_MAX_WORDS = 35;

export const DUPLICATE_THRESHOLD = 0.6;
/**
 * Stricter for questions from the candidate's earlier plans: a regenerated plan should ask
 * something different, so a close rewording of an old question counts as asked before.
 */
export const PREVIOUS_THRESHOLD = 0.45;

export function isDuplicate(question: string, accepted: ValidationContext["accepted"], threshold = DUPLICATE_THRESHOLD) {
  const norm = normalize(question);
  const tokens = contentTokens(question);
  return accepted.some((a) => a.norm === norm || jaccard(a.tokens, tokens) >= threshold);
}

function anchored(question: string, source: Source) {
  if (/\byou(r|rs)?\b/i.test(question)) return true;
  const q = contentTokens(question);
  return [...contentTokens(source.label)].some((t) => t.length > 3 && q.has(t));
}

export function validateBatch(items: unknown[], ctx: ValidationContext) {
  const stats: ValidationStats = { generated: items.length, accepted: 0, adjusted: 0, rejected: {} };
  const out: ValidQuestion[] = [];
  const reject = (r: RejectReason) => (stats.rejected[r] = (stats.rejected[r] ?? 0) + 1);

  for (const item of items) {
    // 1. Schema
    const parsed = generatedQuestionSchema.safeParse(item);
    if (!parsed.success) {
      reject("schema");
      continue;
    }
    const g = parsed.data;
    // Internal refs ("(P1)", "(E2, C3)") sometimes leak into the text; candidates should never see them.
    const question = g.question.replace(/\s*\((?:\s*[PECA]\d+\s*,?)+\)/g, "").replace(/\s+/g, " ").trim();

    // 2. Technical quality: no HR/behavioural, no yes/no trivia, a real question of sensible length.
    if (HR_FILLER.test(question) || HR_FILLER.test(g.skill) || (!ctx.allowBehavioural && (BEHAVIOURAL.test(question) || BEHAVIOURAL.test(g.skill)))) {
      reject("not_technical");
      continue;
    }
    const words = question.split(" ").length;
    if (TRIVIAL.test(question) || words < 5 || question.length > 400 || !QUESTION_FORM.test(question) || normalize(g.hint) === normalize(question)) {
      reject("malformed");
      continue;
    }

    // 3. Duplicates — against everything accepted so far in this plan, not just this batch.
    if (isDuplicate(question, ctx.accepted)) {
      reject("duplicate");
      continue;
    }
    if (ctx.previous?.length && isDuplicate(question, ctx.previous, PREVIOUS_THRESHOLD)) {
      reject("asked_before");
      continue;
    }

    // 4. Category / source: resume-anchored categories must point at a real project, claim or achievement.
    const ref = g.sourceRef?.trim().toUpperCase();
    const resolved = ref ? ctx.sources.get(ref) : undefined;
    const required = REQUIRED_SOURCES[ctx.category];
    if (required && (!resolved || !required.includes(resolved.type))) {
      reject("no_source");
      continue;
    }
    if (required && resolved && !anchored(question, resolved)) {
      reject("not_anchored");
      continue;
    }
    const source = resolved ?? ctx.fallbackSource;

    // 5. Resume evidence: only the candidate's own words — the model's quote if it is really in the
    //    resume, else the resume line that best supports the source, else nothing.
    const quoted = verbatimEvidence(g.evidence ?? "", ctx.resumeText);
    const evidence = quoted || (resolved ? verbatimEvidence(`${resolved.evidence} ${resolved.label}`, ctx.resumeText) : "");
    if (g.evidence?.trim() && quoted !== g.evidence.trim()) stats.adjusted++;

    // 6. Skill mapping: the tested skill must be on the resume, in the JD, or core to the target role.
    const skill = ctx.matchSkill(g.skill) ?? ctx.matchSkill(question);
    if (!skill) {
      reject("unknown_skill");
      continue;
    }

    // 7. Difficulty: definition questions can't be architecture-level; follow-up depth ≥ difficulty.
    //    Inside a stage, a definition can't be Advanced; a Basics question asks one short thing (no design,
    //    no second question, at most 35 words);
    //    otherwise the model's rating is kept within the stage's band.
    let difficulty = g.difficulty;
    const basics = ctx.stage && ctx.stage.max <= 2;
    if (ctx.stage && ((ctx.stage.min >= 4 && DEFINITION.test(question)) || (basics && (DESIGN.test(question) || MULTI_PART.test(question) || words > BASICS_MAX_WORDS)))) {
      reject("wrong_level");
      continue;
    }
    if (DEFINITION.test(question) && difficulty > 2) {
      difficulty = 2;
      stats.adjusted++;
    }
    if (ctx.stage && (difficulty < ctx.stage.min || difficulty > ctx.stage.max)) {
      difficulty = Math.min(ctx.stage.max, Math.max(ctx.stage.min, difficulty));
      stats.adjusted++;
    }
    const followUpDepth = Math.min(7, Math.max(g.followUpDepth, difficulty));

    ctx.accepted.push({ norm: normalize(question), tokens: contentTokens(question) });
    out.push({
      category: ctx.category,
      priority: priorityFor(g.probability),
      question,
      // Canonical skill ("Node.js", not "Node.js event loop") so filters and per-skill scores group cleanly.
      skill,
      probability: Math.round(g.probability * 100) / 100,
      difficulty,
      followUpDepth,
      why: g.why,
      evidence,
      sourceType: source.type,
      sourceLabel: source.label,
      chunkId: source.chunkId ?? null,
      claimId: source.claimId ?? null,
      hint: g.hint,
      keyPoints: g.keyPoints.filter(Boolean),
      followUps: g.followUps.filter(Boolean),
      stage: ctx.stage?.stage ?? 0,
    });
    stats.accepted++;
  }
  return { questions: out, stats };
}

export function mergeStats(a: ValidationStats, b: ValidationStats): ValidationStats {
  const rejected = { ...a.rejected };
  for (const [k, v] of Object.entries(b.rejected)) rejected[k as RejectReason] = (rejected[k as RejectReason] ?? 0) + (v ?? 0);
  return { generated: a.generated + b.generated, accepted: a.accepted + b.accepted, adjusted: a.adjusted + b.adjusted, rejected };
}

export const emptyStats = (): ValidationStats => ({ generated: 0, accepted: 0, adjusted: 0, rejected: {} });
