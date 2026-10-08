import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { aiJson } from "../../ai/json.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { aiSection } from "./ai-section.js";
import { PROJECT_CONTENT_VERSION, projectPrompts, questionsSchema, storySchema, techSchema, type ProjectContext, type QuestionsPart, type Story, type TechPart } from "./content.js";
import { FACT_FIELDS, projectTechnologies, resumeFacts, syncProjects, type Evidence, type FactKey, type Facts } from "./extract.js";
import { integrationMap } from "./integrations.js";
import { normalize } from "../prep/text.js";
import { categoryOf } from "./tech.js";
import { checkQuestions, checkStory, checkTech, type Check } from "./validate.js";

/**
 * Lighter model first (the primary model is the automatic fallback). Benchmarked 2026-10-09: on the
 * free tier Flash-Lite built every resume project cleanly, and the primary model's daily quota is
 * shared with interviews. Re-run `npm run project:benchmark` before changing this (e.g. on a paid key).
 */
const AI = { timeoutMs: 120_000, fast: true } as const;

type Project = NonNullable<Awaited<ReturnType<typeof prisma.projectExperience.findFirst>>>;

export function contextOf(p: Pick<Project, "name" | "source" | "company" | "role" | "evidence" | "facts">): ProjectContext {
  const evidence = p.evidence as unknown as Evidence;
  const facts = p.facts as unknown as Facts;
  return { name: p.name, source: p.source, company: p.company, role: p.role, evidence, facts, technologies: projectTechnologies(evidence, facts) };
}

/** Content is stale when the evidence or any KNOWN fact changes (adding new empty fact fields doesn't count). */
const hashOf = (p: Pick<Project, "evidence" | "facts">) => {
  const known = Object.fromEntries(Object.entries((p.facts ?? {}) as unknown as Facts).filter(([, f]) => f?.value).sort(([a], [b]) => a.localeCompare(b)));
  return createHash("sha256").update(JSON.stringify({ v: PROJECT_CONTENT_VERSION, e: p.evidence, f: known })).digest("hex").slice(0, 24);
};

async function owned(userId: string, id: string) {
  const p = await prisma.projectExperience.findFirst({ where: { id, userId } });
  if (!p) throw notFound("Project");
  return p;
}

/** Projects from the user's latest (or chosen) resume, extracted and kept in sync. */
export async function listProjects(userId: string, resumeId?: string) {
  const resume = resumeId ? await prisma.careerResume.findFirst({ where: { id: resumeId, userId } }) : await prisma.careerResume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!resume) return { resume: null, projects: [] };
  const projects = await syncProjects(userId, resume.id);
  const lastScores = await prisma.projectTest.findMany({ where: { projectId: { in: projects.map((p) => p.id) }, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { projectId: true, result: true, completedAt: true } });
  return {
    resume: { id: resume.id, label: resume.label },
    projects: projects.map((p) => {
      const ctx = contextOf(p);
      const last = lastScores.find((t) => t.projectId === p.id);
      return {
        id: p.id,
        name: p.name,
        source: p.source,
        company: p.company,
        role: p.role,
        technologies: ctx.technologies,
        claims: ctx.evidence.claims.length,
        generated: !!p.content,
        stale: !!p.content && p.contentHash !== hashOf(p),
        lastTest: last ? { completedAt: last.completedAt, overall: (last.result as { overall?: number } | null)?.overall ?? null } : null,
      };
    }),
  };
}

/**
 * Generates one part; one retry with the validator's reasons, then whatever still fails is scrubbed.
 * `combine` may fill gaps in the retry from the first draft — only with items that passed the final check.
 */
async function part<T>(task: string, build: (feedback: string[]) => { system: string; user: string }, schema: z.ZodType<T, z.ZodTypeDef, unknown>, check: (v: T, final: boolean) => Check<T>, combine?: (latest: Check<T>, first: Check<T>) => Check<T>) {
  const first = build([]);
  const raw1 = await aiJson(task, first.system, first.user, schema, 12000, AI);
  const r1 = check(raw1, false);
  if (!r1.problems.length) return r1;
  logger.info({ task, problems: r1.problems.slice(0, 6) }, "Project content rejected; retrying with reasons");
  const second = build(r1.problems.slice(0, 10));
  const raw2 = await aiJson(task, second.system, second.user, schema, 12000, AI);
  const r2 = check(raw2, false);
  if (!r2.problems.length) return r2;
  const last = check(raw2, true);
  return combine ? combine(last, check(raw1, true)) : last;
}

/** Tops each level up to 4 with first-draft questions that passed every check (no extra AI call). */
function topUpQuestions(latest: Check<QuestionsPart>, first: Check<QuestionsPart>): Check<QuestionsPart> {
  const seen = new Set(latest.value.questions.map((q) => normalize(q.question)));
  let added = 0;
  const questions = [1, 2, 3, 4, 5].flatMap((level) => {
    const mine = latest.value.questions.filter((q) => q.level === level);
    const extra = first.value.questions.filter((q) => q.level === level && !seen.has(normalize(q.question))).slice(0, Math.max(0, 4 - mine.length));
    added += extra.length;
    return [...mine, ...extra];
  });
  return { ...latest, value: { ...latest.value, questions }, fixes: added ? [...latest.fixes, `Kept ${added} checked question${added === 1 ? "" : "s"} from the first draft to complete the levels.`] : latest.fixes };
}

/** Builds a module without saving it (the benchmark harness compares models with this). */
export async function buildContent(p: Project) {
  const ctx = contextOf(p);
  const [story, tech, questions] = await Promise.all([
    part<Story>("project_story", (f) => projectPrompts.story(ctx, f), storySchema, (v, final) => checkStory(v, ctx, final)),
    part<TechPart>("project_tech", (f) => projectPrompts.tech(ctx, f), techSchema, (v, final) => checkTech(v, ctx, final)),
    part<QuestionsPart>("project_questions", (f) => projectPrompts.questions(ctx, f), questionsSchema, (v, final) => checkQuestions(v, ctx, final), topUpQuestions),
  ]);
  // Exactly 20 project-specific questions is a hard requirement: never ship fewer.
  const count = questions.value.questions.length;
  if (count !== 20) logger.warn({ project: p.id, count, levels: [1, 2, 3, 4, 5].map((l) => questions.value.questions.filter((q) => q.level === l).length), problems: questions.problems.slice(0, 6) }, "Project questions incomplete after retry; nothing saved");
  if (count !== 20) throw new AppError(502, "AI_BAD_OUTPUT", "We couldn't write 20 project-specific questions right now. Please try again in a minute.");
  const fixes = [...story.fixes, ...tech.fixes, ...questions.fixes];
  if (fixes.length) logger.info({ project: p.id, fixes }, "Project content auto-fixed");
  const content = {
    _v: PROJECT_CONTENT_VERSION,
    story: story.value,
    technologies: tech.value.technologies,
    decisionMap: decisionMap(tech.value),
    ai: aiSection(p.name, ctx.technologies),
    questions: questions.value.questions.map((q, i) => ({ key: `q${i + 1}`, ...q })),
    drillDown: questions.value.drillDown,
    claimDefense: questions.value.claimDefense.map((d) => ({ ...d, claim: ctx.evidence.claims.find((c) => c.id === d.claimId)?.claim ?? "" })),
    experienceQuestions: questions.value.experienceQuestions,
    technologiesUsed: ctx.technologies,
    // Kept for transparency: what was removed or filled in because it couldn't be backed by evidence.
    autoFixes: fixes,
  };
  return content;
}
export type ProjectContent = Awaited<ReturnType<typeof buildContent>>;

export async function generateContent(p: Project) {
  const content = await buildContent(p);
  await prisma.projectExperience.update({ where: { id: p.id }, data: { content: content as unknown as Prisma.InputJsonValue, contentHash: hashOf(p), model: process.env.AI_MODEL ?? null } });
  return content;
}

/** Decision map: category → technology → why → instead of → trade-off → would I change it. */
function decisionMap(t: TechPart) {
  const groups = new Map<string, TechPart["technologies"]>();
  for (const card of t.technologies) {
    const cat = categoryOf(card.technology) ?? "other";
    groups.set(cat, [...(groups.get(cat) ?? []), card]);
  }
  return [...groups].map(([category, cards]) => ({
    category,
    decisions: cards.map((c) => ({
      technology: c.technology,
      why: c.whyUsed.fact ?? c.whyUsed.explanation,
      whyIsFact: !!c.whyUsed.fact,
      insteadOf: c.alternative,
      tradeoff: c.tradeoff,
      change: c.recommendation,
    })),
  }));
}

export async function getProject(userId: string, id: string, opts: { generate: boolean }) {
  let p = await owned(userId, id);
  const ctx = contextOf(p);
  const stale = !p.content || p.contentHash !== hashOf(p);
  if (stale && opts.generate) {
    await generateContent(p);
    p = await owned(userId, id);
  }
  await logEvent(userId, "project_viewed", { meta: { projectId: p.id } });
  return {
    id: p.id,
    name: p.name,
    source: p.source,
    company: p.company,
    role: p.role,
    technologies: ctx.technologies,
    // Level A: exactly what the resume says.
    verified: { chunks: ctx.evidence.chunks.map((c) => ({ type: c.type, title: c.title, text: c.text })), problem: ctx.evidence.problem, architecture: ctx.evidence.architecture, features: ctx.evidence.features, contribution: ctx.evidence.contribution, claims: ctx.evidence.claims },
    // Level B: editable facts, with where each value came from.
    facts: FACT_FIELDS.map((f) => ({ ...f, value: ctx.facts[f.key]?.value ?? null, source: ctx.facts[f.key]?.source ?? null })),
    // API & integration map: deterministic, from the resume + facts (never AI-generated).
    integrations: integrationMap(ctx.technologies, ctx.facts, ctx.evidence),
    content: (p.content as ProjectContent | null) ?? null,
    stale: !!p.content && p.contentHash !== hashOf(p),
    generatedAt: p.content ? p.updatedAt : null,
  };
}

const FACT_KEYS = new Set<string>(FACT_FIELDS.map((f) => f.key));

/** Edits facts without touching the resume. Empty → back to the resume's value (or unknown). */
export async function updateFacts(userId: string, id: string, patch: Record<string, string | null>) {
  const p = await owned(userId, id);
  const unknown = Object.keys(patch).filter((k) => !FACT_KEYS.has(k));
  if (unknown.length) throw badRequest(`Unknown fact: ${unknown.join(", ")}`);
  const facts = { ...(p.facts as unknown as Facts) };
  const ev = p.evidence as unknown as Evidence;
  const fromResume = resumeFacts(p.name, ev, p.source);
  for (const [k, raw] of Object.entries(patch)) {
    const v = typeof raw === "string" ? raw.trim().slice(0, 500) : "";
    facts[k as FactKey] = v ? { value: v, source: "USER" } : fromResume[k as FactKey];
  }
  await prisma.projectExperience.update({ where: { id: p.id }, data: { facts: facts as unknown as Prisma.InputJsonValue } });
  // Which fields changed — never their values.
  await logEvent(userId, "project_fact_edited", { meta: { projectId: p.id, fields: Object.keys(patch) } });
  return getProject(userId, id, { generate: false });
}

export async function regenerate(userId: string, id: string) {
  const p = await owned(userId, id);
  await generateContent(p);
  return getProject(userId, id, { generate: false });
}

export { owned as ownedProject, hashOf };
