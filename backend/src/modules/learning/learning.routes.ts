import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { locked, notFound } from "../../utils/errors.js";
import { handler, param } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";
import { flattenTopics, learnerPath } from "./path.service.js";
import type { TopicSnapshot } from "./snapshot.js";

export async function topicForLearner(userId: string, slug: string) {
  const { stages } = await learnerPath(userId);
  const all = flattenTopics(stages);
  const idx = all.findIndex((t) => t.slug === slug);
  if (idx < 0) {
    const exists = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
    if (exists) throw locked("This topic belongs to a different starting track.", { reason: "OTHER_TRACK" });
    throw notFound("Topic");
  }
  return { entry: all[idx], all, idx };
}

export function learningRoutes() {
  const r = Router();

  r.get("/roadmap", handler(async (req) => learnerPath(currentUser(req).id)));

  r.get("/stages/:slug", handler(async (req) => {
    const { stages } = await learnerPath(currentUser(req).id);
    const stage = stages.find((s) => s.slug === param(req, "slug"));
    if (!stage) throw notFound("Stage");
    return stage;
  }));

  r.get("/topics/:slug", handler(async (req) => {
    const me = currentUser(req);
    const { entry, all, idx } = await topicForLearner(me.id, param(req, "slug"));

    if (entry.state === "COMING_SOON") {
      return { comingSoon: true, slug: entry.slug, title: entry.title, stage: { slug: entry.stage.slug, title: entry.stage.title } };
    }
    if (entry.state === "LOCKED") {
      throw locked(
        entry.stage.unlocked
          ? `Before ${entry.title}, let's make sure you know ${entry.missingPrerequisites.map((p) => p.title).join(", ")}.`
          : entry.stage.lockReason ?? "This stage is locked.",
        { reason: entry.stage.unlocked ? "PREREQUISITES" : "STAGE_LOCKED", missingPrerequisites: entry.missingPrerequisites, stage: entry.stage.slug },
      );
    }

    const topic = await prisma.topic.findUniqueOrThrow({
      where: { slug: entry.slug },
      select: {
        id: true,
        publishedVersion: true,
        quizSize: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
        buildTasks: { where: { status: "PUBLISHED" }, select: { slug: true, title: true, estMinutes: true, difficulty: true } },
        promptCards: { where: { status: "PUBLISHED" }, select: { id: true, slug: true, title: true, category: true, task: true } },
        interviewQs: {
          where: { status: "PUBLISHED" },
          select: { id: true, question: true, short: true, deep: true, followUps: true, commonMistake: true, difficulty: true },
        },
        _count: { select: { questions: { where: { status: "PUBLISHED" } } } },
      },
    });
    const snapshot = topic.versions[0]?.snapshot as unknown as TopicSnapshot | undefined;
    if (!snapshot) return { comingSoon: true, slug: entry.slug, title: entry.title, stage: { slug: entry.stage.slug, title: entry.stage.title } };

    const mastery = await prisma.mastery.findUnique({ where: { userId_topicId: { userId: me.id, topicId: topic.id } } });
    const submissions = await prisma.submission.findMany({
      where: { userId: me.id, buildTask: { topicId: topic.id } },
      select: { status: true, independenceScore: true, buildTask: { select: { slug: true } } },
    });
    const unlockedPrompts = !!mastery?.masteredAt;
    const next = all.slice(idx + 1).find((t) => t.hasContent) ?? null;

    if (!mastery) await logEvent(me.id, "topic_started", { topicId: topic.id });

    return {
      comingSoon: false,
      id: topic.id,
      version: topic.publishedVersion,
      ...snapshot,
      state: entry.state,
      mastery,
      quiz: { size: topic.quizSize, poolSize: topic._count.questions },
      buildTasks: topic.buildTasks.map((b) => ({ ...b, submission: submissions.find((s) => s.buildTask.slug === b.slug) ?? null })),
      promptCards: topic.promptCards.map((p) => (unlockedPrompts ? { ...p, locked: false } : { id: p.id, title: p.title, category: p.category, locked: true })),
      interview: topic.interviewQs,
      next: next && { slug: next.slug, title: next.title, state: next.state },
    };
  }));

  r.post("/topics/:slug/read", handler(async (req) => {
    const me = currentUser(req);
    const { entry } = await topicForLearner(me.id, param(req, "slug"));
    if (entry.state === "LOCKED" || entry.state === "COMING_SOON") throw locked("This topic is not available yet.");
    const m = await prisma.mastery.upsert({
      where: { userId_topicId: { userId: me.id, topicId: entry.id } },
      create: { userId: me.id, topicId: entry.id, readAt: new Date() },
      update: { readAt: new Date() },
    });
    await logEvent(me.id, "topic_read", { topicId: entry.id });
    return m;
  }));

  return r;
}
