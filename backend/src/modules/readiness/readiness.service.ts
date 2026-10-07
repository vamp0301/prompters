import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { flattenTopics, learnerPath, nextTopic, type PathStage } from "../learning/path.service.js";
import { logEvent } from "../platform/events.js";
import { getScoring } from "../platform/scoring.js";

const ROLE_LABEL: Record<string, string> = {
  BACKEND: "Backend",
  FRONTEND: "Frontend",
  FULLSTACK: "Full-stack",
  DEVOPS: "DevOps",
  SDE: "SDE",
  AI: "AI Engineer",
};

/** How many independent builds/projects count as "enough" evidence for the projects factor. */
const PROJECT_TARGET = 5;
/** How many practised interview questions count as full coverage. */
const INTERVIEW_TARGET = 10;

export interface Action {
  label: string;
  href: string;
  reason: string;
}

export async function computeReadiness(userId: string) {
  const cfg = await getScoring();
  const [{ stages }, profile, user, masteries, builds, projects, practice, mocks] = await Promise.all([
    learnerPath(userId),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
    prisma.mastery.findMany({ where: { userId, masteredAt: { not: null } } }),
    prisma.submission.findMany({ where: { userId, status: "COMPLETED" }, include: { buildTask: { select: { slug: true, title: true, topicId: true } } } }),
    prisma.projectSubmission.findMany({ where: { userId, status: "COMPLETED" } }),
    prisma.interviewPractice.groupBy({ by: ["questionId"], where: { userId }, _max: { score: true } }),
    prisma.quizAttempt.findMany({ where: { userId, kind: "MOCK_TEST", status: { not: "IN_PROGRESS" } }, select: { score: true }, orderBy: { finishedAt: "desc" }, take: 5 }),
  ]);
  const aiInterviews = await prisma.interviewSession.findMany({
    where: { userId, readinessScore: { not: null }, status: { in: ["COMPLETED", "ENDED_INTEGRITY"] } },
    orderBy: { startedAt: "desc" },
    take: 3,
    select: { readinessScore: true },
  });

  const role = profile?.goalRole ?? "FULLSTACK";
  const topics = flattenTopics(stages).filter((t) => t.hasContent);
  const isMastered = (t: (typeof topics)[number]) => t.state === "MASTERED" || t.state === "NEEDS_REVIEW";
  const required = topics.filter((t) => role === "SDE" || role === "AI" || t.stage.targetRoles.includes(role));
  const dsa = topics.filter((t) => t.module.slug === "dsa");
  const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

  const masteryPct = pct(required.filter(isMastered).length, required.length);
  const dsaPct = pct(dsa.filter(isMastered).length, dsa.length);
  const recallPct = masteries.length
    ? Math.round(masteries.reduce((a, m) => a + (m.recallScore ?? m.bestScore), 0) / masteries.length)
    : 0;
  const evidence =
    builds.reduce((a, b) => a + (b.independenceScore ?? 0) / 100, 0) +
    projects.reduce((a, p) => a + (p.independenceScore / 100) * 2, 0);
  const projectsPct = Math.min(100, Math.round((evidence / PROJECT_TARGET) * 100));
  const practiceAvg = practice.length ? practice.reduce((a, p) => a + (p._max.score ?? 0), 0) / practice.length : 0;
  const practicePart = practiceAvg * Math.min(1, practice.length / INTERVIEW_TARGET);
  const mockAvg = mocks.length ? mocks.reduce((a, m) => a + (m.score ?? 0), 0) / mocks.length : null;
  const aiAvg = aiInterviews.length ? aiInterviews.reduce((a, s) => a + (s.readinessScore ?? 0), 0) / aiInterviews.length : null;
  // Blend whichever interview signals exist: question-bank practice, timed mock tests, AI technical interviews.
  const parts: [number, number][] = [[practicePart, 0.4], ...(mockAvg === null ? [] : [[mockAvg, 0.3] as [number, number]]), ...(aiAvg === null ? [] : [[aiAvg, 0.3] as [number, number]])];
  const interviewPct = Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0));
  const resumeChecks = [
    !!user.name,
    !!profile?.education,
    !!profile?.goalRole,
    (profile?.skills.length ?? 0) >= 3,
    !!profile?.headline,
    !!profile?.summary,
    !!profile?.links && Object.keys(profile.links as object).length > 0,
    (profile?.targetCompanies.length ?? 0) > 0,
  ];
  const resumePct = pct(resumeChecks.filter(Boolean).length, resumeChecks.length);

  const factors = {
    mastery: masteryPct,
    projects: projectsPct,
    dsa: dsaPct,
    recall: recallPct,
    interview: interviewPct,
    resume: resumePct,
  };
  const w = cfg.readinessWeights;
  const wSum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const score = Math.round(
    (factors.mastery * w.mastery + factors.projects * w.projects + factors.dsa * w.dsa + factors.recall * w.recall + factors.interview * w.interview + factors.resume * w.resume) / wSum,
  );

  const areas = [
    ...stages.filter((s) => s.progress.total > 0).map((s) => ({ key: `stage:${s.slug}`, label: s.title, value: s.progress.percent })),
    { key: "projects", label: "Projects", value: projectsPct },
    { key: "interview", label: "Interview", value: interviewPct },
    { key: "recall", label: "Recall", value: recallPct },
  ];
  const weakestAreas = [...areas].filter((a) => a.value < 100).sort((a, b) => a.value - b.value).slice(0, 3);

  const roleLabel = ROLE_LABEL[role] ?? role;
  const status =
    score >= 80 ? `${roleLabel} interview ready` : score >= 60 ? `Almost ${roleLabel} interview ready` : score >= 35 ? "Getting there" : "Building foundations";

  return {
    score,
    status,
    role,
    factors,
    weights: w,
    areas,
    weakestAreas,
    nextActions: await nextActions(userId, stages, builds.map((b) => b.buildTask.slug), factors),
  };
}

async function nextActions(userId: string, stages: PathStage[], completedBuilds: string[], factors: Record<string, number>) {
  const actions: Action[] = [];
  const masteredIds = new Set(flattenTopics(stages).filter((t) => t.state === "MASTERED" || t.state === "NEEDS_REVIEW").map((t) => t.id));
  const [due, pendingBuild] = await Promise.all([
    prisma.mastery.count({ where: { userId, OR: [{ nextReviewAt: { lte: new Date() } }, { status: "NEEDS_REVIEW" }], masteredAt: { not: null } } }),
    prisma.buildTask.findFirst({
      where: { status: "PUBLISHED", topicId: { in: [...masteredIds] }, slug: { notIn: completedBuilds } },
      select: { slug: true, title: true },
    }),
  ]);
  if (due > 0) actions.push({ label: `Review ${due} topic${due > 1 ? "s" : ""} due today`, href: "/reviews", reason: "Spaced review keeps what you learned until interview day." });

  const next = nextTopic(stages);
  if (next) actions.push({ label: `Continue: ${next.title}`, href: `/learn/topic/${next.slug}`, reason: `Next step in ${next.stage.title}.` });

  const examReady = stages.find((s) => s.unlocked && !s.passed && s.examSlug && s.progress.total > 0 && s.progress.percent >= 70);
  if (examReady) actions.push({ label: `Take the ${examReady.title} stage exam`, href: `/mock-tests/${examReady.examSlug}`, reason: "Passing it unlocks the next stage." });

  if (pendingBuild) actions.push({ label: `Build without AI: ${pendingBuild.title}`, href: `/workspace/${pendingBuild.slug}`, reason: "Prove you can build it yourself." });

  if (factors.interview < 50) actions.push({ label: "Practise 3 interview questions", href: "/interviews", reason: "Your interview score is your weakest signal." });
  if (factors.resume < 60) actions.push({ label: "Complete your profile", href: "/profile", reason: "Resume and profile count towards readiness." });
  return actions.slice(0, 3);
}

/** Computes readiness and stores a snapshot when it changed (history powers the trend chart). */
export async function readinessWithHistory(userId: string) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [current, last, previousHistory] = await Promise.all([
    computeReadiness(userId),
    prisma.readinessSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.readinessSnapshot.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, select: { score: true, createdAt: true } }),
  ]);
  const history = [...previousHistory];
  const stale = !last || Date.now() - last.createdAt.getTime() > 6 * 60 * 60 * 1000;
  if (!last || last.score !== current.score || stale) {
    const created = await prisma.readinessSnapshot.create({
      data: {
        userId,
        score: current.score,
        breakdown: current.factors as Prisma.InputJsonValue,
        weakestAreas: current.weakestAreas as unknown as Prisma.InputJsonValue,
      },
    });
    history.push({ score: created.score, createdAt: created.createdAt });
    for (const milestone of [50, 75, 90]) {
      if (current.score >= milestone && (last?.score ?? 0) < milestone) {
        await logEvent(userId, "readiness_milestone", { meta: { milestone } });
      }
    }
  }
  const at = (days: number) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return [...history].reverse().find((h) => h.createdAt.getTime() <= cutoff)?.score ?? null;
  };
  return { ...current, history, sevenDaysAgo: at(7), thirtyDaysAgo: at(30) };
}
