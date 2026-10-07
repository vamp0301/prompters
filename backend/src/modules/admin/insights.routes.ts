import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../middleware/auth.js";
import { handler } from "../../utils/http.js";
import { completenessInclude, completenessOf, SECTION_ORDER } from "../learning/snapshot.js";

const DAY = 24 * 60 * 60 * 1000;

export function insightsRoutes() {
  const r = Router();
  const author = requireRole("AUTHOR");

  r.get("/dashboard", requireRole("ADMIN"), handler(async () => {
    const since30 = new Date(Date.now() - 30 * DAY);
    const since7 = new Date(Date.now() - 7 * DAY);
    const [
      users, newUsers, activeUsers, masteries, masteryAttempts, masteryPassed, quizAttempts, buildsDone, projectsDone,
      integrityEvents, flagged, aiUsage, learningMinutes, avgReadiness, daily, readinessDist, hardest, failedQuestions, abandoned, popularBuilds, retention,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.learningEvent.findMany({ where: { createdAt: { gte: since7 } }, distinct: ["userId"], select: { userId: true } }).then((x) => x.length),
      prisma.mastery.count({ where: { masteredAt: { not: null } } }),
      prisma.quizAttempt.count({ where: { kind: "MASTERY", status: { not: "IN_PROGRESS" } } }),
      prisma.quizAttempt.count({ where: { kind: "MASTERY", passed: true } }),
      prisma.quizAttempt.count({ where: { status: { not: "IN_PROGRESS" } } }),
      prisma.submission.count({ where: { status: "COMPLETED" } }),
      prisma.projectSubmission.count({ where: { status: "COMPLETED" } }),
      prisma.integrityEvent.count(),
      prisma.quizAttempt.count({ where: { flagged: true } }),
      prisma.learningEvent.count({ where: { type: "ai_explain" } }),
      prisma.$queryRaw<{ minutes: bigint | null }[]>`
        SELECT SUM(t."estMinutes")::bigint AS minutes FROM "LearningEvent" e JOIN "Topic" t ON t.id = e."topicId" WHERE e.type = 'topic_read'`,
      prisma.$queryRaw<{ avg: number | null }[]>`
        SELECT AVG(score)::float AS avg FROM (SELECT DISTINCT ON ("userId") score FROM "ReadinessSnapshot" ORDER BY "userId", "createdAt" DESC) s`,
      prisma.$queryRaw<{ day: Date; active: bigint; signups: bigint; quizzes: bigint; avg_score: number | null }[]>`
        SELECT d.day,
          (SELECT COUNT(DISTINCT "userId") FROM "LearningEvent" WHERE "createdAt"::date = d.day) AS active,
          (SELECT COUNT(*) FROM "User" WHERE "createdAt"::date = d.day) AS signups,
          (SELECT COUNT(*) FROM "QuizAttempt" WHERE "finishedAt"::date = d.day) AS quizzes,
          (SELECT AVG(score)::float FROM "QuizAttempt" WHERE "finishedAt"::date = d.day) AS avg_score
        FROM generate_series(${since30}::date, CURRENT_DATE, interval '1 day') AS d(day) ORDER BY d.day`,
      prisma.$queryRaw<{ bucket: number; users: bigint }[]>`
        SELECT LEAST(FLOOR(score / 20), 4)::int AS bucket, COUNT(*) AS users
        FROM (SELECT DISTINCT ON ("userId") score FROM "ReadinessSnapshot" ORDER BY "userId", "createdAt" DESC) s GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<{ slug: string; title: string; avg: number; attempts: bigint }[]>`
        SELECT t.slug, t.title, AVG(a.score)::float AS avg, COUNT(*) AS attempts FROM "QuizAttempt" a JOIN "Topic" t ON t.id = a."topicId"
        WHERE a.kind = 'MASTERY' AND a.score IS NOT NULL GROUP BY t.slug, t.title HAVING COUNT(*) >= 1 ORDER BY avg ASC LIMIT 5`,
      prisma.$queryRaw<{ question_id: string; prompt: string; wrong: bigint; total: bigint }[]>`
        SELECT r->>'questionId' AS question_id, MIN(r->'snapshot'->>'prompt') AS prompt,
          SUM(CASE WHEN (r->>'correct')::boolean THEN 0 ELSE 1 END) AS wrong, COUNT(*) AS total
        FROM "QuizAttempt" a, jsonb_array_elements(a.results) r
        WHERE a.results IS NOT NULL AND a."finishedAt" >= ${new Date(Date.now() - 90 * DAY)}
        GROUP BY 1 HAVING COUNT(*) >= 1 ORDER BY wrong DESC LIMIT 5`,
      prisma.$queryRaw<{ slug: string; title: string; learners: bigint }[]>`
        SELECT t.slug, t.title, COUNT(*) AS learners FROM "Mastery" m JOIN "Topic" t ON t.id = m."topicId"
        WHERE m."masteredAt" IS NULL AND m."updatedAt" < ${since7} GROUP BY t.slug, t.title ORDER BY learners DESC LIMIT 5`,
      prisma.buildTask.findMany({ orderBy: { submissions: { _count: "desc" } }, take: 5, select: { slug: true, title: true, _count: { select: { submissions: true } } } }),
      prisma.$queryRaw<{ cohort: bigint; retained: bigint }[]>`
        SELECT COUNT(*) AS cohort, COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM "LearningEvent" e WHERE e."userId" = u.id AND e."createdAt" >= ${since7} AND e.type NOT IN ('signup','login'))) AS retained
        FROM "User" u WHERE u."createdAt" BETWEEN ${new Date(Date.now() - 14 * DAY)} AND ${since7}`,
    ]);

    const n = (v: bigint | number | null | undefined) => Number(v ?? 0);
    return {
      totals: {
        users,
        newUsers7d: newUsers,
        activeUsers7d: activeUsers,
        learningHours: Math.round(n(learningMinutes[0]?.minutes) / 60),
        topicsMastered: masteries,
        quizAttempts,
        masteryRate: masteryAttempts ? Math.round((masteryPassed / masteryAttempts) * 100) : null,
        projectSubmissions: buildsDone + projectsDone,
        avgReadiness: avgReadiness[0]?.avg === null || avgReadiness[0]?.avg === undefined ? null : Math.round(avgReadiness[0].avg),
        integrityEvents,
        flaggedAttempts: flagged,
        aiUsage,
        retention7d: n(retention[0]?.cohort) ? Math.round((n(retention[0].retained) / n(retention[0].cohort)) * 100) : null,
      },
      daily: daily.map((d) => ({ day: d.day.toISOString().slice(0, 10), active: n(d.active), signups: n(d.signups), quizzes: n(d.quizzes), avgScore: d.avg_score === null ? null : Math.round(d.avg_score) })),
      readinessDistribution: [0, 1, 2, 3, 4].map((b) => ({ range: `${b * 20}–${b === 4 ? 100 : b * 20 + 19}`, users: n(readinessDist.find((x) => x.bucket === b)?.users) })),
      hardestTopics: hardest.map((h) => ({ ...h, avg: Math.round(h.avg), attempts: n(h.attempts) })),
      mostFailedQuestions: failedQuestions.map((q) => ({ questionId: q.question_id, prompt: q.prompt, wrong: n(q.wrong), total: n(q.total) })),
      mostAbandonedTopics: abandoned.map((a) => ({ ...a, learners: n(a.learners) })),
      popularBuilds: popularBuilds.map((b) => ({ slug: b.slug, title: b.title, submissions: b._count.submissions })),
    };
  }));

  r.get("/content-health", author, handler(async () => {
    const topics = await prisma.topic.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: { ...completenessInclude, module: { select: { title: true, stage: { select: { code: true, title: true } } } } },
      orderBy: [{ module: { stage: { order: "asc" } } }, { module: { order: "asc" } }, { order: "asc" }],
    });
    const rows = topics.map((t) => ({ t, c: completenessOf(t) }));
    const withContent = rows.filter((r) => r.t.sections.length > 0);
    const coverage = (key: string) => (rows.length ? Math.round((rows.filter((r) => r.c.checks.find((c) => c.key === key)?.ok).length / rows.length) * 100) : 0);
    const localeCoverage = (locale: string) => {
      const total = rows.length * SECTION_ORDER.length;
      const filled = rows.reduce((a, r) => a + r.t.sections.filter((s) => !!(s.content as Record<string, string>)[locale]?.trim()).length, 0);
      return total ? Math.round((filled / total) * 100) : 0;
    };
    return {
      totals: {
        topics: rows.length,
        withContent: withContent.length,
        complete: rows.filter((r) => r.c.publishable).length,
        incomplete: rows.filter((r) => !r.c.publishable).length,
        published: rows.filter((r) => r.t.status === "PUBLISHED").length,
        comingSoon: rows.filter((r) => r.t.status === "COMING_SOON").length,
      },
      languages: { hinglish: localeCoverage("hinglish"), en: localeCoverage("en"), hi: localeCoverage("hi") },
      coverage: {
        quiz: coverage("quiz"),
        quizPool3x: coverage("quizPool3x"),
        build: coverage("build"),
        interview: coverage("interview"),
        visual: coverage("visual"),
        prompt: coverage("prompt"),
        code: coverage("code"),
      },
      incomplete: rows
        .filter((r) => !r.c.publishable || r.c.percent < 100)
        .map((r) => ({
          id: r.t.id,
          slug: r.t.slug,
          title: r.t.title,
          status: r.t.status,
          stage: r.t.module.stage,
          module: r.t.module.title,
          percent: r.c.percent,
          missing: r.c.checks.filter((c) => !c.ok).map((c) => ({ label: c.label, required: c.required })),
        })),
    };
  }));

  r.get("/search", author, handler(async (req) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) return { query: q, results: [] };
    const like = { contains: q, mode: Prisma.QueryMode.insensitive };
    const [users, topics, modules, stages, questions, builds, projects, prompts, interviews, viz] = await Promise.all([
      prisma.user.findMany({ where: { OR: [{ email: like }, { name: like }] }, take: 5, select: { id: true, name: true, email: true } }),
      prisma.topic.findMany({ where: { OR: [{ title: like }, { slug: like }] }, take: 8, select: { id: true, title: true, slug: true, status: true } }),
      prisma.module.findMany({ where: { title: like }, take: 5, select: { id: true, title: true } }),
      prisma.stage.findMany({ where: { title: like }, take: 5, select: { id: true, title: true } }),
      prisma.question.findMany({ where: { prompt: like }, take: 5, select: { id: true, prompt: true, topic: { select: { title: true } } } }),
      prisma.buildTask.findMany({ where: { OR: [{ title: like }, { slug: like }] }, take: 5, select: { id: true, title: true } }),
      prisma.project.findMany({ where: { title: like }, take: 5, select: { id: true, title: true } }),
      prisma.promptCard.findMany({ where: { OR: [{ title: like }, { task: like }] }, take: 5, select: { id: true, title: true } }),
      prisma.interviewQuestion.findMany({ where: { question: like }, take: 5, select: { id: true, question: true } }),
      prisma.visualization.findMany({ where: { title: like }, take: 5, select: { title: true, topicId: true } }),
    ]);
    return {
      query: q,
      results: [
        ...topics.map((t) => ({ type: "Topic", id: t.id, title: t.title, subtitle: `${t.slug} · ${t.status}`, href: `/admin/topics/${t.id}` })),
        ...viz.map((v) => ({ type: "Visualization", id: v.topicId, title: v.title, subtitle: "Animation", href: `/admin/topics/${v.topicId}#visual` })),
        ...questions.map((x) => ({ type: "Question", id: x.id, title: x.prompt.slice(0, 120), subtitle: x.topic.title, href: `/admin/questions?edit=${x.id}` })),
        ...builds.map((x) => ({ type: "Build task", id: x.id, title: x.title, subtitle: "", href: `/admin/build-tasks?edit=${x.id}` })),
        ...projects.map((x) => ({ type: "Project", id: x.id, title: x.title, subtitle: "", href: `/admin/projects?edit=${x.id}` })),
        ...prompts.map((x) => ({ type: "Prompt", id: x.id, title: x.title, subtitle: "", href: `/admin/prompts?edit=${x.id}` })),
        ...interviews.map((x) => ({ type: "Interview", id: x.id, title: x.question, subtitle: "", href: `/admin/interviews?edit=${x.id}` })),
        ...modules.map((x) => ({ type: "Module", id: x.id, title: x.title, subtitle: "", href: `/admin/roadmap` })),
        ...stages.map((x) => ({ type: "Stage", id: x.id, title: x.title, subtitle: "", href: `/admin/roadmap` })),
        ...users.map((u) => ({ type: "User", id: u.id, title: u.name, subtitle: u.email, href: `/admin/users/${u.id}` })),
      ],
    };
  }));

  return r;
}
