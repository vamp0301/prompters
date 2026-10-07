import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { handler, pageParams } from "../../utils/http.js";
import { learnerPath } from "../learning/path.service.js";
import { streak } from "./streak.js";

const MILESTONES: { type: string; label: string; meta?: (m: Record<string, unknown>) => boolean }[] = [
  { type: "signup", label: "Joined Prompters" },
  { type: "topic_started", label: "First topic" },
  { type: "quiz_submitted", label: "First quiz" },
  { type: "mastery_achieved", label: "First mastery" },
  { type: "build_completed", label: "First build without AI" },
  { type: "project_submitted", label: "First project" },
  { type: "mock_test_completed", label: "First mock test" },
  { type: "readiness_milestone", label: "Readiness 50", meta: (m) => m.milestone === 50 },
  { type: "readiness_milestone", label: "Readiness 75", meta: (m) => m.milestone === 75 },
  { type: "readiness_milestone", label: "Readiness 90", meta: (m) => m.milestone === 90 },
  { type: "application_added", label: "First job application" },
  { type: "offer_received", label: "First offer" },
];

export function journeyRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const me = currentUser(req);
    const [firsts, { stages }, masteries, attempts, builds, practice, readiness, streakInfo, learningMinutes] = await Promise.all([
      prisma.learningEvent.findMany({
        where: { userId: me.id, type: { in: [...new Set(MILESTONES.map((m) => m.type))] } },
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true, meta: true },
      }),
      learnerPath(me.id),
      prisma.mastery.findMany({ where: { userId: me.id }, include: { topic: { select: { slug: true, title: true } } } }),
      prisma.quizAttempt.groupBy({ by: ["kind", "passed"], where: { userId: me.id, status: { not: "IN_PROGRESS" } }, _count: true }),
      prisma.submission.findMany({ where: { userId: me.id }, select: { status: true, hintsUsed: true, independenceScore: true } }),
      prisma.interviewPractice.count({ where: { userId: me.id } }),
      prisma.readinessSnapshot.findMany({ where: { userId: me.id }, orderBy: { createdAt: "asc" }, select: { score: true, createdAt: true } }),
      streak(me.id),
      prisma.topic.aggregate({ where: { masteries: { some: { userId: me.id, readAt: { not: null } } } }, _sum: { estMinutes: true } }),
    ]);

    const milestones = MILESTONES.map((m) => {
      const hit = firsts.find((e) => e.type === m.type && (!m.meta || m.meta((e.meta as Record<string, unknown>) ?? {})));
      return { label: m.label, at: hit?.createdAt ?? null };
    });
    const count = (kind: string, passed?: boolean) =>
      attempts.filter((a) => a.kind === kind && (passed === undefined || a.passed === passed)).reduce((s, a) => s + a._count, 0);
    const completed = builds.filter((b) => b.status === "COMPLETED");

    return {
      milestones,
      stages: stages.map((s) => ({ slug: s.slug, title: s.title, code: s.code, percent: s.progress.percent, mastered: s.progress.mastered, total: s.progress.total, passed: s.passed })),
      stats: {
        topicsMastered: masteries.filter((m) => m.masteredAt).length,
        topicsLearning: masteries.filter((m) => !m.masteredAt).length,
        quizzesTaken: count("MASTERY") + count("PRACTICE"),
        quizzesFailed: count("MASTERY", false),
        reviewsDone: count("REVIEW"),
        reviewsFailed: count("REVIEW", false),
        buildsCompleted: completed.length,
        hintsUsed: builds.reduce((a, b) => a + b.hintsUsed, 0),
        avgIndependence: completed.length ? Math.round(completed.reduce((a, b) => a + (b.independenceScore ?? 0), 0) / completed.length) : null,
        interviewPractice: practice,
        mockTests: count("MOCK_TEST") + count("STAGE_EXAM"),
        estLearningMinutes: learningMinutes._sum.estMinutes ?? 0,
        streak: streakInfo,
      },
      forgotten: masteries.filter((m) => m.status === "NEEDS_REVIEW").map((m) => ({ ...m.topic, recallScore: m.recallScore })),
      strong: masteries.filter((m) => m.status === "MASTERED").sort((a, b) => (b.recallScore ?? b.bestScore) - (a.recallScore ?? a.bestScore)).slice(0, 8).map((m) => ({ ...m.topic, score: m.recallScore ?? m.bestScore })),
      readiness,
    };
  }));

  r.get("/events", handler(async (req) => {
    const me = currentUser(req);
    const { skip, take, page, pageSize } = pageParams(req.query, 30);
    const [items, total] = await Promise.all([
      prisma.learningEvent.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.learningEvent.count({ where: { userId: me.id } }),
    ]);
    const topics = await prisma.topic.findMany({ where: { id: { in: items.map((i) => i.topicId).filter((x): x is string => !!x) } }, select: { id: true, slug: true, title: true } });
    return { items: items.map((i) => ({ ...i, topic: topics.find((t) => t.id === i.topicId) ?? null })), total, page, pageSize };
  }));

  return r;
}
