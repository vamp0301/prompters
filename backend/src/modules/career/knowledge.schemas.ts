import { z } from "zod";

/**
 * Content contracts for the Skill Intelligence Engine. Everything the AI writes is validated here
 * before it is stored or shown; the frontend renders these shapes, so a page is never hand-built.
 */

const str = (max = 300) => z.string().trim().max(max);
const line = (max = 160) => str(max).min(1);
const list = (max = 8, item = 240) => z.array(line(item)).max(max).default([]);
const level = z.coerce.number().int().min(1).max(5);

// ───────────────────────── diagrams ─────────────────────────
// Six kinds, each tied to what it teaches (`objective`). Shapes are deliberately small so they
// render cleanly on a phone and read well as text for screen readers.

const base = { title: line(80), objective: line(200) };
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

export const conceptSchema = z.object({
  /** One sentence a beginner understands. */
  oneLine: line(240),
  why: z.object({ problem: line(300), solution: line(300), tradeoff: line(300) }),
  mentalModel: z.object({ analogy: line(200), explanation: line(400) }),
  /** 1–3 diagrams, each with a learning objective. */
  visuals: z.array(diagramSchema).min(1).max(3),
  howItWorks: z.array(line(240)).min(2).max(6),
  realWorld: z.array(z.object({ where: line(80), how: line(240) })).max(4).default([]),
  code: z.object({ language: line(20), snippet: line(2000), explanation: line(300) }).nullable().default(null),
  whenToUse: list(5),
  whenNotToUse: list(5),
  advantages: list(5),
  disadvantages: list(5),
  mistakes: z.array(z.object({ wrong: line(200), right: line(300) })).max(5).default([]),
  /** Level 1 Beginner · 2 Developer · 3 Production · 4 System design · 5 Interview. */
  levels: z.array(z.object({ level, question: line(240), hint: line(240) })).min(3).max(5),
  /** What an interviewer listens for — also used to judge "explain it in 60 seconds". */
  keyPoints: z.array(line(160)).min(3).max(8),
  internals: list(6, 300),
  interviewerExpects: list(8, 120),
  cheatSheet: z.object({ definition: line(200), useFor: list(5, 80), remember: list(5, 120), interviewQuestion: line(200) }),
});
export type ConceptContent = z.infer<typeof conceptSchema>;

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
