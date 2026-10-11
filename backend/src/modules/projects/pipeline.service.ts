import { createHash } from "node:crypto";
import type { Prisma, Project } from "@prisma/client";
import { z } from "zod";
import { checkDiagram, codeBlocks, list, toText, upTo } from "../../ai/answer.js";
import { aiJson, fence } from "../../ai/json.js";
import { prisma } from "../../lib/prisma.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { logger } from "../../lib/logger.js";
import { lenientDiagram, type Diagram } from "../career/knowledge.schemas.js";
import { AppError, badRequest, conflict, notFound } from "../../utils/errors.js";

/**
 * Build pipelines for Project Ladder projects.
 *
 * Generated per student from THIS project's brief (description, requirements, milestones, stack), so a
 * CLI tool and a full-stack app get different stages. The server then enforces what the model can't be
 * trusted with: dependencies only point backwards (no cycles, valid order), every requirement is covered
 * by some stage, and a stage is DONE only when its dependencies are done and every acceptance criterion
 * has the student's evidence. Each stage's full solution is one click away; opening it is recorded and
 * counts as assistance for the project's independence score, like a hint.
 */

const LOCALE: Record<string, string> = {
  hinglish: "Write in Hinglish (Hindi in Roman script, every technical term in English).",
  en: "Write in simple, plain English.",
  hi: "Write in simple Hindi (Devanagari), technical terms in English.",
};

export const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type StageStatus = (typeof STATUSES)[number];

export interface Stage {
  key: string;
  title: string;
  goal: string;
  dependsOn: string[];
  /** 1-based indexes into the project's requirements. */
  covers: number[];
  tasks: string[];
  acceptance: { id: string; text: string }[];
  solution: { summary: string; steps: string[]; code: { language: string; title: string; code: string; explanation: string[] }[]; diagram: Diagram | null; pitfalls: string[] };
}

type Evidence = { note: string; url?: string; at: string };
export type StageProgress = { status: StageStatus; evidence: Record<string, Evidence>; solutionViewedAt?: string };
type Progress = Record<string, StageProgress>;

const slugKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const rawStage = z.object({
  key: z.unknown().transform(toText),
  title: z.unknown().transform(toText).transform((x) => x.slice(0, 80)),
  goal: z.unknown().transform(toText).transform((x) => x.slice(0, 400)),
  dependsOn: list(40, 6),
  covers: z.unknown().transform((v) => (Array.isArray(v) ? v : []).map((x) => Number(x)).filter((n) => Number.isInteger(n))),
  tasks: list(300, 8),
  acceptance: list(240, 5),
  solution: z
    .object({
      summary: z.unknown().transform(toText).transform((x) => x.slice(0, 800)),
      steps: list(400, 10),
      code: codeBlocks(3),
      diagram: lenientDiagram.nullable().catch(null).default(null),
      pitfalls: list(300, 5),
    })
    .catch({ summary: "", steps: [], code: [], diagram: null, pitfalls: [] }),
});
const pipelineSchema = z.object({ stages: upTo(rawStage, 10) });

const requirementsOf = (p: Project) => ((p.requirements as unknown as string[] | null) ?? []).map((r) => String(r));
const milestonesOf = (p: Project) => ((p.milestones as unknown as { title: string; description?: string }[] | null) ?? []);

/** Changes whenever the brief the pipeline was generated from changes. */
export const briefHash = (p: Project) => createHash("sha256").update(JSON.stringify([p.title, p.description, requirementsOf(p), milestonesOf(p), p.technologies, p.skills, p.difficulty])).digest("hex").slice(0, 16);

/** "Node.js + Express or FastAPI", "Vercel / Netlify" → the individual tools a plan could name. */
export const techTokens = (technologies: string[]) =>
  [...new Set(technologies.flatMap((t) => t.toLowerCase().split(/\s+or\s+|[+,/]|\s+and\s+/)).map((t) => t.trim()).filter((t) => t.length >= 2 && t !== "public api"))];

/**
 * Server-side checks: unique keys, dependencies only on earlier stages, requirement coverage,
 * tasks and acceptance criteria present, diagrams that teach something. Returns the problems the
 * model should fix (empty when the pipeline is usable).
 */
export function normalizeStages(raw: z.infer<typeof pipelineSchema>, p: Project): { stages: Stage[]; problems: string[] } {
  const reqs = requirementsOf(p);
  const problems: string[] = [];
  const stages: Stage[] = [];
  const seen = new Set<string>();
  for (const r of raw.stages) {
    let key = slugKey(r.key || r.title);
    if (!key || !r.title || !r.tasks.length || !r.acceptance.length) continue;
    while (seen.has(key)) key = `${key}-2`;
    const earlier = new Set(seen);
    seen.add(key);
    const { diagram } = checkDiagram(r.solution.diagram ?? null);
    stages.push({
      key,
      title: r.title,
      goal: r.goal,
      // Only backward references survive: the order is a valid build order and there can be no cycle.
      dependsOn: [...new Set(r.dependsOn.map(slugKey).filter((d) => earlier.has(d)))],
      covers: [...new Set(r.covers.filter((n) => n >= 1 && n <= reqs.length))],
      tasks: r.tasks,
      acceptance: r.acceptance.map((text, i) => ({ id: `${key}-${i + 1}`, text })),
      solution: { ...r.solution, diagram },
    });
  }
  if (stages.length < 3) problems.push(`only ${stages.length} usable stages (each needs a key, title, tasks and acceptance criteria; at least 3 stages)`);
  const covered = new Set(stages.flatMap((s) => s.covers));
  const missing = reqs.map((_, i) => i + 1).filter((n) => !covered.has(n));
  if (missing.length) problems.push(`requirements not covered by any stage's "covers": ${missing.join(", ")}`);
  // Tailoring: the stages must use this project's stack, not a generic template.
  const techs = techTokens(p.technologies);
  if (techs.length) {
    const text = JSON.stringify(stages.map((s) => [s.title, s.tasks, s.solution.steps, s.solution.code.map((c) => c.code)])).toLowerCase();
    const used = techs.filter((t) => text.includes(t));
    if (!used.length) problems.push(`no stage uses the project's technologies (${p.technologies.join(", ")})`);
  }
  return { stages, problems };
}

function prompt(p: Project, locale: string, level: string) {
  const reqs = requirementsOf(p);
  const system = [
    "You are a senior engineer planning how a student will build ONE specific project, stage by stage.",
    LOCALE[locale] ?? LOCALE.hinglish,
    `Student level: ${level}.`,
    "Design the stages for THIS project only — choose how many (3 to 10) and what they are from its requirements, milestones and stack. A CLI tool, a REST API and a full-stack app need different stages. Never pad with generic stages that don't apply.",
    "Typical concerns to consider (use only those that apply): problem & MVP, setup, data model, core logic, API/interface, UI, auth/security, testing, deployment, polish & explanation.",
    "Each stage: `key` (short kebab-case, unique), `title`, `goal` (one sentence), `dependsOn` (keys of EARLIER stages it needs), `covers` (1-based numbers of the requirements it satisfies — every requirement must be covered by some stage), `tasks` (concrete, ordered, using the project's technologies), `acceptance` (1–5 checkable criteria a student can show evidence for, e.g. 'GET /todos returns 200 with a JSON array').",
    "Each stage also has the full `solution`, solution-first: `summary`, `steps`, `code` (complete, runnable code for that stage in the project's stack — no placeholders), `diagram` (one teaching diagram or null), `pitfalls`.",
    'Diagram shapes: {"kind":"flow","title","objective","steps":[{"label","note"}]} | {"kind":"timeline","title","objective","actors":[..],"events":[{"from","to","label"}]} | {"kind":"architecture","title","objective","layers":[{"label","nodes":[{"label","note"}]}]} | {"kind":"state","title","objective","states":[..],"transitions":[{"from","to","label"}]}.',
    'Return {"stages":[...]} in build order.',
  ].join("\n");
  const user = [
    `Project: ${p.title} (difficulty ${p.difficulty}/5)`,
    fence("brief", p.description),
    fence("requirements", reqs.map((r, i) => `${i + 1}. ${r}`).join("\n") || "(none listed)"),
    fence("milestones", milestonesOf(p).map((m, i) => `${i + 1}. ${m.title}${m.description ? ` — ${m.description}` : ""}`).join("\n") || "(none listed)"),
    `Technologies: ${p.technologies.join(", ") || "(student's choice)"}`,
    `Skills practised: ${p.skills.join(", ") || "-"}`,
  ].join("\n\n");
  return { system, user };
}

const CALL_TIMEOUT_MS = 150_000;
const RETRY_BUDGET_MS = 120_000;

export async function generateStages(p: Project, locale: string, level: string) {
  const { system, user } = prompt(p, locale, level);
  // Runs on the worker; still bounded, and a slow first draft skips the corrective round.
  const started = Date.now();
  let raw = await aiJson("project_pipeline", system, user, pipelineSchema, 12000, { timeoutMs: CALL_TIMEOUT_MS });
  const first = normalizeStages(raw, p);
  let stages = first.stages;
  if (first.problems.length && Date.now() - started < RETRY_BUDGET_MS) {
    // One corrective round with the exact problems; uncovered requirements are handled below either way.
    raw = await aiJson("project_pipeline", system, `${user}\n\nYour previous plan had problems: ${first.problems.join("; ")}. Return the corrected full plan.`, pipelineSchema, 12000, { timeoutMs: CALL_TIMEOUT_MS });
    const retry = normalizeStages(raw, p);
    if (retry.stages.length >= stages.length || retry.problems.length < first.problems.length) stages = retry.stages;
  }
  if (stages.length < 3) throw new AppError(502, "AI_BAD_OUTPUT", "Couldn't build a usable plan for this project. Please try again.");
  // Requirements the model still left uncovered become explicit criteria on the last stage — never silently dropped.
  const reqs = requirementsOf(p);
  const covered = new Set(stages.flatMap((s) => s.covers));
  const last = stages[stages.length - 1];
  for (const n of reqs.map((_, i) => i + 1).filter((n) => !covered.has(n))) {
    last.covers.push(n);
    last.acceptance.push({ id: `${last.key}-req${n}`, text: `Requirement ${n}: ${reqs[n - 1]}` });
  }
  return stages;
}

const stagesOf = (v: Prisma.JsonValue) => v as unknown as Stage[];
const progressOf = (v: Prisma.JsonValue) => (v ?? {}) as unknown as Progress;
const statusOf = (pr: Progress, key: string): StageStatus => pr[key]?.status ?? "TODO";

/** The stage to resume at: the first one not done whose dependencies are all done. */
export function currentStage(stages: Stage[], pr: Progress) {
  return stages.find((s) => statusOf(pr, s.key) !== "DONE" && s.dependsOn.every((d) => statusOf(pr, d) === "DONE"))?.key ?? null;
}

/** What the student sees: plans always; a stage's solution only after they chose to open it. */
export function view(row: { status: string; error: string | null; stages: Prisma.JsonValue; progress: Prisma.JsonValue; sourceHash: string; updatedAt: Date }, p: Project) {
  const stages = stagesOf(row.stages);
  const pr = progressOf(row.progress);
  return {
    status: row.status as "QUEUED" | "RUNNING" | "READY" | "FAILED",
    error: row.error,
    current: currentStage(stages, pr),
    stale: stages.length > 0 && row.sourceHash !== briefHash(p),
    done: stages.filter((s) => statusOf(pr, s.key) === "DONE").length,
    total: stages.length,
    requirements: requirementsOf(p),
    updatedAt: row.updatedAt,
    stages: stages.map(({ solution, ...s }) => {
      const sp = pr[s.key];
      return {
        ...s,
        status: statusOf(pr, s.key),
        blockedBy: s.dependsOn.filter((d) => statusOf(pr, d) !== "DONE"),
        evidence: sp?.evidence ?? {},
        solutionViewed: !!sp?.solutionViewedAt,
        solution: sp?.solutionViewedAt ? solution : null,
      };
    }),
  };
}

export async function getPipeline(userId: string, p: Project) {
  const row = await prisma.projectPipeline.findUnique({ where: { userId_projectId: { userId, projectId: p.id } } });
  return row ? view(row, p) : null;
}

/**
 * Queues generation (or regeneration) on the background worker and returns at once; the page polls.
 * An existing READY pipeline is returned unchanged unless regenerate is set; one already queued or
 * running is never queued twice. Stages and progress stay visible while a regeneration runs.
 */
export async function createPipeline(userId: string, p: Project, opts: { regenerate: boolean }) {
  const where = { userId_projectId: { userId, projectId: p.id } };
  const existing = await prisma.projectPipeline.findUnique({ where });
  if (existing && (existing.status === "QUEUED" || existing.status === "RUNNING")) return view(existing, p);
  if (existing?.status === "READY" && !opts.regenerate) return view(existing, p);
  const row = existing
    ? await prisma.projectPipeline.update({ where: { id: existing.id }, data: { status: "QUEUED", error: null } })
    : await prisma.projectPipeline.create({ data: { userId, projectId: p.id } }).catch(async () => prisma.projectPipeline.findUniqueOrThrow({ where })); // a concurrent create won
  if (row.status === "QUEUED") await enqueuePrep({ kind: "pipeline", pipelineId: row.id });
  return view(row, p);
}

/** Worker: claims the row, generates from the project's current brief, keeps progress on surviving stages. */
export async function runPipeline(pipelineId: string) {
  const { count } = await prisma.projectPipeline.updateMany({ where: { id: pipelineId, status: "QUEUED" }, data: { status: "RUNNING" } });
  if (!count) return; // a duplicate or stale job
  const row = await prisma.projectPipeline.findUniqueOrThrow({ where: { id: pipelineId }, include: { project: true, user: { select: { profile: { select: { explanationLocale: true, codingLevel: true } } } } } });
  try {
    const stages = await generateStages(row.project, row.user.profile?.explanationLocale ?? "hinglish", row.user.profile?.codingLevel ?? "BEGINNER");
    const keys = new Set(stages.map((s) => s.key));
    const progress = Object.fromEntries(Object.entries(progressOf(row.progress)).filter(([k]) => keys.has(k)));
    await prisma.projectPipeline.update({
      where: { id: row.id },
      data: { status: "READY", error: null, stages: stages as unknown as Prisma.InputJsonValue, progress: progress as Prisma.InputJsonValue, sourceHash: briefHash(row.project), model: process.env.AI_MODEL ?? process.env.AI_PROVIDER ?? null },
    });
  } catch (e) {
    logger.error({ err: e, pipelineId }, "Project pipeline failed");
    await prisma.projectPipeline.update({ where: { id: row.id }, data: { status: "FAILED", error: e instanceof AppError ? e.message : "Couldn't build the plan. Please try again." } });
  }
}

async function owned(userId: string, p: Project) {
  const row = await prisma.projectPipeline.findUnique({ where: { userId_projectId: { userId, projectId: p.id } } });
  if (!row) throw notFound("Pipeline");
  if (!stagesOf(row.stages).length) throw conflict("The plan is still being built.");
  return row;
}

const MIN_EVIDENCE = 15;

/**
 * Moves a stage. DONE needs every dependency DONE and evidence (≥15 characters, optional https link)
 * for every acceptance criterion; reopening is refused while a later stage that depends on it is DONE.
 */
export async function updateStage(userId: string, p: Project, key: string, input: { status: StageStatus; evidence?: Record<string, { note: string; url?: string }> }) {
  const row = await owned(userId, p);
  const stages = stagesOf(row.stages);
  const stage = stages.find((s) => s.key === key);
  if (!stage) throw notFound("Stage");
  const pr = progressOf(row.progress);
  const now = new Date().toISOString();
  const evidence: Record<string, Evidence> = { ...(pr[key]?.evidence ?? {}) };
  for (const [id, e] of Object.entries(input.evidence ?? {})) {
    if (!stage.acceptance.some((a) => a.id === id)) throw badRequest(`Unknown acceptance criterion: ${id}`);
    const note = e.note.trim();
    if (!note) delete evidence[id];
    else evidence[id] = { note, ...(e.url ? { url: e.url } : {}), at: now };
  }
  if (input.status === "DONE") {
    const blocked = stage.dependsOn.filter((d) => statusOf(pr, d) !== "DONE");
    if (blocked.length) throw conflict(`Finish ${blocked.map((b) => `"${stages.find((s) => s.key === b)?.title ?? b}"`).join(", ")} first.`);
    const missing = stage.acceptance.filter((a) => (evidence[a.id]?.note.length ?? 0) < MIN_EVIDENCE);
    if (missing.length) throw new AppError(422, "EVIDENCE_REQUIRED", `Add evidence (at least ${MIN_EVIDENCE} characters) for: ${missing.map((m) => m.text).join(" · ")}`);
  } else if (statusOf(pr, key) === "DONE") {
    const dependents = stages.filter((s) => s.dependsOn.includes(key) && statusOf(pr, s.key) === "DONE");
    if (dependents.length) throw conflict(`Reopen ${dependents.map((d) => `"${d.title}"`).join(", ")} first — it builds on this stage.`);
  }
  pr[key] = { ...pr[key], status: input.status, evidence };
  const updated = await prisma.projectPipeline.update({ where: { id: row.id }, data: { progress: pr as unknown as Prisma.InputJsonValue } });
  return view(updated, p);
}

/** Opens a stage's full solution. Recorded once per stage; returns whether this was the first time. */
export async function revealSolution(userId: string, p: Project, key: string) {
  const row = await owned(userId, p);
  const stage = stagesOf(row.stages).find((s) => s.key === key);
  if (!stage) throw notFound("Stage");
  const pr = progressOf(row.progress);
  const first = !pr[key]?.solutionViewedAt;
  if (first) {
    pr[key] = { status: statusOf(pr, key), evidence: pr[key]?.evidence ?? {}, solutionViewedAt: new Date().toISOString() };
    await prisma.projectPipeline.update({ where: { id: row.id }, data: { progress: pr as unknown as Prisma.InputJsonValue } });
  }
  return { first, solution: stage.solution };
}

/** Stage solutions opened for a project (counts toward assistance, like hints). */
export async function solutionsViewed(userId: string, projectId: string) {
  const row = await prisma.projectPipeline.findUnique({ where: { userId_projectId: { userId, projectId } }, select: { progress: true } });
  return row ? Object.values(progressOf(row.progress)).filter((s) => s.solutionViewedAt).length : 0;
}
