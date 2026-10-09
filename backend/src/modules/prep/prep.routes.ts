import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { aiLimiter, careerAnswerLimiter } from "../../middleware/rate-limit.js";
import { workerAlive } from "../../lib/heartbeat.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { ensureAiInterviewEnabled } from "../career/career.routes.js";
import { CATEGORY_LABEL, DEFAULT_ALLOCATION, PREP_CATEGORIES, TOTAL_QUESTIONS } from "./allocation.js";
import { createPlan, generationUsage, retryPlan } from "./generation.service.js";
import { deletePackFiles, PACK_LANGUAGES, PACK_VARIANTS, packFile, requestPack } from "./pack.service.js";
import { practice, PRACTICE_STATUSES, questionDetail, setStatus } from "./practice.service.js";
import { isTargetRole, roleOptions } from "./roles.js";
import { personalScores } from "../personalization/top100.js";

const QUESTION_LIST_FIELDS = {
  id: true, rank: true, category: true, priority: true, question: true, skill: true, probability: true, difficulty: true,
  followUpDepth: true, why: true, evidence: true, sourceType: true, sourceLabel: true, hint: true, keyPoints: true, followUps: true, status: true, stage: true,
} as const;

/** The paged list carries only what a question card shows; hints, key points and follow-ups load with the question. */
const PAGE_FIELDS = {
  id: true, rank: true, stage: true, category: true, priority: true, question: true, skill: true, probability: true, difficulty: true,
  followUpDepth: true, why: true, sourceType: true, sourceLabel: true, status: true,
} as const;

const PRIORITIES = ["INTENSE", "IMPORTANT", "GOOD", "MAY_BE_ASKED"] as const;
const csv = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []))
    .pipe(z.array(z.enum(values)));

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  size: z.coerce.number().int().min(5).max(50).default(20),
  stage: z.coerce.number().int().min(1).max(3).optional(),
  /** One difficulty step, 1 (easy) … 5 (expert): the step-by-step view pages within a step. */
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  priority: csv(PRIORITIES),
  category: csv(PREP_CATEGORIES),
  skill: z.string().trim().max(80).optional(),
  status: z.enum(PRACTICE_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  /** ladder = the plan's order (easier first); likely = most likely to be asked first; personal = re-ranked for this student. */
  sort: z.enum(["ladder", "likely", "personal"]).default("ladder"),
});

/** Counts by value, in first-seen order. */
const countBy = <T,>(rows: T[], key: (r: T) => string | number) => {
  const out: Record<string, number> = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return out;
};

/** Personalised Top-100 preparation: plans, questions, practice and downloadable packs. */
export function prepRoutes() {
  const r = Router();
  const ai = aiLimiter();

  r.get("/meta", handler(async () => ({ roles: roleOptions(), total: TOTAL_QUESTIONS, defaultAllocation: DEFAULT_ALLOCATION, categories: CATEGORY_LABEL, variants: PACK_VARIANTS, languages: PACK_LANGUAGES })));

  r.get("/usage", handler(async (req) => generationUsage(currentUser(req).id)));

  r.get("/", handler(async (req) =>
    prisma.prepPlan.findMany({
      where: { userId: currentUser(req).id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, targetRole: true, createdAt: true, completedAt: true, resume: { select: { label: true } }, job: { select: { title: true, company: true } }, _count: { select: { questions: true } } },
    })));

  r.post("/", ai, handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const body = parse(z.object({ resumeId: z.string(), jobId: z.string().optional(), targetRole: z.string().max(60).refine(isTargetRole, "Unknown target role.").optional(), regenerate: z.boolean().optional() }), req.body);
    const { plan, reused } = await createPlan(me.id, body);
    // 200 = an existing plan for this resume + target was reused; 201 = a new generation started.
    res.status(reused ? 200 : 201);
    return { ...plan, reused };
  }));

  r.get("/:id", handler(async (req) => {
    const plan = await prisma.prepPlan.findFirst({
      where: { id: param(req, "id"), userId: currentUser(req).id },
      include: { resume: { select: { id: true, label: true } }, job: { select: { id: true, title: true, company: true } }, packs: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, variant: true, language: true, status: true, error: true, createdAt: true } } },
    });
    if (!plan) throw notFound("Preparation plan");
    // Only published questions count: candidates still being checked are invisible.
    const counts = await prisma.prepQuestion.groupBy({ by: ["status"], where: { planId: plan.id, rank: { gt: 0 } }, _count: true });
    // While generating, say whether a background worker is alive: without one a QUEUED plan never starts.
    const pending = plan.status === "QUEUED" || plan.status === "RUNNING";
    const workerUp = pending ? await workerAlive().catch(() => true) : true;
    return { ...plan, published: counts.reduce((a, c) => a + c._count, 0), practice: Object.fromEntries(counts.map((c) => [c.status, c._count])), workerAlive: workerUp };
  }));

  r.post("/:id/retry", ai, handler(async (req) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    return retryPlan(me.id, param(req, "id"));
  }));

  r.delete("/:id", handler(async (req) => {
    const plan = await prisma.prepPlan.findFirst({ where: { id: param(req, "id"), userId: currentUser(req).id } });
    if (!plan) throw notFound("Preparation plan");
    await deletePackFiles([plan.id]);
    await prisma.prepPlan.delete({ where: { id: plan.id } });
    return { deleted: true };
  }));

  // A question becomes visible once its whole stage has passed validation and been published:
  // Basics are available while Core and Advanced are still being written.
  r.get("/:id/questions", handler(async (req) => {
    const plan = await prisma.prepPlan.findFirst({ where: { id: param(req, "id"), userId: currentUser(req).id }, select: { id: true } });
    if (!plan) throw notFound("Preparation plan");
    return prisma.prepQuestion.findMany({ where: { planId: plan.id, rank: { gt: 0 } }, orderBy: { rank: "asc" }, select: QUESTION_LIST_FIELDS });
  }));

  // One page of published questions, filtered and sorted by the database, plus counts for the filters.
  r.get("/:id/questions/page", handler(async (req) => {
    const plan = await prisma.prepPlan.findFirst({ where: { id: param(req, "id"), userId: currentUser(req).id }, select: { id: true, status: true } });
    if (!plan) throw notFound("Preparation plan");
    const f = parse(pageQuery, req.query);
    const where: Prisma.PrepQuestionWhereInput = {
      planId: plan.id,
      rank: { gt: 0 },
      ...(f.stage ? { stage: f.stage } : {}),
      ...(f.difficulty ? { difficulty: f.difficulty } : {}),
      ...(f.priority.length ? { priority: { in: f.priority } } : {}),
      ...(f.category.length ? { category: { in: f.category } } : {}),
      ...(f.skill ? { skill: f.skill } : {}),
      ...(f.status ? { status: f.status } : {}),
      ...(f.q ? { OR: (["question", "skill", "sourceLabel"] as const).map((k) => ({ [k]: { contains: f.q, mode: "insensitive" as const } })) } : {}),
    };
    const personal = f.sort === "personal";
    const [rows, total, all] = await Promise.all([
      // Personal order needs the whole (≤100) filtered list to rank; the others page in the database.
      // Within a difficulty step: most likely first (the ladder order is already easy → hard across steps).
      prisma.prepQuestion.findMany({ where, orderBy: f.sort === "likely" || f.difficulty ? [{ probability: "desc" }, { rank: "asc" }] : { rank: "asc" }, ...(personal ? {} : { skip: (f.page - 1) * f.size, take: f.size }), select: PAGE_FIELDS }),
      prisma.prepQuestion.count({ where }),
      prisma.prepQuestion.findMany({ where: { planId: plan.id, rank: { gt: 0 } }, select: { stage: true, priority: true, category: true, status: true, skill: true, difficulty: true } }),
    ]);
    let items: (typeof rows[number] & { personal?: { score: number; reasons: string[] } })[] = rows;
    if (personal) {
      const scores = await personalScores(currentUser(req).id, rows);
      items = rows
        .map((q) => ({ ...q, personal: scores.get(q.id) }))
        .sort((a, b) => (b.personal?.score ?? 0) - (a.personal?.score ?? 0) || a.rank - b.rank)
        .slice((f.page - 1) * f.size, f.page * f.size);
    }
    const skills = countBy(all, (q) => q.skill);
    return {
      items,
      total,
      page: f.page,
      size: f.size,
      pages: Math.max(1, Math.ceil(total / f.size)),
      published: all.length,
      generating: plan.status === "QUEUED" || plan.status === "RUNNING",
      facets: {
        stages: countBy(all, (q) => q.stage),
        /** Per difficulty step (1 easy … 5 expert): how many questions, and how many the student is confident on. */
        difficulties: [1, 2, 3, 4, 5].map((d) => ({ difficulty: d, total: all.filter((q) => q.difficulty === d).length, confident: all.filter((q) => q.difficulty === d && q.status === "CONFIDENT").length })),
        priorities: countBy(all, (q) => q.priority),
        categories: countBy(all, (q) => q.category),
        statuses: countBy(all, (q) => q.status),
        skills: Object.entries(skills).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([skill, count]) => ({ skill, count })),
      },
    };
  }));

  r.get("/:id/questions/:qid", handler(async (req) => questionDetail(currentUser(req).id, param(req, "id"), param(req, "qid"))));

  r.post("/:id/questions/:qid/attempts", careerAnswerLimiter(), handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const { answer } = parse(z.object({ answer: z.string().max(6000) }), req.body);
    res.status(201);
    return practice(me.id, param(req, "id"), param(req, "qid"), answer);
  }));

  r.patch("/:id/questions/:qid", handler(async (req) => {
    const { status } = parse(z.object({ status: z.enum(PRACTICE_STATUSES) }), req.body);
    return setStatus(currentUser(req).id, param(req, "id"), param(req, "qid"), status);
  }));

  // ───── Downloadable interview pack ─────
  r.post("/:id/packs", ai, handler(async (req, res) => {
    const me = currentUser(req);
    const body = parse(z.object({ variant: z.enum(PACK_VARIANTS), language: z.enum(PACK_LANGUAGES).default("en") }), req.body);
    if (body.language !== "en") await ensureAiInterviewEnabled(me.id);
    res.status(201);
    return requestPack(me.id, param(req, "id"), body.variant, body.language);
  }));

  r.get("/:id/packs/:packId", handler(async (req) => {
    const pack = await prisma.prepPack.findFirst({
      where: { id: param(req, "packId"), planId: param(req, "id"), userId: currentUser(req).id },
      select: { id: true, variant: true, language: true, status: true, error: true, createdAt: true, completedAt: true },
    });
    if (!pack) throw notFound("Interview pack");
    return pack;
  }));

  r.get("/:id/packs/:packId/download", async (req, res, next) => {
    try {
      const file = await packFile(currentUser(req).id, param(req, "id"), param(req, "packId"));
      res.setHeader("content-type", "application/pdf");
      res.setHeader("content-disposition", `attachment; filename="${file.fileName}"`);
      res.setHeader("cache-control", "private, no-store");
      res.send(file.body);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
