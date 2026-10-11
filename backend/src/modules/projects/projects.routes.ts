import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { badRequest, conflict, locked, notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";
import { getScoring, independenceFromHints } from "../platform/scoring.js";
import { keywordScore } from "../platform/text.js";
import { aiLimiter } from "../../middleware/rate-limit.js";
import { isEnabled } from "../platform/flags.js";
import { aiProvider } from "../../ai/provider.js";
import { activeTimedAttempt } from "../quiz/quiz.service.js";
import { AppError } from "../../utils/errors.js";
import { createPipeline, getPipeline, revealSolution, solutionsViewed, STATUSES, updateStage } from "./pipeline.service.js";

type ExplainQuestion = { question: string; keywords: string[] };

async function projectHintsUsed(userId: string, slug: string) {
  return prisma.learningEvent.count({ where: { userId, type: "hint_used", meta: { path: ["project"], equals: slug } } });
}

/** Assistance for the independence score: revealed hints plus pipeline stage solutions opened. */
async function assistanceUsed(userId: string, p: { id: string; slug: string }) {
  const [hints, solutions] = await Promise.all([projectHintsUsed(userId, p.slug), solutionsViewed(userId, p.id)]);
  return hints + solutions;
}

async function ladder(userId: string) {
  const [projects, subs] = await Promise.all([
    prisma.project.findMany({ where: { status: { in: ["PUBLISHED", "COMING_SOON"] } }, orderBy: { rung: "asc" } }),
    prisma.projectSubmission.findMany({ where: { userId } }),
  ]);
  let previousDone = true;
  return projects.map((p) => {
    const sub = subs.find((s) => s.projectId === p.id) ?? null;
    const comingSoon = p.status === "COMING_SOON";
    const unlocked = !comingSoon && previousDone;
    previousDone = sub?.status === "COMPLETED";
    return { project: p, sub, unlocked, comingSoon };
  });
}

const submitSchema = z.object({
  repoUrl: z.string().url().regex(/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//, "Use a GitHub, GitLab or Bitbucket URL."),
  liveUrl: z.string().url().optional().or(z.literal("")),
  howIBuiltIt: z.object({
    approach: z.string().trim().min(30, "Describe your approach in a few sentences.").max(3000),
    bugFixed: z.string().trim().min(20, "Describe one bug you fixed.").max(3000),
    tradeoff: z.string().trim().min(20, "Describe one trade-off you made.").max(3000),
  }),
  milestonesDone: z.number().int().min(0).max(50),
  explainAnswers: z.array(z.string().trim().min(1).max(3000)).max(10),
});

export function projectRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const rows = await ladder(currentUser(req).id);
    return rows.map(({ project: p, sub, unlocked, comingSoon }) => ({
      slug: p.slug,
      rung: p.rung,
      title: p.title,
      description: p.description,
      skills: p.skills,
      technologies: p.technologies,
      difficulty: p.difficulty,
      unlocked,
      comingSoon,
      status: sub?.status ?? "NOT_STARTED",
      independenceScore: sub?.independenceScore ?? null,
      explainScore: sub?.explainScore ?? null,
    }));
  }));

  r.get("/:slug", handler(async (req) => {
    const me = currentUser(req);
    const row = (await ladder(me.id)).find((x) => x.project.slug === param(req, "slug"));
    if (!row) throw notFound("Project");
    const { project: p, sub, unlocked } = row;
    const hints = p.hints as string[];
    const [used, assisted] = await Promise.all([projectHintsUsed(me.id, p.slug), assistanceUsed(me.id, p)]);
    const cfg = await getScoring();
    return {
      ...p,
      hints: { total: hints.length, revealed: hints.slice(0, used) },
      hintPenalties: cfg.hintPenalties,
      independenceScore: independenceFromHints(assisted, cfg),
      explainQuestions: (p.explainQuestions as unknown as ExplainQuestion[]).map((q) => q.question),
      unlocked,
      submission: sub,
    };
  }));

  r.post("/:slug/hint", handler(async (req) => {
    const me = currentUser(req);
    const row = (await ladder(me.id)).find((x) => x.project.slug === param(req, "slug"));
    if (!row) throw notFound("Project");
    if (!row.unlocked) throw locked("Complete the previous project first.");
    const hints = row.project.hints as string[];
    const used = await projectHintsUsed(me.id, row.project.slug);
    if (used >= hints.length) throw conflict("All hints are already revealed.");
    await logEvent(me.id, "hint_used", { meta: { project: row.project.slug, level: used + 1 } });
    return { level: used + 1, revealed: hints.slice(0, used + 1), independenceScore: independenceFromHints(await assistanceUsed(me.id, row.project), await getScoring()) };
  }));

  r.post("/:slug/submit", handler(async (req) => {
    const me = currentUser(req);
    const body = parse(submitSchema, req.body);
    const row = (await ladder(me.id)).find((x) => x.project.slug === param(req, "slug"));
    if (!row) throw notFound("Project");
    if (!row.unlocked) throw locked("Complete the previous project first.");
    const p = row.project;
    const questions = p.explainQuestions as unknown as ExplainQuestion[];
    if (body.explainAnswers.length !== questions.length) throw badRequest(`Answer all ${questions.length} explain-your-code questions.`);

    const cfg = await getScoring();
    const feedback = questions.map((q, i) => ({ question: q.question, ...keywordScore(body.explainAnswers[i], q.keywords) }));
    const explainScore = Math.round(feedback.reduce((a, f) => a + f.score, 0) / Math.max(1, feedback.length));
    const independenceScore = independenceFromHints(await assistanceUsed(me.id, p), cfg);
    const milestones = (p.milestones as unknown[]).length;
    const complete = explainScore >= cfg.minExplainScore && body.milestonesDone >= milestones;

    const data = {
      repoUrl: body.repoUrl,
      liveUrl: body.liveUrl || null,
      howIBuiltIt: body.howIBuiltIt as Prisma.InputJsonValue,
      explainAnswers: questions.map((q, i) => ({ question: q.question, answer: body.explainAnswers[i], score: feedback[i].score })) as Prisma.InputJsonValue,
      explainScore,
      milestonesDone: body.milestonesDone,
      independenceScore,
      status: complete ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
    };
    const sub = await prisma.projectSubmission.upsert({
      where: { userId_projectId: { userId: me.id, projectId: p.id } },
      create: { userId: me.id, projectId: p.id, ...data },
      update: data,
    });
    await logEvent(me.id, "project_submitted", { meta: { project: p.slug, explainScore, independenceScore, complete } });
    return {
      submission: sub,
      complete,
      feedback: feedback.map((f) => ({ question: f.question, score: f.score, missing: f.missing })),
      reason: complete ? null : body.milestonesDone < milestones ? "Finish every milestone first." : `Explain-your-code score must be at least ${cfg.minExplainScore}.`,
    };
  }));

  // ───────────── build pipeline ─────────────

  /** The project row, unlocked, with AI available to this student and no timed test running. */
  async function pipelineProject(userId: string, slug: string) {
    const row = (await ladder(userId)).find((x) => x.project.slug === slug);
    if (!row) throw notFound("Project");
    if (!row.unlocked) throw locked("Complete the previous project first.");
    return row.project;
  }
  async function requireAiHelp(userId: string) {
    if (!aiProvider()) throw new AppError(503, "AI_UNAVAILABLE", "AI help isn't configured on this server yet.");
    if (!(await isEnabled("AI_TUTOR", userId))) throw new AppError(403, "FEATURE_DISABLED", "AI help is not enabled for your account.");
    if (await activeTimedAttempt(userId)) throw locked("AI help is switched off while you have a test in progress.");
  }

  r.get("/:slug/pipeline", handler(async (req) => {
    const me = currentUser(req);
    return { pipeline: await getPipeline(me.id, await pipelineProject(me.id, param(req, "slug"))) };
  }));

  r.post("/:slug/pipeline", aiLimiter(), handler(async (req) => {
    const me = currentUser(req);
    const { regenerate } = parse(z.object({ regenerate: z.boolean().default(false) }), req.body ?? {});
    const p = await pipelineProject(me.id, param(req, "slug"));
    await requireAiHelp(me.id);
    const pipeline = await createPipeline(me.id, p, { regenerate });
    await logEvent(me.id, "pipeline_generated", { meta: { project: p.slug, regenerate, status: pipeline.status } });
    return { pipeline };
  }));

  const evidenceSchema = z.record(z.string().max(80), z.object({ note: z.string().max(2000), url: z.string().url().regex(/^https:\/\//, "Links must use https://").max(500).optional().or(z.literal("").transform(() => undefined)) })).optional();

  r.patch("/:slug/pipeline/stages/:key", handler(async (req) => {
    const me = currentUser(req);
    const body = parse(z.object({ status: z.enum(STATUSES), evidence: evidenceSchema }), req.body);
    const p = await pipelineProject(me.id, param(req, "slug"));
    const pipeline = await updateStage(me.id, p, param(req, "key"), body);
    if (body.status === "DONE") await logEvent(me.id, "pipeline_stage_done", { meta: { project: p.slug, stage: param(req, "key") } });
    return { pipeline };
  }));

  r.post("/:slug/pipeline/stages/:key/solution", handler(async (req) => {
    const me = currentUser(req);
    const p = await pipelineProject(me.id, param(req, "slug"));
    await requireAiHelp(me.id);
    const { first, solution } = await revealSolution(me.id, p, param(req, "key"));
    if (first) await logEvent(me.id, "pipeline_solution_viewed", { meta: { project: p.slug, stage: param(req, "key") } });
    return { solution, independenceScore: independenceFromHints(await assistanceUsed(me.id, p), await getScoring()) };
  }));

  return r;
}
