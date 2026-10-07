import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { handler } from "../../utils/http.js";
import { flattenTopics, learnerPath, nextTopic } from "../learning/path.service.js";
import { readinessWithHistory } from "../readiness/readiness.service.js";
import { dayKey, streak } from "../journey/streak.js";

export function dashboardRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const me = currentUser(req);
    const [readiness, { stages, language }, profile, todayEvents, dueReviews, recentBuilds, streakInfo] = await Promise.all([
      readinessWithHistory(me.id),
      learnerPath(me.id),
      prisma.userProfile.findUnique({ where: { userId: me.id } }),
      prisma.learningEvent.findMany({ where: { userId: me.id, createdAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) } }, select: { type: true, createdAt: true, topicId: true } }),
      prisma.mastery.count({ where: { userId: me.id, masteredAt: { not: null }, OR: [{ nextReviewAt: { lte: new Date() } }, { status: "NEEDS_REVIEW" }] } }),
      prisma.submission.findMany({
        where: { userId: me.id, status: { in: ["COMPLETED", "TESTS_PASSED"] } },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: { buildTask: { select: { slug: true, title: true } } },
      }),
      streak(me.id),
    ]);

    const today = dayKey(new Date());
    const doneToday = (type: string, topicId?: string) => todayEvents.some((e) => e.type === type && dayKey(e.createdAt) === today && (!topicId || e.topicId === topicId));
    const next = nextTopic(stages);
    const current = next?.stage;
    const plan = [
      next && { key: "learn", label: `Learn: ${next.title}`, href: `/learn/topic/${next.slug}`, minutes: next.estMinutes, done: doneToday("topic_read", next.id) },
      next && { key: "quiz", label: `Pass the ${next.title} mastery quiz`, href: `/learn/topic/${next.slug}#quiz`, minutes: 8, done: doneToday("mastery_achieved", next.id) },
      dueReviews > 0 && { key: "reviews", label: `Review ${dueReviews} due topic${dueReviews > 1 ? "s" : ""}`, href: "/reviews", minutes: dueReviews * 3, done: false },
      { key: "practice", label: "Practice 10", href: "/practice", minutes: 10, done: todayEvents.some((e) => e.type === "quiz_submitted" && dayKey(e.createdAt) === today) },
      readiness.nextActions.find((a) => a.href.startsWith("/workspace")) && {
        key: "build",
        label: readiness.nextActions.find((a) => a.href.startsWith("/workspace"))!.label,
        href: readiness.nextActions.find((a) => a.href.startsWith("/workspace"))!.href,
        minutes: 25,
        done: doneToday("build_completed"),
      },
    ].filter(Boolean);

    const all = flattenTopics(stages);
    return {
      user: { name: me.name, onboarded: !!profile?.onboardedAt, placementDone: !!profile?.placementCompletedAt, language, goalRole: profile?.goalRole ?? null },
      readiness,
      plan,
      continue: next && current
        ? {
            topic: { slug: next.slug, title: next.title, state: next.state },
            module: next.module.title,
            stage: { slug: current.slug, title: current.title, percent: current.progress.percent },
          }
        : null,
      weakAreas: readiness.weakestAreas,
      dueReviews,
      recentBuilds: recentBuilds.map((b) => ({ slug: b.buildTask.slug, title: b.buildTask.title, status: b.status, independenceScore: b.independenceScore, projectScore: b.projectScore })),
      streak: streakInfo,
      totals: {
        mastered: all.filter((t) => t.state === "MASTERED" || t.state === "NEEDS_REVIEW").length,
        available: all.filter((t) => t.hasContent).length,
      },
    };
  }));

  return r;
}
