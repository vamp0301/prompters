import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { AppError, locked, notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";
import { isEnabled } from "../platform/flags.js";

async function masteredTopicIds(userId: string) {
  const rows = await prisma.mastery.findMany({ where: { userId, masteredAt: { not: null } }, select: { topicId: true } });
  return new Set(rows.map((r) => r.topicId));
}

async function ensureEnabled(userId: string) {
  if (!(await isEnabled("PROMPT_LIBRARY", userId))) throw new AppError(403, "FEATURE_DISABLED", "The prompt library is not enabled yet.");
}

export function promptRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const me = currentUser(req);
    await ensureEnabled(me.id);
    const [cards, mastered, favs, ratings] = await Promise.all([
      prisma.promptCard.findMany({ where: { status: "PUBLISHED" }, include: { topic: { select: { id: true, slug: true, title: true } } }, orderBy: { title: "asc" } }),
      masteredTopicIds(me.id),
      prisma.promptFavorite.findMany({ where: { userId: me.id } }),
      prisma.promptRating.groupBy({ by: ["promptId"], _avg: { rating: true }, _count: true }),
    ]);
    return cards.map((c) => {
      const unlocked = mastered.has(c.topicId);
      const rating = ratings.find((x) => x.promptId === c.id);
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        category: c.category,
        topic: { slug: c.topic.slug, title: c.topic.title },
        task: unlocked ? c.task : null,
        unlocked,
        favorite: favs.some((f) => f.promptId === c.id),
        rating: rating ? { average: Math.round((rating._avg.rating ?? 0) * 10) / 10, count: rating._count } : null,
      };
    });
  }));

  r.get("/:id", handler(async (req) => {
    const me = currentUser(req);
    await ensureEnabled(me.id);
    const card = await prisma.promptCard.findUnique({ where: { id: param(req, "id") }, include: { topic: { select: { slug: true, title: true } } } });
    if (!card || card.status !== "PUBLISHED") throw notFound("Prompt");
    if (!(await masteredTopicIds(me.id)).has(card.topicId)) {
      throw locked(`Master "${card.topic.title}" to unlock this prompt. Learn first, then prompt.`, { topic: card.topic });
    }
    const [fav, mine] = await Promise.all([
      prisma.promptFavorite.findUnique({ where: { userId_promptId: { userId: me.id, promptId: card.id } } }),
      prisma.promptRating.findUnique({ where: { userId_promptId: { userId: me.id, promptId: card.id } } }),
    ]);
    return { ...card, favorite: !!fav, myRating: mine?.rating ?? null };
  }));

  async function unlockedCard(userId: string, promptId: string) {
    await ensureEnabled(userId);
    const card = await prisma.promptCard.findUnique({ where: { id: promptId } });
    if (!card || card.status !== "PUBLISHED") throw notFound("Prompt");
    if (!(await masteredTopicIds(userId)).has(card.topicId)) throw locked("Unlock this prompt first.");
    return card;
  }

  r.post("/:id/favorite", handler(async (req) => {
    const me = currentUser(req);
    const promptId = param(req, "id");
    await unlockedCard(me.id, promptId);
    const existing = await prisma.promptFavorite.findUnique({ where: { userId_promptId: { userId: me.id, promptId } } });
    if (existing) {
      await prisma.promptFavorite.delete({ where: { userId_promptId: { userId: me.id, promptId } } });
      return { favorite: false };
    }
    await prisma.promptFavorite.create({ data: { userId: me.id, promptId } });
    return { favorite: true };
  }));

  r.post("/:id/rate", handler(async (req) => {
    const me = currentUser(req);
    const promptId = param(req, "id");
    const { rating } = parse(z.object({ rating: z.number().int().min(1).max(5) }), req.body);
    const card = await prisma.promptCard.findUnique({ where: { id: promptId } });
    if (!card) throw notFound("Prompt");
    if (!(await masteredTopicIds(me.id)).has(card.topicId)) throw locked("Unlock this prompt before rating it.");
    await prisma.promptRating.upsert({ where: { userId_promptId: { userId: me.id, promptId } }, create: { userId: me.id, promptId, rating }, update: { rating } });
    return { rating };
  }));

  r.post("/:id/used", handler(async (req) => {
    const me = currentUser(req);
    await unlockedCard(me.id, param(req, "id"));
    await logEvent(me.id, "prompt_used", { meta: { promptId: param(req, "id") } });
    return { ok: true };
  }));

  return r;
}
