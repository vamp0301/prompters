import { z } from "zod";

/**
 * Content contracts for the Skill Intelligence Engine. Everything the AI writes is validated here
 * before it is stored or shown; the frontend renders these shapes, so a page is never hand-built.
 */

/** Over-long text is shortened at a word boundary instead of failing the whole response. */
export function clip(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}
const str = (max = 300) => z.preprocess((v) => (typeof v === "string" ? clip(v, max) : v), z.string().max(max));
const line = (max = 160) => z.preprocess((v) => (typeof v === "string" ? clip(v, max) : v), z.string().min(1).max(max));
/** Extra items beyond `max` are dropped rather than rejected. */
const capped = <T extends z.ZodTypeAny>(item: T, max: number) => z.preprocess((v) => (Array.isArray(v) ? v.slice(0, max) : v), z.array(item));
const list = (max = 8, item = 240) => capped(line(item), max).default([]);
const level = z.coerce.number().int().min(1).max(5);

// ───────────────────────── diagrams ─────────────────────────
// Six kinds, each tied to what it teaches (`objective`). Shapes are deliberately small so they
// render cleanly on a phone and read well as text for screen readers.

/** Optional step-through: each step explains one moment and can highlight one component by its label. */
const walkthrough = z.array(z.object({ label: line(140), highlight: str(40).optional() })).max(8).optional();
// objective/alt are filled in by the validator when the model omits them (see knowledge.validate.ts).
const base = { title: line(80), objective: str(200).optional(), alt: str(400).optional(), walkthrough };
const node = z.object({ label: line(40), note: str(80).optional() });

export const diagramSchema = z.discriminatedUnion("kind", [
  /** Layers top → bottom (client → gateway → services → data), arrows between layers. */
  z.object({ kind: z.literal("architecture"), ...base, layers: z.array(z.object({ label: str(40).optional(), nodes: z.array(node).min(1).max(5) })).min(2).max(8) }),
  /** A path of steps; a step may branch (e.g. cache HIT → respond / MISS → database → cache). */
  z.object({
    kind: z.literal("flow"),
    ...base,
    steps: z.array(z.object({ label: line(60), note: str(100).optional(), branches: z.array(z.object({ label: line(30), steps: z.array(line(50)).min(1).max(4) })).max(3).optional() })).min(2).max(10),
  }),
  /** Two options side by side (vertical vs horizontal scaling, SQL vs NoSQL). */
  z.object({ kind: z.literal("comparison"), ...base, left: z.object({ title: line(40), points: z.array(line(90)).min(1).max(6) }), right: z.object({ title: line(40), points: z.array(line(90)).min(1).max(6) }) }),
  /** Who sends what to whom, in order (TCP handshake, OAuth, request lifecycle). */
  z.object({ kind: z.literal("timeline"), ...base, actors: z.array(line(24)).min(2).max(5), events: z.array(z.object({ from: line(24), to: line(24), label: line(60) })).min(1).max(12) }),
  /** States and the transitions between them (order lifecycle, job queue, connection). */
  z.object({ kind: z.literal("state"), ...base, states: z.array(line(24)).min(2).max(8), transitions: z.array(z.object({ from: line(24), to: line(24), label: str(40).optional() })).min(1).max(12) }),
  /** A decision tree, two levels deep (Need a database? → Structured? → SQL…). */
  z.object({
    kind: z.literal("decision"),
    ...base,
    question: line(80),
    branches: z.array(z.object({ answer: line(30), result: str(80).optional(), question: str(80).optional(), branches: z.array(z.object({ answer: line(30), result: line(80) })).max(3).optional() })).min(2).max(3),
  }),
]);
export type Diagram = z.infer<typeof diagramSchema>;

/** Diagrams are parsed one by one: a broken diagram is dropped instead of failing the whole chapter. */
const KIND_BY_FIELD: [string, Diagram["kind"]][] = [["layers", "architecture"], ["steps", "flow"], ["left", "comparison"], ["actors", "timeline"], ["states", "state"], ["question", "decision"]];
/** Models sometimes omit or capitalise `kind`; the shape itself says which diagram it is. */
function withKind(v: unknown) {
  if (!v || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  const kind = typeof o.kind === "string" && o.kind.trim() ? o.kind.trim().toLowerCase() : KIND_BY_FIELD.find(([f]) => f in o)?.[1];
  if (!kind) return o;
  // A flow drawn only as a walkthrough: the walkthrough labels are its steps.
  if (kind === "flow" && !Array.isArray(o.steps) && Array.isArray(o.walkthrough)) {
    const steps = o.walkthrough.map((w) => (w && typeof w === "object" ? (w as { label?: unknown }).label : w)).filter((l): l is string => typeof l === "string" && !!l.trim());
    return { ...o, kind, steps: steps.map((label) => ({ label })) };
  }
  return { ...o, kind };
}
export const lenientDiagram = z.unknown().transform((v) => {
  const r = diagramSchema.safeParse(withKind(v));
  return r.success ? r.data : undefined;
});

/** Drops diagrams that reference actors/states they don't declare, instead of rendering nonsense. */
export function coherent(d: Diagram) {
  if (d.kind === "timeline") return d.events.every((e) => d.actors.includes(e.from) && d.actors.includes(e.to));
  if (d.kind === "state") return d.transitions.every((t) => d.states.includes(t.from) && d.states.includes(t.to));
  return true;
}

// ───────────────────────── knowledge map ─────────────────────────

export const IMPORTANCE = ["MUST", "GOOD", "ADVANCED"] as const;

const conceptRef = z.object({
  key: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/),
  title: line(70),
  difficulty: level,
  /** How often interviewers ask about it, 1 (rare) – 5 (almost always). */
  frequency: level,
  importance: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase() : v), z.enum(IMPORTANCE)).catch("GOOD"),
  prerequisites: z.array(z.string().max(60)).max(4).default([]),
  /** Approved scope: the subtopics this concept's chapter must teach (deterministic curriculum, not AI). */
  covers: z.array(line(60)).max(10).default([]),
  /** What the learner should be able to do after the chapter. */
  objective: str(200).optional(),
});
export type ConceptRef = z.infer<typeof conceptRef>;

export const skillMapSchema = z.object({
  summary: line(300),
  domains: z
    .array(z.object({ key: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/), title: line(50), concepts: z.array(conceptRef).min(1).max(18) }))
    .min(2)
    .max(16),
  related: list(8, 40),
});
export type SkillMapContent = z.infer<typeof skillMapSchema>;

// ───────────────────────── concept chapter ─────────────────────────

/** Bump when the chapter contract changes: older cached chapters are rewritten on next open. */
export const CONCEPT_VERSION = 2;

const LEVEL_NAMES = ["beginner", "developer", "production", "system design", "interview"];
/** Models write levels as 3, "3", "Level 3" or "Production"; anything else falls back to its position. */
function levelNumber(v: unknown, index: number) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").match(/\d/)?.[0] ?? NaN);
  if (n >= 1 && n <= 5) return Math.round(n);
  const named = LEVEL_NAMES.findIndex((name) => String(v ?? "").toLowerCase().includes(name));
  return named >= 0 ? named + 1 : Math.min(index + 1, 5);
}

const quizItem = z.object({ question: line(240), options: capped(line(160), 4).pipe(z.array(z.string()).min(3)), answer: z.coerce.number().int().min(0).max(3), explanation: line(300) });

export const conceptSchema = z.object({
  /** One sentence a beginner understands. */
  oneLine: line(240),
  /** Explain like I'm new: a real-world analogy in plain words. */
  explainLikeNew: line(500),
  // tradeoff may be omitted by the model; the validator fills it from `tradeoffs` or rejects the chapter.
  why: z.object({ problem: line(300), solution: line(300), tradeoff: str(300).default("") }),
  mentalModel: z.object({ analogy: line(200), explanation: line(400) }),
  /** 1–3 teaching diagrams (mandatory), each with an objective and accessibility text. */
  visuals: capped(lenientDiagram, 3).transform((ds) => ds.filter((d): d is Diagram => !!d)),
  /** Step-by-step operation of THIS concept. */
  howItWorks: capped(line(240), 7).pipe(z.array(z.string()).min(2)),
  /** Concept-specific subtopics (e.g. Algorithms, Health checks, L4 vs L7), each optionally with its own diagram. */
  deepDives: capped(z.object({ title: line(120), body: line(700), points: list(6, 200), visual: lenientDiagram.optional() }), 8).default([]),
  realWorld: capped(z.object({ where: line(80), how: line(240) }), 4).default([]),
  /** Real implementation only when code genuinely teaches the concept; otherwise applicable=false with a reason. */
  implementation: z.object({
    applicable: z.boolean(),
    reason: str(240).optional(),
    language: str(20).optional(),
    snippet: str(2000).optional(),
    explanation: str(400).optional(),
  }),
  whenToUse: list(5),
  whenNotToUse: list(5),
  advantages: list(5),
  disadvantages: list(5),
  tradeoffs: list(4, 300),
  mistakes: capped(z.object({ wrong: line(200), right: line(300) }), 5).default([]),
  /** Level 1 Beginner · 2 Developer · 3 Production · 4 System design · 5 Interview. */
  levels: capped(z.object({ level: z.unknown(), question: line(240), hint: line(240) }), 5)
    .transform((ls) => ls.map((l, i) => ({ ...l, level: levelNumber(l.level, i) })))
    .pipe(z.array(z.object({ level, question: z.string(), hint: z.string() })).min(3)),
  // A malformed quiz item (wrong option count, answer out of range) is dropped; at least 2 must survive.
  quiz: capped(
    z.unknown().transform((v) => {
      const r = quizItem.safeParse(v);
      return r.success && r.data.answer < r.data.options.length ? r.data : undefined;
    }),
    5,
  )
    .transform((qs) => qs.filter((q): q is z.infer<typeof quizItem> => !!q))
    .pipe(z.array(z.any()).min(2)),
  /** What an interviewer listens for — also used to judge "explain it in 60 seconds". */
  keyPoints: capped(line(160), 8).pipe(z.array(z.string()).min(3)),
  internals: list(6, 300),
  interviewerExpects: list(8, 120),
  explainTask: line(240),
  cheatSheet: z.object({ definition: line(200), useFor: list(5, 80), remember: list(5, 120), interviewQuestion: line(200) }),
});

/** What the API stores and serves: the validated chapter plus derived fields the UI already uses. */
export type ConceptChapterContent = z.infer<typeof conceptSchema> & {
  _v: number;
  code: { language: string; snippet: string; explanation: string } | null;
  codeNote: string | null;
};
export type ConceptContent = ConceptChapterContent;

// ───────────────────────── explain it in 60 seconds ─────────────────────────

export const explainEvalSchema = z.object({
  correctness: z.coerce.number().min(0).max(10),
  completeness: z.coerce.number().min(0).max(10),
  depth: z.coerce.number().min(0).max(10),
  clarity: z.coerce.number().min(0).max(10),
  covered: list(8, 120),
  missing: list(8, 120),
  incorrect: list(5, 200),
  unnecessary: list(5, 120),
  feedback: line(400),
});
export type ExplainEval = z.infer<typeof explainEvalSchema>;
