import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { handler, param, parse } from "../../utils/http.js";
import * as quiz from "./quiz.service.js";

const answerValue = z.union([z.number().int().min(0).max(50), z.array(z.number().int().min(0).max(50)).max(50), z.string().max(4000), z.null()]);
const answersSchema = z.object({ answers: z.record(answerValue).default({}) });
const integritySchema = z.object({
  events: z.array(z.object({ type: z.enum(quiz.INTEGRITY_EVENTS), meta: z.record(z.unknown()).optional() })).min(1).max(50),
});

export function quizRoutes() {
  const r = Router();

  r.post("/topics/:slug/quiz", handler(async (req) => quiz.startTopicQuiz(currentUser(req).id, param(req, "slug"), "MASTERY")));
  r.post("/topics/:slug/review", handler(async (req) => quiz.startTopicQuiz(currentUser(req).id, param(req, "slug"), "REVIEW")));
  r.post("/practice", handler(async (req) => quiz.startPractice(currentUser(req).id)));
  r.post("/placement", handler(async (req) => quiz.startPlacement(currentUser(req).id)));
  r.post("/assessments/:slug/start", handler(async (req) => quiz.startAssessment(currentUser(req).id, param(req, "slug"))));

  r.get("/attempts/:id", handler(async (req) => quiz.getAttempt(currentUser(req).id, param(req, "id"))));
  r.put("/attempts/:id/draft", handler(async (req) => quiz.saveDraft(currentUser(req).id, param(req, "id"), parse(answersSchema, req.body).answers)));
  r.post("/attempts/:id/integrity", handler(async (req) => quiz.logIntegrity(currentUser(req).id, param(req, "id"), parse(integritySchema, req.body).events)));
  r.post("/attempts/:id/submit", handler(async (req) => quiz.submit(currentUser(req).id, param(req, "id"), parse(answersSchema, req.body).answers)));

  r.get("/attempts", handler(async (req) => {
    const me = currentUser(req);
    return prisma.quizAttempt.findMany({
      where: { userId: me.id, status: { not: "IN_PROGRESS" } },
      orderBy: { startedAt: "desc" },
      take: 50,
      select: { id: true, kind: true, score: true, passed: true, flagged: true, integrityScore: true, startedAt: true, finishedAt: true, topic: { select: { slug: true, title: true } }, assessment: { select: { title: true, slug: true } } },
    });
  }));

  r.get("/reviews/due", handler(async (req) => {
    const me = currentUser(req);
    const rows = await prisma.mastery.findMany({
      where: { userId: me.id, masteredAt: { not: null } },
      orderBy: { nextReviewAt: "asc" },
      include: { topic: { select: { slug: true, title: true } } },
    });
    const now = new Date();
    return {
      due: rows.filter((m) => m.nextReviewAt && m.nextReviewAt <= now || m.status === "NEEDS_REVIEW"),
      upcoming: rows.filter((m) => m.nextReviewAt && m.nextReviewAt > now && m.status !== "NEEDS_REVIEW").slice(0, 20),
    };
  }));

  r.get("/assessments", handler(async (req) => {
    const me = currentUser(req);
    const list = await prisma.assessment.findMany({
      where: { status: "PUBLISHED", kind: { in: ["STAGE_EXAM", "MOCK_TEST"] } },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
      include: { stage: { select: { slug: true, title: true, track: true } } },
    });
    const attempts = await prisma.quizAttempt.groupBy({
      by: ["assessmentId"],
      where: { userId: me.id, assessmentId: { not: null }, status: { not: "IN_PROGRESS" } },
      _max: { score: true },
      _count: true,
    });
    return list.map((a) => {
      const s = attempts.find((x) => x.assessmentId === a.id);
      return { ...a, attemptsUsed: s?._count ?? 0, bestScore: s?._max.score ?? null };
    });
  }));

  return r;
}
