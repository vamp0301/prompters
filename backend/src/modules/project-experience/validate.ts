import { keepDiagram } from "../career/knowledge.validate.js";
import type { Diagram } from "../career/knowledge.schemas.js";
import { normalize } from "../prep/text.js";
import { NOT_MEASURED, NOT_SPECIFIED, type ProjectContext, type QuestionsPart, type Story, type TechPart } from "./content.js";
import { FACT_FIELDS } from "./extract.js";
import { categoryOf, techKey, techsMentioned } from "./tech.js";

/**
 * No-fabrication checks for generated project content. Everything the candidate would say as fact
 * must be backed by their resume or their own facts:
 *  - numbers in answers and facts (%, ms, users, uptime…) must appear in that evidence;
 *  - "what we built / how it works" text may only name technologies the project uses
 *    (alternatives and comparisons may name anything);
 *  - exactly 20 project-specific questions, 4 per level.
 * After one retry with the reasons, whatever still fails is removed (scrubbed), never shipped.
 */

export interface Check<T> {
  value: T;
  problems: string[];
  fixes: string[];
}

/** All text the candidate's facts can rest on. */
export function evidenceText(c: ProjectContext) {
  return [c.name, c.company, c.role, ...c.evidence.chunks.map((x) => `${x.title} ${x.text}`), c.evidence.problem, c.evidence.architecture, ...c.evidence.features, c.evidence.contribution, ...c.evidence.claims.map((x) => `${x.claim} ${x.evidence}`), ...FACT_FIELDS.map((f) => c.facts[f.key]?.value)]
    .filter(Boolean)
    .join("\n");
}

const METRIC = /\b(\d+(?:[.,]\d+)?)\s*(%|percent|x\b|×|ms\b|milliseconds?|seconds?\b|secs?\b|users?\b|customers?\b|requests?\b|rps\b|qps\b|req\/s|k\b|k\+|million|billion|lakh|crore|records?\b|messages?\b|tenants?\b|jobs?\b|uptime|hours?\b|minutes?\b|downloads?\b)|\b99\.\d+/gi;

/** Numbers stated as metrics that the evidence doesn't contain. */
export function unverifiedMetrics(text: string, evidence: string) {
  const ev = evidence.replace(/,/g, "");
  const out: string[] = [];
  for (const m of text.matchAll(METRIC)) {
    const n = (m[1] ?? m[0]).replace(/,/g, "");
    if (!new RegExp(`(^|[^0-9.])${n.replace(".", "\\.")}([^0-9]|$)`).test(ev)) out.push(m[0]);
  }
  return out;
}

export function projectTechKeys(c: ProjectContext) {
  return new Set(c.technologies.map((t) => techKey(t)).filter((k): k is string => !!k));
}

/** Technologies named in text that the project doesn't use. */
export function foreignTechs(text: string, allowed: Set<string>) {
  return [...techsMentioned(text)].filter((k) => !allowed.has(k));
}

const sentences = (t: string) => t.split(/(?<=[.!?])\s+/);
/** Drops sentences carrying an unverified number; falls back to the placeholder when nothing is left. */
function scrubMetrics(text: string, evidence: string, fallback: string) {
  const kept = sentences(text).filter((s) => unverifiedMetrics(s, evidence).length === 0);
  return kept.length ? kept.join(" ") : fallback;
}

/** A diagram of the stated stack only, when the generated one can't be trusted. */
export function fallbackDiagram(c: ProjectContext): Diagram {
  const by = (cats: string[]) => c.technologies.filter((t) => cats.includes(categoryOf(t) ?? ""));
  const layers = [
    { label: "Client", nodes: [{ label: "User" }] },
    { label: "Frontend", nodes: (by(["frontend"]).length ? by(["frontend"]) : ["Frontend"]).slice(0, 4).map((label) => ({ label })) },
    { label: "Backend", nodes: (by(["backend"]).length ? by(["backend"]) : ["API"]).slice(0, 4).map((label) => ({ label })) },
    ...(by(["database", "cache", "search"]).length ? [{ label: "Data", nodes: by(["database", "cache", "search"]).slice(0, 4).map((label) => ({ label })) }] : []),
    ...(by(["ai", "messaging", "payments", "storage"]).length ? [{ label: "External services", nodes: by(["ai", "messaging", "payments", "storage"]).slice(0, 4).map((label) => ({ label })) }] : []),
  ];
  return { kind: "architecture", title: `${c.name} — stated stack`, objective: "The parts of the project listed on the resume and in your facts", alt: `${c.name}: ${layers.map((l) => `${l.label}: ${l.nodes.map((n) => n.label).join(", ")}`).join("; ")}`, layers };
}

const diagramText = (d: Diagram) => JSON.stringify(d);

export function checkStory(s: Story, c: ProjectContext, final: boolean): Check<Story> {
  const ev = evidenceText(c);
  const allowed = projectTechKeys(c);
  const problems: string[] = [];
  const fixes: string[] = [];
  const v: Story = JSON.parse(JSON.stringify(s));

  // Text the candidate would present as what they built / how it works.
  type Field = { get: () => string; set: (t: string) => void; name: string; factual: boolean; placeholder: string };
  const fields: Field[] = [
    ...(["problem", "users", "whatBuilt"] as const).map((k) => ({ name: `overview.${k}`, get: () => v.overview[k].text, set: (t: string) => (v.overview[k] = { text: t, basis: t === NOT_SPECIFIED ? "NOT_SPECIFIED" : v.overview[k].basis }), factual: true, placeholder: NOT_SPECIFIED })),
    ...v.experience.map((e, i) => ({ name: `experience[${i}]`, get: () => e.answer, set: (t: string) => (v.experience[i] = { ...e, answer: t, basis: t === NOT_SPECIFIED ? "NOT_SPECIFIED" : e.basis }), factual: true, placeholder: NOT_SPECIFIED })),
    { name: "pitches.sec30", get: () => v.pitches.sec30, set: (t: string) => (v.pitches.sec30 = t), factual: true, placeholder: NOT_SPECIFIED },
    { name: "pitches.sec60", get: () => v.pitches.sec60, set: (t: string) => (v.pitches.sec60 = t), factual: true, placeholder: NOT_SPECIFIED },
    ...v.pitches.min2.map((b, i) => ({ name: `pitches.min2[${i}]`, get: () => b, set: (t: string) => (v.pitches.min2[i] = t), factual: true, placeholder: "" })),
    ...v.pitches.min5.map((b, i) => ({ name: `pitches.min5[${i}]`, get: () => b, set: (t: string) => (v.pitches.min5[i] = t), factual: true, placeholder: "" })),
    ...v.architecture.requestFlow.map((b, i) => ({ name: `requestFlow[${i}]`, get: () => b, set: (t: string) => (v.architecture.requestFlow[i] = t), factual: true, placeholder: "" })),
    ...v.dataFlow.flatMap((d, i) => (["step", "why", "whatCanFail", "handling"] as const).map((k) => ({ name: `dataFlow[${i}].${k}`, get: () => v.dataFlow[i][k], set: (t: string) => (v.dataFlow[i] = { ...v.dataFlow[i], [k]: t }), factual: k === "step" || k === "why", placeholder: "" }))),
    ...(["problem", "cause", "identified", "solution"] as const).map((k) => ({ name: `performance.${k}`, get: () => v.performance[k].text, set: (t: string) => (v.performance[k] = { text: t, basis: t === NOT_SPECIFIED ? "NOT_SPECIFIED" : v.performance[k].basis }), factual: true, placeholder: NOT_SPECIFIED })),
    { name: "performance.result", get: () => v.performance.result.text, set: (t: string) => (v.performance.result = { text: t, basis: t === NOT_MEASURED ? "NOT_SPECIFIED" : v.performance.result.basis }), factual: true, placeholder: NOT_MEASURED },
    ...v.challenges.real.map((r, i) => ({ name: `challenges.real[${i}]`, get: () => r.text, set: (t: string) => (v.challenges.real[i] = { ...r, text: t }), factual: true, placeholder: "" })),
    // Advice and hypotheticals may name other technologies, but never invent measured results.
    ...v.challenges.likely.map((b, i) => ({ name: `challenges.likely[${i}]`, get: () => b, set: (t: string) => (v.challenges.likely[i] = t), factual: false, placeholder: "" })),
    ...v.ifBuiltToday.flatMap((r, i) => [
      // "Current" describes what exists — the project's own stack only.
      { name: `ifBuiltToday[${i}].current`, get: () => v.ifBuiltToday[i].current, set: (t: string) => (v.ifBuiltToday[i] = { ...v.ifBuiltToday[i], current: t }), factual: true, placeholder: "" },
      ...(["recommended", "reason"] as const).map((k) => ({ name: `ifBuiltToday[${i}].${k}`, get: () => v.ifBuiltToday[i][k], set: (t: string) => (v.ifBuiltToday[i] = { ...v.ifBuiltToday[i], [k]: t }), factual: false, placeholder: "" })),
    ]),
    ...v.tradeoffs.map((b, i) => ({ name: `tradeoffs[${i}]`, get: () => b, set: (t: string) => (v.tradeoffs[i] = t), factual: false, placeholder: "" })),
  ];
  if (v.database) {
    const db = v.database;
    fields.push({ name: "database.dataModel", get: () => db.dataModel.text, set: (t) => (db.dataModel = { text: t, basis: t === NOT_SPECIFIED ? "NOT_SPECIFIED" : db.dataModel.basis }), factual: true, placeholder: NOT_SPECIFIED });
    db.entities.forEach((e, i) => fields.push({ name: `database.entities[${i}]`, get: () => e, set: (t) => (db.entities[i] = t), factual: true, placeholder: "" }));
    db.questions.forEach((q, i) => fields.push({ name: `database.questions[${i}]`, get: () => q.a, set: (t) => (db.questions[i] = { ...q, a: t }), factual: false, placeholder: "" }));
    if (!allowed.has(techKey(db.name) ?? "") && techKey(db.name)) {
      problems.push(`database.name "${db.name}" is not one of the project's technologies.`);
      if (final) {
        v.database = null;
        fixes.push("Removed a database section about a database the project doesn't use.");
      }
    }
  }

  for (const f of fields) {
    const text = f.get();
    if (!text) continue;
    const metrics = unverifiedMetrics(text, ev);
    if (metrics.length) {
      problems.push(`${f.name}: numbers not in the resume or facts (${metrics.join(", ")}). Remove them or write "${NOT_MEASURED}".`);
      if (final) {
        f.set(f.name === "performance.result" ? NOT_MEASURED : scrubMetrics(text, ev, f.placeholder));
        fixes.push(`Removed unverified numbers from ${f.name}.`);
      }
    }
    if (f.factual) {
      const foreign = foreignTechs(f.get(), allowed);
      if (foreign.length) {
        problems.push(`${f.name}: says the project used ${foreign.join(", ")}, which isn't in its technologies. Only mention it as an alternative or recommendation.`);
        if (final) {
          f.set(f.placeholder);
          fixes.push(`Removed an unsupported technology claim from ${f.name}.`);
        }
      }
    }
  }
  if (final) {
    v.pitches.min2 = v.pitches.min2.filter(Boolean);
    v.pitches.min5 = v.pitches.min5.filter(Boolean);
    v.architecture.requestFlow = v.architecture.requestFlow.filter(Boolean);
    v.dataFlow = v.dataFlow.filter((d) => d.step && d.why && d.whatCanFail && d.handling);
    v.challenges.real = v.challenges.real.filter((r) => r.text);
    v.challenges.likely = v.challenges.likely.filter(Boolean);
    v.ifBuiltToday = v.ifBuiltToday.filter((r) => r.current && r.recommended && r.reason);
    v.tradeoffs = v.tradeoffs.filter(Boolean);
    if (v.database) v.database.entities = v.database.entities.filter(Boolean);
  }

  // The architecture diagram may only contain the project's own components.
  const diagram = v.architecture.diagram ? keepDiagram(v.architecture.diagram, fixes) : undefined;
  const foreignInDiagram = diagram ? foreignTechs(diagramText(diagram), allowed) : [];
  if (!diagram || foreignInDiagram.length) {
    if (foreignInDiagram.length) problems.push(`architecture.diagram shows ${foreignInDiagram.join(", ")}, which the project doesn't use.`);
    if (final || !diagram) {
      v.architecture.diagram = fallbackDiagram(c);
      fixes.push("Architecture diagram drawn from the stated stack.");
    }
  } else v.architecture.diagram = diagram;

  if (v.skillLadder.length !== 5) problems.push("skillLadder must have exactly 5 levels (L1-L5).");
  return { value: v, problems, fixes };
}

export function checkTech(t: TechPart, c: ProjectContext, final: boolean): Check<TechPart> {
  const allowed = projectTechKeys(c);
  const ev = evidenceText(c);
  const problems: string[] = [];
  const fixes: string[] = [];
  const kept = t.technologies.filter((card) => {
    const k = techKey(card.technology);
    const listed = c.technologies.some((x) => normalize(x) === normalize(card.technology));
    if (k ? allowed.has(k) : listed) return true;
    fixes.push(`Dropped a card for ${card.technology}, which the project doesn't use.`);
    return false;
  });
  for (const card of kept) {
    for (const [name, text] of [["howUsed", card.howUsed.text], ["whyUsed.fact", card.whyUsed.fact ?? ""], ["answer", card.answer]] as const) {
      const metrics = unverifiedMetrics(text, ev);
      if (metrics.length) {
        problems.push(`${card.technology}.${name}: numbers not in the resume or facts (${metrics.join(", ")}).`);
        if (final) {
          if (name === "howUsed") card.howUsed = { text: scrubMetrics(text, ev, NOT_SPECIFIED), basis: "GENERAL" };
          else if (name === "whyUsed.fact") card.whyUsed.fact = null;
          else card.answer = scrubMetrics(text, ev, NOT_SPECIFIED);
          fixes.push(`Removed unverified numbers from ${card.technology}.${name}.`);
        }
      }
    }
    // How it was used must describe this technology in this project, not others.
    if (card.howUsed.basis !== "NOT_SPECIFIED" && foreignTechs(card.howUsed.text, allowed).length) {
      problems.push(`${card.technology}.howUsed mentions technologies the project doesn't use.`);
      if (final) card.howUsed = { text: NOT_SPECIFIED, basis: "NOT_SPECIFIED" };
    }
  }
  const known = [...allowed];
  const covered = new Set(kept.map((x) => techKey(x.technology)).filter(Boolean));
  if (known.length && covered.size < Math.ceil(known.length * 0.6)) problems.push(`Write a card for every listed technology (missing: ${known.filter((k) => !covered.has(k)).join(", ")}).`);
  return { value: { technologies: kept }, problems, fixes };
}

export function checkQuestions(q: QuestionsPart, c: ProjectContext, final: boolean): Check<QuestionsPart> {
  const ev = evidenceText(c);
  const problems: string[] = [];
  const fixes: string[] = [];
  const anchors = [c.name, ...c.technologies, ...c.evidence.features, ...c.evidence.claims.map((x) => x.claim), c.company ?? ""].filter(Boolean);
  const anchorWords = new Set(anchors.flatMap((a) => normalize(a).split(" ")).filter((w) => w.length >= 4 && !["with", "from", "that", "this", "using", "built", "your", "project", "system"].includes(w)));
  const specific = (text: string) => normalize(text).split(" ").some((w) => anchorWords.has(w)) || techsMentioned(text).size > 0 || /\byour (project|app|system|platform|implementation|team)\b/i.test(text);
  const seen = new Set<string>();
  let questions = q.questions.filter((x) => {
    const k = normalize(x.question);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const generic = questions.filter((x) => !specific(x.question));
  if (generic.length) {
    problems.push(`These questions aren't about this project — name the project or its technologies: ${generic.slice(0, 3).map((x) => `"${x.question}"`).join("; ")}.`);
    questions = questions.filter((x) => specific(x.question));
  }
  // Answers are what the candidate says: no invented measurements. A number the question itself
  // poses ("…from 600 to 600,000 users?") is a stated hypothetical, so its answer may repeat it.
  for (const x of questions) {
    for (const key of ["answer", "followUpAnswer", "deepFollowUpAnswer"] as const) {
      const asked = key === "answer" ? x.question : key === "followUpAnswer" ? `${x.question}\n${x.followUp}` : `${x.question}\n${x.followUp}\n${x.deepFollowUp}`;
      const m = unverifiedMetrics(x[key], `${ev}\n${asked}`);
      if (m.length) {
        problems.push(`Answer to "${x.question.slice(0, 60)}…" states numbers not in the resume or facts (${m.join(", ")}).`);
        if (final) {
          x[key] = scrubMetrics(x[key], `${ev}\n${asked}`, "Use your own measured numbers here — none were provided.");
          fixes.push("Removed unverified numbers from an answer.");
        }
      }
    }
  }
  // Exactly 4 per level, 20 in all.
  const byLevel = [1, 2, 3, 4, 5].map((l) => questions.filter((x) => x.level === l));
  if (byLevel.some((l) => l.length < 4)) problems.push(`Need exactly 4 questions per level; have ${byLevel.map((l, i) => `L${i + 1}=${l.length}`).join(", ")}.`);
  questions = byLevel.flatMap((l) => l.slice(0, 4));

  const claimIds = new Set(c.evidence.claims.map((x) => x.id));
  const claimDefense = q.claimDefense.filter((d) => claimIds.has(d.claimId) && d.questions.length >= 3);
  if (c.evidence.claims.length && !claimDefense.length) problems.push("claimDefense: write 5-9 defense questions for each resume claim id.");
  const experienceQuestions = c.source === "PROJECT" ? [] : q.experienceQuestions;
  if (c.source !== "PROJECT" && experienceQuestions.length < 4) problems.push("experienceQuestions: write 6-9 work-experience questions (ownership, production, review, testing).");
  if (q.drillDown.length < 6) problems.push("drillDown: write 8-12 chained interviewer questions.");
  return { value: { questions, drillDown: q.drillDown, claimDefense, experienceQuestions }, problems, fixes };
}
