import type { ConceptRef, Diagram, SkillMapContent } from "./knowledge.schemas.js";
import { CONCEPT_VERSION, coherent, type ConceptChapterContent } from "./knowledge.schemas.js";
import type { z } from "zod";
import type { conceptSchema } from "./knowledge.schemas.js";

/**
 * Checks a generated chapter against the contract before it is stored or shown. These checks catch
 * structure and scope problems (mixed concepts, missing or broken diagrams, unrelated code, missing
 * subtopics, generic or repeated text). They do NOT prove the content is factually correct — the UI
 * keeps the "AI-written — verify" label for that reason.
 */

type Raw = z.infer<typeof conceptSchema>;

export interface ChapterContext {
  skill: string;
  domain: string;
  concept: ConceptRef;
  /** Titles the chapter may mention freely: prerequisites, related and same-domain concepts. */
  related: string[];
  /** Every concept title in the skill's map (to spot unrelated ones). */
  allConcepts: string[];
}

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "vs", "what", "is", "design", "basics", "how", "your", "do", "does", "it", "its", "system", "systems"]);

/** Comparable word stems: lower-case, letters/digits, plural "s" dropped, first 7 characters ("Layer 4" = "L4"). */
export const stems = (text: string) =>
  (text.toLowerCase().replace(/\blayer[\s-]*(\d)\b/g, "l$1").match(/[a-z0-9+#]+/g) ?? [])
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w).slice(0, 7));

/** True when every meaningful word of `phrase` appears in `text` (by stem). */
export function mentions(text: string, phrase: string) {
  const want = stems(phrase);
  if (!want.length) return false;
  const have = new Set(stems(text));
  return want.every((w) => have.has(w));
}

/** Does any meaningful word of the concept title appear in the text? */
const touches = (text: string, phrase: string) => {
  const have = new Set(stems(text));
  return stems(phrase).some((w) => have.has(w));
};

function diagramLabels(d: Diagram): string[] {
  switch (d.kind) {
    case "architecture":
      return d.layers.flatMap((l) => [l.label ?? "", ...l.nodes.map((n) => n.label)]);
    case "flow":
      return d.steps.flatMap((s) => [s.label, ...(s.branches ?? []).flatMap((b) => [b.label, ...b.steps])]);
    case "comparison":
      return [d.left.title, ...d.left.points, d.right.title, ...d.right.points];
    case "timeline":
      return [...d.actors, ...d.events.map((e) => e.label)];
    case "state":
      return [...d.states, ...d.transitions.map((t) => t.label ?? "")];
    case "decision":
      return [d.question, ...d.branches.flatMap((b) => [b.answer, b.result ?? "", b.question ?? "", ...(b.branches ?? []).flatMap((c) => [c.answer, c.result])])];
  }
}

/** Why a diagram doesn't teach anything (null when it does): too few parts or inconsistent references. */
export function diagramFault(d: Diagram): string | null {
  if (!coherent(d)) return d.kind === "timeline" ? "messages between actors it doesn't declare" : "transitions between states it doesn't declare";
  const distinct = new Set(diagramLabels(d).map((l) => l.trim().toLowerCase()).filter(Boolean));
  if (distinct.size < 3) return "fewer than 3 distinct parts";
  if (d.kind === "architecture" && d.layers.reduce((n, l) => n + l.nodes.length, 0) < 3) return "fewer than 3 components";
  if (d.kind === "flow" && d.steps.length < 3 && !d.steps.some((s) => s.branches?.length)) return "fewer than 3 steps";
  return null;
}
export const meaningful = (d: Diagram) => diagramFault(d) === null;

/**
 * Timelines and state diagrams often name the same actor/state slightly differently ("client" vs
 * "Client"), or use one they forgot to declare. Names are matched case-insensitively and missing
 * ones are declared when there is room, so a correct diagram isn't thrown away over a typo.
 */
export function repairDiagram(d: Diagram): Diagram {
  if (d.kind !== "timeline" && d.kind !== "state") return d;
  const declared = d.kind === "timeline" ? [...d.actors] : [...d.states];
  const room = d.kind === "timeline" ? 5 : 8;
  const canon = (name: string) => {
    const hit = declared.find((x) => x.trim().toLowerCase() === name.trim().toLowerCase());
    if (hit) return hit;
    if (declared.length < room) declared.push(name.trim());
    return name;
  };
  if (d.kind === "timeline") {
    const events = d.events.map((e) => ({ ...e, from: canon(e.from), to: canon(e.to) }));
    return { ...d, actors: declared, events };
  }
  const transitions = d.transitions.map((t) => ({ ...t, from: canon(t.from), to: canon(t.to) }));
  return { ...d, states: declared, transitions };
}

/** Repairs, then keeps the diagram only if it teaches something; records why one was dropped. */
export function keepDiagram(d: Diagram, fixes: string[]): Diagram | undefined {
  const fixed = repairDiagram(d);
  const fault = diagramFault(fixed);
  if (fault) {
    fixes.push(`Dropped diagram "${d.title}": ${fault}.`);
    return undefined;
  }
  return tidyDiagram(fixed, fixes);
}

/**
 * Makes a kept diagram safe to render: every diagram gets an objective and screen-reader text (built
 * from its labels when the model left them out), and step-through highlights that point at a
 * component the diagram doesn't contain are removed so the step never highlights nothing.
 */
export function tidyDiagram(d: Diagram, fixes: string[]): Diagram {
  const labels = [...new Set(diagramLabels(d).map((l) => l.trim()).filter(Boolean))];
  const known = new Set(labels.map((l) => l.toLowerCase()));
  let out = d;
  if (d.walkthrough?.some((s) => s.highlight && !known.has(s.highlight.toLowerCase()))) {
    fixes.push(`Removed step highlights in "${d.title}" that pointed at missing components.`);
    out = { ...out, walkthrough: d.walkthrough.map((s) => (s.highlight && !known.has(s.highlight.toLowerCase()) ? { label: s.label } : s)) };
  }
  if (!d.objective?.trim() || !d.alt?.trim()) {
    fixes.push(`Filled in missing description for diagram "${d.title}".`);
    out = { ...out, objective: d.objective?.trim() || d.title, alt: d.alt?.trim() || `${d.title} (${d.kind} diagram): ${labels.join(", ")}`.slice(0, 400) };
  }
  return out;
}

const allText = (c: Raw) =>
  [
    c.oneLine, c.explainLikeNew, c.why.problem, c.why.solution, c.why.tradeoff, c.mentalModel.analogy, c.mentalModel.explanation,
    ...c.howItWorks, ...c.deepDives.flatMap((d) => [d.title, d.body, ...d.points]), ...c.realWorld.flatMap((r) => [r.where, r.how]),
    ...c.whenToUse, ...c.whenNotToUse, ...c.advantages, ...c.disadvantages, ...c.tradeoffs, ...c.internals,
    ...c.mistakes.flatMap((m) => [m.wrong, m.right]), ...c.levels.map((l) => l.question), ...c.keyPoints,
    ...c.visuals.flatMap((v) => [v.title, v.objective ?? "", ...diagramLabels(v)]), ...c.deepDives.flatMap((d) => (d.visual ? diagramLabels(d.visual) : [])),
  ].join("\n");

/** Adoption or market statistics ("70% of companies", "2 million developers") — we can't source them, so they are never shown. */
const STAT_CLAIM = /\b\d[\d,.]*\s*(%|percent|thousand|million|billion|crore|lakh)\+?\s+(of\s+)?(the\s+)?(top\s+|all\s+)?(companies|developers|users|websites|engineers|businesses|organi[sz]ations|enterprises|startups|apps|projects|fortune)/i;
/** Unsourced performance numbers ("cuts latency by 60%", "40% faster"). Big-O and protocol facts are fine. */
const GAIN_CLAIM = /\b\d+(\.\d+)?\s*%\s*(faster|slower|cheaper|less|more|reduction|increase|improvement|lower|higher)\b|\b(by|reduces?|cuts?|improves?|increases?)\s+\w*\s*(by\s+)?(up\s+to\s+)?\d+(\.\d+)?\s*%/i;
/** Claims about how a named company runs its systems internally. Learners get product types instead. */
const COMPANY_CLAIM = /\b(Netflix|Amazon|AWS|Google|Meta|Facebook|Uber|Twitter|Instagram|WhatsApp|LinkedIn|Airbnb|Flipkart|Swiggy|Zomato|Paytm|Microsoft|Apple|Spotify|Discord|Slack|YouTube|Stripe|Shopify)\b[^.]{0,50}\b(uses|used|built|runs|relies|handles|serves|processes|stores|migrated|internally)\b/i;

/** Learner-facing prose (not quiz/interview prompts, where hypothetical numbers are part of a scenario). */
const prose = (c: Raw) =>
  [
    c.oneLine, c.explainLikeNew, c.why.problem, c.why.solution, c.why.tradeoff, c.mentalModel.explanation, ...c.howItWorks,
    ...c.deepDives.flatMap((d) => [d.body, ...d.points]), ...c.realWorld.flatMap((r) => [r.where, r.how]),
    ...c.whenToUse, ...c.whenNotToUse, ...c.advantages, ...c.disadvantages, ...c.tradeoffs, ...c.internals,
    c.cheatSheet.definition, ...c.cheatSheet.useFor, ...c.cheatSheet.remember,
  ];

export interface Validation {
  ok: boolean;
  problems: string[];
  /** Notes about things that were fixed instead of rejected (e.g. unrelated code removed). */
  fixes: string[];
  content: ConceptChapterContent;
}

export function validateChapter(raw: Raw, ctx: ChapterContext): Validation {
  const problems: string[] = [];
  const fixes: string[] = [];
  const title = ctx.concept.title;

  // 1. Diagrams: keep only meaningful ones; at least one is mandatory.
  const visuals = raw.visuals.map((d) => keepDiagram(d, fixes)).filter((d): d is Diagram => !!d);
  if (!visuals.length) problems.push("No meaningful diagram: give at least one diagram with 3+ distinct, consistently labelled parts that teaches this concept.");
  const deepDives = raw.deepDives.map((d) => (d.visual ? { ...d, visual: keepDiagram(d.visual, fixes) } : d));

  // The problem → solution → trade-off pattern needs all three parts.
  let why = raw.why;
  if (!why.tradeoff.trim()) {
    const from = raw.tradeoffs[0] ?? raw.disadvantages[0];
    if (from) {
      why = { ...why, tradeoff: from };
      fixes.push("Filled in the missing trade-off from the trade-offs list.");
    } else problems.push("Missing the trade-off in why: {problem, solution, tradeoff}.");
  }

  // 2. Scope: the core explanation must be about THIS concept and not drift into unrelated ones.
  // A sentence that discusses another concept while never referring to this one is drift; passing
  // mentions ("health checks keep availability high") are fine.
  const core = [raw.oneLine, raw.explainLikeNew, raw.why.problem, raw.why.solution, raw.mentalModel.explanation, ...raw.howItWorks];
  if (!touches([raw.oneLine, raw.explainLikeNew].join(" "), title)) problems.push(`The one-line idea and beginner explanation must be about "${title}" itself.`);
  const allowed = [title, ...ctx.related, ...ctx.concept.covers];
  const onThis = (seg: string) => touches(seg, title) || ctx.concept.covers.some((cv) => mentions(seg, cv));
  const drift = core.filter((seg) => !onThis(seg));
  const unrelated = ctx.allConcepts.filter((t) => t !== title && stems(t).length && !allowed.some((a) => a.toLowerCase() === t.toLowerCase() || mentions(a, t) || mentions(t, a)) && drift.some((seg) => mentions(seg, t)));
  if (unrelated.length >= 2) problems.push(`Mixed scope: the core explanation teaches other concepts (${unrelated.slice(0, 4).join(", ")}). Teach only "${title}"; mention others only as related concepts.`);
  const stepsOnTopic = raw.howItWorks.filter((s) => touches(s, title) || ctx.concept.covers.some((cv) => touches(s, cv))).length;
  if (stepsOnTopic === 0) problems.push(`"How it works" is generic: the steps never refer to ${title} or its subtopics.`);

  // 3. Approved subtopics must actually be taught.
  if (ctx.concept.covers.length) {
    const text = allText(raw);
    const missing = ctx.concept.covers.filter((cv) => !mentions(text, cv));
    if (missing.length / ctx.concept.covers.length > 0.4) problems.push(`Missing required subtopics: ${missing.join(", ")}.`);
  }

  // 4. Interview questions must be about this concept.
  const onTopicLevels = raw.levels.filter((l) => touches(`${l.question} ${l.hint}`, title) || ctx.concept.covers.some((cv) => touches(l.question, cv))).length;
  if (onTopicLevels < Math.ceil(raw.levels.length / 2)) problems.push("Interview questions are not about this concept.");

  // 5. Code: only when it teaches the concept. Unrelated code is removed, never shown.
  let code: ConceptChapterContent["code"] = null;
  let codeNote: string | null = null;
  const impl = raw.implementation;
  if (impl.applicable && impl.snippet?.trim()) {
    const about = `${impl.snippet}\n${impl.explanation ?? ""}`;
    if (touches(about, title) || ctx.concept.covers.some((cv) => touches(about, cv))) {
      code = { language: impl.language || "text", snippet: impl.snippet, explanation: impl.explanation ?? "" };
    } else {
      fixes.push("Removed code that wasn't about this concept.");
      codeNote = "Code is not the best way to understand this concept.";
    }
  } else {
    codeNote = impl.reason?.trim() || "Code is not the best way to understand this concept.";
  }

  // 6. Repetition: the same sentence copied across sections is filler.
  const seen = new Map<string, number>();
  for (const line of allText(raw).split("\n")) {
    const k = line.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (k.split(" ").length >= 6) seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const repeated = [...seen.values()].filter((n) => n > 1).length;
  if (repeated > 3) problems.push("Too much repeated text across sections.");

  // 7. No invented scale thresholds in advice ("only for millions of users").
  if ([...raw.whenToUse, ...raw.whenNotToUse].some((x) => /\b(millions|billions|thousands) of (users|requests|customers)\b/i.test(x))) {
    problems.push("Avoid artificial scale thresholds in when-to-use advice; explain the conditions (traffic pattern, availability needs) instead.");
  }

  // 8. Authenticity: no statistics, invented gains or company internals we can't source.
  const claims = prose(raw).filter((x) => STAT_CLAIM.test(x) || GAIN_CLAIM.test(x) || COMPANY_CLAIM.test(x));
  if (claims.length) problems.push(`Remove unsourced claims (statistics, percentage gains or named-company internals): "${claims[0].slice(0, 120)}". Describe the kind of product and the mechanism instead.`);

  return {
    ok: problems.length === 0,
    problems,
    fixes,
    // The stored implementation never keeps code that was rejected.
    content: { ...raw, why, visuals, deepDives, implementation: code ? raw.implementation : { applicable: false, reason: codeNote ?? undefined }, code, codeNote, _v: CONCEPT_VERSION },
  };
}

/** The structured context the model gets for one approved concept. */
export function chapterContext(map: SkillMapContent, skill: string, conceptKey: string): ChapterContext & { previous: string[] } {
  const all = map.domains.flatMap((d) => d.concepts.map((c) => ({ ...c, domain: d })));
  const hit = all.find((c) => c.key === conceptKey)!;
  const titles = new Map(all.map((c) => [c.key, c.title]));
  const sameDomain = hit.domain.concepts;
  const idx = sameDomain.findIndex((c) => c.key === conceptKey);
  const unlocks = all.filter((c) => c.prerequisites.includes(conceptKey)).map((c) => c.title);
  const related = [...new Set([...hit.prerequisites.map((k) => titles.get(k) ?? k), ...unlocks, ...sameDomain.filter((c) => c.key !== conceptKey).map((c) => c.title)])];
  return {
    skill,
    domain: hit.domain.title,
    concept: hit,
    related,
    allConcepts: all.map((c) => c.title),
    previous: sameDomain.slice(0, idx).map((c) => c.title),
  };
}
