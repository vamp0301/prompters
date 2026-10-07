import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { aiLimiter, careerAnswerLimiter } from "../../middleware/rate-limit.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { ensureAiInterviewEnabled } from "../career/career.routes.js";
import { CATEGORY_LABEL, DEFAULT_ALLOCATION, TOTAL_QUESTIONS } from "./allocation.js";
import { createPlan, generationUsage, retryPlan } from "./generation.service.js";
import { deletePackFiles, PACK_LANGUAGES, PACK_VARIANTS, packFile, requestPack } from "./pack.service.js";
import { practice, PRACTICE_STATUSES, questionDetail, setStatus } from "./practice.service.js";
import { roleOptions, TARGET_ROLE_KEYS } from "./roles.js";

const QUESTION_LIST_FIELDS = {
  id: true, rank: true, category: true, priority: true, question: true, skill: true, probability: true, difficulty: true,
  followUpDepth: true, why: true, evidence: true, sourceType: true, sourceLabel: true, hint: true, keyPoints: true, followUps: true, status: true,
} as const;

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
    const body = parse(z.object({ resumeId: z.string(), jobId: z.string().optional(), targetRole: z.enum(TARGET_ROLE_KEYS).optional(), regenerate: z.boolean().optional() }), req.body);
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
    const counts = await prisma.prepQuestion.groupBy({ by: ["status"], where: { planId: plan.id }, _count: true });
    return { ...plan, practice: Object.fromEntries(counts.map((c) => [c.status, c._count])) };
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

  // Questions only become visible once the whole bank has passed validation and been ranked.
  r.get("/:id/questions", handler(async (req) => {
    const plan = await prisma.prepPlan.findFirst({ where: { id: param(req, "id"), userId: currentUser(req).id }, select: { id: true, status: true } });
    if (!plan) throw notFound("Preparation plan");
    if (plan.status !== "READY") return [];
    return prisma.prepQuestion.findMany({ where: { planId: plan.id }, orderBy: { rank: "asc" }, select: QUESTION_LIST_FIELDS });
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
