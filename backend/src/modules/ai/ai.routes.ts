import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { aiLimiter } from "../../middleware/rate-limit.js";
import { currentUser } from "../../middleware/auth.js";
import { AppError, locked } from "../../utils/errors.js";
import { handler, parse } from "../../utils/http.js";
import { answerQuestion } from "../../ai/answer.js";
import { aiProvider } from "../../ai/provider.js";
import { isEnabled } from "../platform/flags.js";
import { logEvent } from "../platform/events.js";
import { activeTimedAttempt } from "../quiz/quiz.service.js";
import { topicForLearner } from "../learning/learning.routes.js";

export function aiRoutes() {
  const r = Router();

  r.get("/status", handler(async (req) => ({
    available: !!aiProvider() && (await isEnabled("AI_TUTOR", currentUser(req).id)),
    provider: aiProvider()?.name ?? null,
  })));

  r.post("/explain", aiLimiter(), handler(async (req) => {
    const me = currentUser(req);
    // mode "solution" (default) answers directly; "hints" is the opt-in learn-by-nudges mode.
    const body = parse(z.object({ topicSlug: z.string().max(120), question: z.string().trim().min(3).max(1000), mode: z.enum(["solution", "hints"]).default("solution") }), req.body);
    if (!(await isEnabled("AI_TUTOR", me.id))) throw new AppError(403, "FEATURE_DISABLED", "The AI tutor is not enabled for your account.");
    // AI is never available while a timed test is running.
    if (await activeTimedAttempt(me.id)) throw locked("AI help is switched off while you have a test in progress.");
    const { entry } = await topicForLearner(me.id, body.topicSlug);
    if (entry.state === "LOCKED" || entry.state === "COMING_SOON") throw locked("Unlock this topic first.");

    const [profile, lastFailed] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: me.id } }),
      prisma.quizAttempt.findFirst({ where: { userId: me.id, topicId: entry.id, passed: false }, orderBy: { finishedAt: "desc" }, select: { results: true } }),
    ]);
    const mistakes = ((lastFailed?.results as { correct: boolean; snapshot: { prompt: string } }[] | null) ?? []).filter((g) => !g.correct).map((g) => g.snapshot.prompt);
    const result = await answerQuestion({
      topicId: entry.id,
      topicTitle: entry.title,
      question: body.question,
      mode: body.mode,
      locale: profile?.explanationLocale ?? "hinglish",
      level: profile?.codingLevel ?? "BEGINNER",
      recentMistakes: mistakes,
      goal: profile?.goalRole ?? "become job-ready",
    });
    await logEvent(me.id, "ai_explain", { topicId: entry.id, meta: { mode: body.mode, grounded: result.verification.grounded, inventedSources: result.verification.inventedSources } });
    // `answer` stays a Markdown string for existing clients; `structured` is the solution-first answer.
    return { answer: result.markdown, structured: result.structured, sources: result.sources, verification: result.verification, mode: body.mode };
  }));

  return r;
}
