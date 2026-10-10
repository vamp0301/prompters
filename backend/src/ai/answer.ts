import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { TopicSnapshot } from "../modules/learning/snapshot.js";
import { lenientDiagram, coherent, type Diagram } from "../modules/career/knowledge.schemas.js";
import { diagramFault, repairDiagram } from "../modules/career/knowledge.validate.js";
import { aiJson, fence } from "./json.js";

/**
 * Solution-first tutor: retrieve → answer → verify.
 *
 * 1. Retrieval: the current topic's published sections, plus sections of other published topics that
 *    share the question's keywords. Syllabus content is public to every learner — nothing private is read.
 * 2. Answer: the model returns a structured answer (direct solution first, then why, example, code,
 *    diagram, tests, pitfalls) citing sources only by the ids it was given.
 * 3. Verify on the server: invented source ids are dropped and counted, broken diagrams are repaired
 *    or dropped, and claims without a source are labelled general knowledge.
 */

const LOCALE: Record<string, string> = {
  hinglish: "Write in Hinglish: Hindi in Roman script mixed naturally with English technical terms (keep every technical term in English).",
  en: "Write in simple, plain English. Explain any jargon the first time you use it.",
  hi: "Write in simple Hindi (Devanagari). Keep technical terms in English.",
};

export type AnswerMode = "solution" | "hints";

export interface Source {
  id: string;
  topicSlug: string;
  topicTitle: string;
  section: string;
  text: string;
}

const STOP = new Set("the a an and or of to in on for with is are was were be how what why when which who does do did can could should would this that these those from into your you my i me it its as at by not use using make".split(" "));

/** Distinct search terms from the question (≥3 letters, no stop words), longest first. */
export function keywords(question: string, limit = 6) {
  const words = question.toLowerCase().match(/[a-z0-9+#.]{3,}/g) ?? [];
  return [...new Set(words.map((w) => w.replace(/\.+$/, "")).filter((w) => w.length >= 3 && !STOP.has(w)))].sort((a, b) => b.length - a.length).slice(0, limit);
}

const localized = (content: Record<string, string | undefined> | null | undefined, locale: string) => (content?.[locale] ?? content?.en ?? content?.hinglish ?? "").trim();

type Section = { slug: string; title: string; type: string; content: Record<string, string>; codeJs: string | null; codePython: string | null };
const sectionsOf = (snapshot: Prisma.JsonValue): Section[] => {
  const s = snapshot as unknown as TopicSnapshot | null;
  return (s?.sections ?? []).map((x) => ({ slug: s!.slug, title: s!.title, type: x.type, content: x.content, codeJs: x.codeJs ?? null, codePython: x.codePython ?? null }));
};

/**
 * Current topic first (all sections), then the best keyword matches from other topics. Only the
 * PUBLISHED snapshot is read — exactly what learners see — never an author's unpublished draft.
 */
export async function retrieve(topicId: string, question: string, locale: string, related = 4): Promise<Source[]> {
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { publishedVersion: true } });
  const current = topic?.publishedVersion ? await prisma.topicVersion.findUnique({ where: { topicId_version: { topicId, version: topic.publishedVersion } }, select: { snapshot: true } }) : null;
  const own = current ? sectionsOf(current.snapshot) : [];
  const terms = keywords(question);
  let others: Section[] = [];
  if (terms.length) {
    const patterns = terms.map((t) => `%${t}%`);
    const rows = await prisma.$queryRaw<{ snapshot: Prisma.JsonValue }[]>`
      SELECT v.snapshot FROM "TopicVersion" v JOIN "Topic" t ON t.id = v."topicId"
      WHERE t.status = 'PUBLISHED' AND v.version = t."publishedVersion" AND t.id <> ${topicId} AND v.snapshot::text ILIKE ANY(${patterns})
      LIMIT 30`;
    others = rows.flatMap((r) => sectionsOf(r.snapshot));
  }
  const score = (s: Section) => {
    const hay = `${localized(s.content, "en")} ${localized(s.content, locale)} ${s.codeJs ?? ""} ${s.codePython ?? ""}`.toLowerCase();
    return terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0) + (s.title.toLowerCase().includes(t) ? 2 : 0), 0);
  };
  const best = others.map((s) => ({ s, n: score(s) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, related).map((x) => x.s);
  return [...own, ...best]
    .map((s) => ({
      topicSlug: s.slug,
      topicTitle: s.title,
      section: s.type,
      text: [localized(s.content, locale), s.codeJs ? `JavaScript:\n${s.codeJs}` : "", s.codePython ? `Python:\n${s.codePython}` : ""].filter(Boolean).join("\n").slice(0, 1500),
    }))
    .filter((s) => s.text)
    .map((s, i) => ({ id: `S${i + 1}`, ...s }));
}

/** Model output is forgiving: object items become text and long lists are cut, never thrown away whole. */
const toText = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : v && typeof v === "object" ? Object.values(v).filter((x) => typeof x === "string" || typeof x === "number").join(" — ") : "").trim();
const list = (max: number, n: number) =>
  z.unknown().transform((v) => (Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v] : []).map(toText).filter(Boolean).slice(0, n).map((x) => x.slice(0, max)));
const upTo = <T extends z.ZodTypeAny>(item: T, n: number) => z.unknown().transform((v) => (Array.isArray(v) ? v : []).flatMap((x) => { const r = item.safeParse(x); return r.success ? [r.data as z.infer<T>] : []; }).slice(0, n));

export const answerSchema = z.object({
  answer: z.string().trim().min(1).transform((x) => x.slice(0, 1500)),
  solution: z.object({ summary: z.unknown().transform(toText).transform((x) => x.slice(0, 800)), steps: list(400, 10) }).catch({ summary: "", steps: [] }).default({ summary: "", steps: [] }),
  explanation: z.object({ concept: z.unknown().transform(toText).transform((x) => x.slice(0, 1500)), whyItWorks: z.unknown().transform(toText).transform((x) => x.slice(0, 1000)), tradeoffs: list(300, 5) }).catch({ concept: "", whyItWorks: "", tradeoffs: [] }).default({ concept: "", whyItWorks: "", tradeoffs: [] }),
  examples: upTo(z.object({ title: z.coerce.string().trim().transform((x) => x.slice(0, 120) || "Example").default("Example"), input: z.unknown().transform(toText).transform((x) => x.slice(0, 600)), output: z.unknown().transform(toText).transform((x) => x.slice(0, 600)), explanation: z.unknown().transform(toText).transform((x) => x.slice(0, 600)) }), 3),
  code: upTo(z.object({ language: z.coerce.string().trim().transform((x) => x.slice(0, 30) || "text").default("text"), title: z.coerce.string().trim().transform((x) => x.slice(0, 120)).default(""), code: z.string().trim().min(1).transform((x) => x.slice(0, 6000)), explanation: list(300, 8) }), 3),
  diagram: lenientDiagram.nullable().catch(null).default(null),
  testing: list(300, 6),
  pitfalls: list(300, 6),
  interviewAnswer: z.unknown().transform(toText).transform((x) => x.slice(0, 800)),
  sources: list(10, 10),
  assumptions: list(300, 5),
  limitations: list(300, 5),
  nextActions: list(300, 5),
});
export type StructuredAnswer = Omit<z.infer<typeof answerSchema>, "diagram"> & { diagram: Diagram | null };

function prompt(input: { topicTitle: string; question: string; locale: string; level: string; goal: string; mode: AnswerMode; recentMistakes: string[]; sources: Source[] }) {
  const solutionRules = [
    "SOLUTION FIRST. `answer` directly answers the exact question in 1–4 sentences — the actual answer, never a hint or a question back.",
    "`solution`: the recommended approach as concrete ordered steps the student can follow.",
    "`explanation`: the concept, why the solution works, and real trade-offs.",
    "`examples`: one realistic example with concrete input, what happens, and the output.",
    "`code`: complete, runnable code for the example when code helps (no placeholders like `...`); `explanation` lists what the important lines do.",
    "`testing`: how to check it works. `pitfalls`: the common mistakes and edge cases.",
  ];
  const hintRules = [
    "HINT MODE (the student asked for hints, not the answer): `answer` gives a nudge toward the answer without stating it; `solution.steps` are progressive hints; leave `code` empty.",
  ];
  const system = [
    "You are the Prompters tutor for Indian engineering students: a senior engineer who teaches while solving.",
    LOCALE[input.locale] ?? LOCALE.hinglish,
    `Student level: ${input.level}. Goal: ${input.goal}. Topic: ${input.topicTitle}.`,
    ...(input.mode === "hints" ? hintRules : solutionRules),
    "`diagram`: include ONE diagram only when it makes the idea clearer (a flow of steps, a request timeline between actors, a state machine, a comparison, an architecture of layers or a decision). Otherwise null.",
    'Diagram shapes: {"kind":"flow","title","objective","steps":[{"label","note"}]} | {"kind":"timeline","title","objective","actors":[..],"events":[{"from","to","label"}]} | {"kind":"state","title","objective","states":[..],"transitions":[{"from","to","label"}]} | {"kind":"comparison","title","objective","left":{"title","points":[]},"right":{"title","points":[]}} | {"kind":"architecture","title","objective","layers":[{"label","nodes":[{"label","note"}]}]} | {"kind":"decision","title","objective","question","branches":[{"answer","result"}]}.',
    "`interviewAnswer`: 2–3 sentences in clear technical English a student could say in an interview.",
    "GROUNDING: the <sources> are Prompters' own lessons. Put the ids of sources you actually used in `sources` (e.g. [\"S1\",\"S3\"]); never invent ids. If you rely on general knowledge the sources don't cover, say so in `assumptions`. Anything you are unsure of goes in `limitations`. Never invent APIs, numbers or facts.",
    "`nextActions`: 1–3 concrete next things to practise.",
    'JSON keys: answer, solution{summary,steps}, explanation{concept,whyItWorks,tradeoffs}, examples[{title,input,output,explanation}], code[{language,title,code,explanation}], diagram, testing, pitfalls, interviewAnswer, sources, assumptions, limitations, nextActions. Omit nothing; use [] or "" when a field does not apply.',
  ].join("\n");
  const user = [
    fence("sources", input.sources.length ? input.sources.map((s) => `[${s.id}] ${s.topicTitle} — ${s.section}\n${s.text}`).join("\n\n") : "(no lesson content found for this question)"),
    input.recentMistakes.length ? `Questions the student recently got wrong:\n- ${input.recentMistakes.slice(0, 5).join("\n- ")}` : "",
    fence("question", input.question),
  ].filter(Boolean).join("\n\n");
  return { system, user };
}

export interface Verification {
  sourcesRetrieved: number;
  sourcesCited: number;
  /** Source ids the model cited that were never retrieved (removed). */
  inventedSources: number;
  diagram: "none" | "valid" | "repaired" | "dropped";
  grounded: boolean;
}

/** Server-side checks on the model's answer: only real sources, only diagrams that teach something. */
export function verify(raw: z.infer<typeof answerSchema>, sources: Source[]): { answer: StructuredAnswer; verification: Verification } {
  const known = new Set(sources.map((s) => s.id));
  const cited = [...new Set(raw.sources.map((s) => s.trim().toUpperCase()))];
  const real = cited.filter((s) => known.has(s));
  let diagram: Diagram | null = raw.diagram ?? null;
  let state: Verification["diagram"] = diagram ? "valid" : "none";
  if (diagram && (!coherent(diagram) || diagramFault(diagram))) {
    const repaired = repairDiagram(diagram);
    if (coherent(repaired) && !diagramFault(repaired)) {
      diagram = repaired;
      state = "repaired";
    } else {
      diagram = null;
      state = "dropped";
    }
  }
  const assumptions = [...raw.assumptions];
  if (!real.length) assumptions.unshift(sources.length ? "This answer isn't backed by a specific Prompters lesson — treat it as general knowledge." : "No Prompters lesson covers this question yet — this answer is general knowledge.");
  return {
    answer: { ...raw, sources: real, diagram, assumptions: assumptions.slice(0, 6) },
    verification: { sourcesRetrieved: sources.length, sourcesCited: real.length, inventedSources: cited.length - real.length, diagram: state, grounded: real.length > 0 },
  };
}

/** Plain Markdown version, for clients that render text only (and for copying). */
export function toMarkdown(a: StructuredAnswer, sources: Source[]) {
  const out: string[] = [`**${a.answer}**`];
  if (a.solution.summary || a.solution.steps.length) out.push("### Solution", a.solution.summary, ...a.solution.steps.map((s, i) => `${i + 1}. ${s}`));
  if (a.explanation.concept || a.explanation.whyItWorks) out.push("### Why it works", a.explanation.concept, a.explanation.whyItWorks);
  for (const e of a.examples) out.push(`### ${e.title}`, e.input && `**Input:** ${e.input}`, e.output && `**Output:** ${e.output}`, e.explanation);
  for (const c of a.code) out.push(c.title && `### ${c.title}`, "```" + c.language + "\n" + c.code + "\n```", ...c.explanation.map((x) => `- ${x}`));
  if (a.testing.length) out.push("### How to test", ...a.testing.map((x) => `- ${x}`));
  if (a.pitfalls.length) out.push("### Common mistakes", ...a.pitfalls.map((x) => `- ${x}`));
  if (a.interviewAnswer) out.push("### Interview answer", a.interviewAnswer);
  const used = sources.filter((s) => a.sources.includes(s.id));
  if (used.length) out.push("### Sources", ...used.map((s) => `- ${s.topicTitle} (${s.section.toLowerCase()})`));
  return out.filter(Boolean).join("\n\n");
}

type AnswerInput = { topicTitle: string; question: string; locale: string; level: string; goal: string; mode: AnswerMode; recentMistakes: string[] };

export async function answerQuestion(input: AnswerInput & { topicId: string }) {
  return generateAnswer(input, await retrieve(input.topicId, input.question, input.locale));
}

/** Model call + verification over already-retrieved sources (also used by the real-model check). */
export async function generateAnswer(input: AnswerInput, sources: Source[]) {
  const { system, user } = prompt({ ...input, sources });
  const raw = await aiJson("tutor_answer", system, user, answerSchema, 6000, { timeoutMs: 90_000 });
  const { answer, verification } = verify(raw, sources);
  return {
    structured: answer,
    sources: sources.filter((s) => answer.sources.includes(s.id)).map(({ id, topicSlug, topicTitle, section }) => ({ id, topicSlug, topicTitle, section })),
    verification,
    markdown: toMarkdown(answer, sources),
  };
}
