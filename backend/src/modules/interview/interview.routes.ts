import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { notFound } from "../../utils/errors.js";
import { handler, pageParams, param, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";
import { keywordScore } from "../platform/text.js";

export const INTERVIEW_CATEGORIES = ["DSA", "OS", "DBMS", "NETWORKS", "OOP", "BACKEND", "FRONTEND", "SYSTEM_DESIGN", "SECURITY", "PROJECTS", "HR", "FOUNDATIONS", "LANGUAGE"] as const;

export function interviewRoutes() {
  const r = Router();

  r.get("/questions", handler(async (req) => {
    const me = currentUser(req);
    const { skip, take, page, pageSize } = pageParams(req.query, 30);
    const where: Prisma.InterviewQuestionWhereInput = { status: "PUBLISHED" };
    if (typeof req.query.category === "string" && req.query.category) where.category = req.query.category;
    if (typeof req.query.role === "string" && req.query.role) where.roles = { has: req.query.role };
    if (typeof req.query.q === "string" && req.query.q.trim()) where.question = { contains: req.query.q.trim(), mode: "insensitive" };
    const [items, total, practice, categories] = await Promise.all([
      prisma.interviewQuestion.findMany({
        where,
        skip,
        take,
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        include: { topic: { select: { slug: true, title: true } } },
      }),
      prisma.interviewQuestion.count({ where }),
      prisma.interviewPractice.groupBy({ by: ["questionId"], where: { userId: me.id }, _max: { score: true } }),
      prisma.interviewQuestion.groupBy({ by: ["category"], where: { status: "PUBLISHED" }, _count: true }),
    ]);
    return {
      items: items.map((q) => ({ ...q, keywords: undefined, bestScore: practice.find((p) => p.questionId === q.id)?._max.score ?? null })),
      total,
      page,
      pageSize,
      categories: categories.map((c) => ({ category: c.category, count: c._count })),
    };
  }));

  r.post("/questions/:id/practice", handler(async (req) => {
    const me = currentUser(req);
    const { answer } = parse(z.object({ answer: z.string().trim().min(1).max(5000) }), req.body);
    const q = await prisma.interviewQuestion.findUnique({ where: { id: param(req, "id") } });
    if (!q || q.status !== "PUBLISHED") throw notFound("Question");
    const result = keywordScore(answer, q.keywords);
    await prisma.interviewPractice.create({
      data: { userId: me.id, questionId: q.id, answer, score: result.score, matched: result.matched, missing: result.missing },
    });
    await logEvent(me.id, "interview_practiced", { topicId: q.topicId, meta: { questionId: q.id, score: result.score } });
    return { ...result, modelShort: q.short, modelDeep: q.deep, followUps: q.followUps, commonMistake: q.commonMistake };
  }));

  return r;
}
