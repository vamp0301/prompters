import type { AttemptKind, Prisma, Question, QuizAttempt } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, conflict, locked, notFound } from "../../utils/errors.js";
import { sample, shuffle } from "../../utils/random.js";
import { logEvent } from "../platform/events.js";
import { getScoring, nextReviewDate } from "../platform/scoring.js";
import { flattenTopics, learnerPath } from "../learning/path.service.js";
import { gradeQuestion, makeOptionOrder, presentQuestion, scoreOf, type Answer, type GradedQuestion, type OptionOrder } from "./grading.js";

const GRACE_MS = 60_000;
const TIMED: AttemptKind[] = ["STAGE_EXAM", "MOCK_TEST", "PLACEMENT"];

type Answers = Record<string, Answer>;

async function createAttempt(
  userId: string,
  kind: AttemptKind,
  questions: Question[],
  extra: { topicId?: string; topicVersion?: number; assessmentId?: string; durationMinutes?: number } = {},
) {
  if (questions.length === 0) throw conflict("There are no questions available for this quiz yet.");
  const ordered = shuffle(questions);
  const optionOrders: Record<string, OptionOrder> = Object.fromEntries(ordered.map((q) => [q.id, makeOptionOrder(q)]));
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      kind,
      topicId: extra.topicId,
      topicVersion: extra.topicVersion,
      assessmentId: extra.assessmentId,
      questionIds: ordered.map((q) => q.id),
      optionOrders,
      expiresAt: extra.durationMinutes ? new Date(Date.now() + extra.durationMinutes * 60_000) : null,
    },
  });
  await logEvent(userId, kind === "MOCK_TEST" ? "mock_test_started" : "quiz_started", {
    topicId: extra.topicId,
    meta: { kind, attemptId: attempt.id },
  });
  return present(attempt, ordered);
}

function present(attempt: QuizAttempt, questions: Question[]) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const orders = attempt.optionOrders as Record<string, OptionOrder>;
  return {
    id: attempt.id,
    kind: attempt.kind,
    status: attempt.status,
    topicId: attempt.topicId,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    draftAnswers: (attempt.draftAnswers as Answers | null) ?? {},
    questions: attempt.questionIds.map((id) => presentQuestion(byId.get(id)!, orders[id])),
  };
}

async function ownedAttempt(userId: string, attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId }, include: { assessment: true } });
  // Same 404 for "missing" and "not yours" so attempt ids can't be probed (IDOR).
  if (!attempt || attempt.userId !== userId) throw notFound("Quiz attempt");
  return attempt;
}

/** Picks n questions, preferring ones the learner did not see in their previous attempt. */
async function pickForTopic(userId: string, topicId: string, n: number, kind: AttemptKind) {
  const pool = await prisma.question.findMany({ where: { topicId, status: "PUBLISHED" } });
  const last = await prisma.quizAttempt.findFirst({
    where: { userId, topicId, kind },
    orderBy: { startedAt: "desc" },
    select: { questionIds: true },
  });
  const seen = new Set(last?.questionIds ?? []);
  const fresh = shuffle(pool.filter((q) => !seen.has(q.id)));
  const repeat = shuffle(pool.filter((q) => seen.has(q.id)));
  return [...fresh, ...repeat].slice(0, n);
}

// ───────────────────────── Starting quizzes ─────────────────────────

export async function startTopicQuiz(userId: string, slug: string, kind: "MASTERY" | "REVIEW") {
  const cfg = await getScoring();
  const { stages } = await learnerPath(userId);
  const entry = flattenTopics(stages).find((t) => t.slug === slug);
  if (!entry || !entry.hasContent) throw notFound("Topic");
  if (entry.state === "LOCKED") throw locked("Unlock this topic before taking its quiz.", { missingPrerequisites: entry.missingPrerequisites });
  const topic = await prisma.topic.findUniqueOrThrow({ where: { id: entry.id } });

  if (kind === "REVIEW") {
    const m = await prisma.mastery.findUnique({ where: { userId_topicId: { userId, topicId: topic.id } } });
    if (!m?.masteredAt) throw badRequest("Master this topic before reviewing it.");
  }
  const size = kind === "MASTERY" ? topic.quizSize || cfg.quiz.masterySize : cfg.quiz.reviewSize;
  const questions = await pickForTopic(userId, topic.id, size, kind);
  return createAttempt(userId, kind, questions, { topicId: topic.id, topicVersion: topic.publishedVersion });
}

/** Daily "Practice 10": weak topics + due reviews + one stretch question. */
export async function startPractice(userId: string) {
  const cfg = await getScoring();
  const now = new Date();
  const masteries = await prisma.mastery.findMany({ where: { userId, OR: [{ attempts: { gt: 0 } }, { masteredAt: { not: null } }] } });
  if (masteries.length === 0) throw conflict("Take your first mastery quiz, then Practice 10 will mix your weak and due topics.");

  const due = masteries.filter((m) => m.nextReviewAt && m.nextReviewAt <= now).map((m) => m.topicId);
  const weak = masteries
    .filter((m) => m.status !== "MASTERED" || (m.recallScore ?? 100) < cfg.masteryThreshold)
    .sort((a, b) => (a.recallScore ?? a.bestScore) - (b.recallScore ?? b.bestScore))
    .map((m) => m.topicId);
  const rest = masteries.map((m) => m.topicId);
  const priority = [...new Set([...weak, ...due, ...rest])];

  const pool = await prisma.question.findMany({ where: { topicId: { in: priority }, status: "PUBLISHED", type: { not: "EXPLAIN" } } });
  const byTopic = new Map<string, Question[]>();
  for (const q of shuffle(pool)) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);

  const picked: Question[] = [];
  const target = cfg.quiz.practiceSize - 1;
  // Round-robin across topics in priority order so weak topics get the most questions.
  while (picked.length < target && [...byTopic.values()].some((qs) => qs.length)) {
    for (const topicId of priority) {
      const q = byTopic.get(topicId)?.shift();
      if (q) picked.push(q);
      if (picked.length >= target) break;
    }
  }

  const { stages } = await learnerPath(userId);
  const next = flattenTopics(stages).find((t) => t.hasContent && (t.state === "AVAILABLE" || t.state === "IN_PROGRESS"));
  if (next) {
    const stretch = await prisma.question.findMany({
      where: { topicId: next.id, status: "PUBLISHED", type: { not: "EXPLAIN" }, id: { notIn: picked.map((q) => q.id) } },
      orderBy: { difficulty: "desc" },
      take: 3,
    });
    if (stretch.length) picked.push(sample(stretch, 1)[0]);
  }
  return createAttempt(userId, "PRACTICE", picked);
}

/** Onboarding placement test: two questions per Stage 0 / Stage 1 topic so known topics can be skipped. */
export async function startPlacement(userId: string) {
  const existing = await prisma.quizAttempt.findFirst({ where: { userId, kind: "PLACEMENT", status: "IN_PROGRESS" } });
  if (existing) return getAttempt(userId, existing.id);
  const { stages } = await learnerPath(userId);
  const topics = flattenTopics(stages.filter((s) => s.order <= 1)).filter((t) => t.hasContent).slice(0, 15);
  const picked: Question[] = [];
  for (const t of topics) {
    const qs = await prisma.question.findMany({
      where: { topicId: t.id, status: "PUBLISHED", type: { not: "EXPLAIN" }, difficulty: { lte: 2 } },
    });
    picked.push(...sample(qs, 2));
  }
  return createAttempt(userId, "PLACEMENT", picked, { durationMinutes: 30 });
}

export async function startAssessment(userId: string, slug: string) {
  const a = await prisma.assessment.findUnique({ where: { slug } });
  if (!a || a.status !== "PUBLISHED") throw notFound("Assessment");
  const active = await prisma.quizAttempt.findFirst({ where: { userId, assessmentId: a.id, status: "IN_PROGRESS" } });
  if (active) {
    if (active.expiresAt && active.expiresAt.getTime() + GRACE_MS < Date.now()) await finalize(active.id, (active.draftAnswers as Answers) ?? {}, "EXPIRED");
    else return getAttempt(userId, active.id);
  }
  if (a.maxAttempts) {
    const used = await prisma.quizAttempt.count({ where: { userId, assessmentId: a.id, status: { not: "IN_PROGRESS" } } });
    if (used >= a.maxAttempts) throw new AppError(409, "NO_ATTEMPTS_LEFT", "You have used all attempts for this assessment.");
  }

  let topicIds: string[];
  if (a.topicSlugs.length) {
    topicIds = (await prisma.topic.findMany({ where: { slug: { in: a.topicSlugs } }, select: { id: true } })).map((t) => t.id);
  } else if (a.stageId) {
    const { stages } = await learnerPath(userId);
    const stage = stages.find((s) => s.id === a.stageId);
    if (!stage) throw notFound("Stage");
    if (!stage.unlocked) throw locked(stage.lockReason ?? "This stage is locked.");
    topicIds = flattenTopics([stage]).filter((t) => t.hasContent).map((t) => t.id);
  } else {
    throw conflict("This assessment has no question source configured.");
  }

  // Spread questions evenly across topics.
  const pool = shuffle(await prisma.question.findMany({ where: { topicId: { in: topicIds }, status: "PUBLISHED" } }));
  const byTopic = new Map<string, Question[]>();
  for (const q of pool) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);
  const picked: Question[] = [];
  while (picked.length < a.questionCount && [...byTopic.values()].some((qs) => qs.length)) {
    for (const qs of byTopic.values()) {
      const q = qs.shift();
      if (q) picked.push(q);
      if (picked.length >= a.questionCount) break;
    }
  }
  const attempt = await createAttempt(userId, a.kind, picked, { assessmentId: a.id, durationMinutes: a.durationMinutes });
  return { ...attempt, assessment: assessmentRules(a) };
}

function assessmentRules(a: { title: string; durationMinutes: number; tabSwitchLimit: number; violationPolicy: string; blockClipboard: boolean; requireFullscreen: boolean; passingScore: number }) {
  return {
    title: a.title,
    durationMinutes: a.durationMinutes,
    tabSwitchLimit: a.tabSwitchLimit,
    violationPolicy: a.violationPolicy,
    blockClipboard: a.blockClipboard,
    requireFullscreen: a.requireFullscreen,
    passingScore: a.passingScore,
  };
}

// ───────────────────────── In-progress attempts ─────────────────────────

export async function getAttempt(userId: string, attemptId: string) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") return { id: attempt.id, status: attempt.status, kind: attempt.kind, result: resultView(attempt) };
  if (attempt.expiresAt && attempt.expiresAt.getTime() + GRACE_MS < Date.now()) {
    const finished = await finalize(attempt.id, (attempt.draftAnswers as Answers) ?? {}, "EXPIRED");
    return { id: attempt.id, status: finished.status, kind: attempt.kind, result: finished };
  }
  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionIds } } });
  return { ...present(attempt, questions), assessment: attempt.assessment ? assessmentRules(attempt.assessment) : null };
}

export async function saveDraft(userId: string, attemptId: string, answers: Answers) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") throw conflict("This attempt is already submitted.");
  const allowed = Object.fromEntries(Object.entries(answers).filter(([k]) => attempt.questionIds.includes(k)));
  await prisma.quizAttempt.update({ where: { id: attemptId }, data: { draftAnswers: allowed as Prisma.InputJsonValue } });
  return { savedAt: new Date() };
}

export const INTEGRITY_EVENTS = ["TAB_HIDDEN", "WINDOW_BLUR", "COPY", "PASTE", "CUT", "FULLSCREEN_EXIT", "CONTEXT_MENU", "BLOCKED_SHORTCUT"] as const;

export async function logIntegrity(userId: string, attemptId: string, events: { type: (typeof INTEGRITY_EVENTS)[number]; meta?: Record<string, unknown> }[]) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") return { recorded: 0, autoSubmitted: false };
  await prisma.integrityEvent.createMany({
    data: events.map((e) => ({ attemptId, type: e.type, meta: (e.meta ?? undefined) as Prisma.InputJsonValue | undefined })),
  });
  const a = attempt.assessment;
  if (!a) return { recorded: events.length, autoSubmitted: false };
  const tabSwitches = await prisma.integrityEvent.count({ where: { attemptId, type: "TAB_HIDDEN" } });
  if (tabSwitches > a.tabSwitchLimit) {
    if (a.violationPolicy === "AUTO_SUBMIT") {
      const result = await finalize(attemptId, (attempt.draftAnswers as Answers) ?? {}, "SUBMITTED", { flagged: true });
      return { recorded: events.length, autoSubmitted: true, result };
    }
    if (a.violationPolicy === "FLAG" && !attempt.flagged) {
      await prisma.quizAttempt.update({ where: { id: attemptId }, data: { flagged: true } });
    }
  }
  return { recorded: events.length, autoSubmitted: false, tabSwitches, tabSwitchLimit: a.tabSwitchLimit };
}

// ───────────────────────── Submitting ─────────────────────────

export async function submit(userId: string, attemptId: string, answers: Answers) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") return resultView(attempt);
  const expired = !!attempt.expiresAt && attempt.expiresAt.getTime() + GRACE_MS < Date.now();
  // After the deadline only autosaved answers count.
  return finalize(attemptId, expired ? ((attempt.draftAnswers as Answers) ?? {}) : { ...((attempt.draftAnswers as Answers) ?? {}), ...answers }, expired ? "EXPIRED" : "SUBMITTED");
}

async function finalize(attemptId: string, answers: Answers, status: "SUBMITTED" | "EXPIRED", opts: { flagged?: boolean } = {}) {
  const cfg = await getScoring();
  // Claim the attempt atomically so a double-submit can't grade twice.
  const claimed = await prisma.quizAttempt.updateMany({ where: { id: attemptId, status: "IN_PROGRESS" }, data: { status } });
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { assessment: true } });
  if (claimed.count === 0) return resultView(attempt);

  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const orders = attempt.optionOrders as Record<string, OptionOrder>;
  const graded = attempt.questionIds.filter((id) => byId.has(id)).map((id) => gradeQuestion(byId.get(id)!, orders[id], answers[id]));
  const score = scoreOf(graded);

  const integrityCount = await prisma.integrityEvent.count({ where: { attemptId } });
  const integrityScore = attempt.assessment || attempt.kind === "PLACEMENT" ? Math.max(0, 100 - integrityCount * cfg.integrityPenaltyPerEvent) : null;

  let passed: boolean | null = null;
  if (attempt.kind === "MASTERY" || attempt.kind === "REVIEW") passed = score >= cfg.masteryThreshold;
  if (attempt.assessment) passed = score >= (attempt.kind === "STAGE_EXAM" ? attempt.assessment.passingScore || cfg.stageExamPassingScore : attempt.assessment.passingScore);

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      results: graded as unknown as Prisma.InputJsonValue,
      draftAnswers: answers as Prisma.InputJsonValue,
      score,
      passed,
      integrityScore,
      flagged: opts.flagged || attempt.flagged,
      finishedAt: new Date(),
    },
    include: { assessment: true },
  });

  const effects = await applyEffects(updated, graded, cfg);
  return { ...resultView(updated), effects };
}

async function applyEffects(attempt: QuizAttempt & { assessment: { stageId: string | null; kind: string } | null }, graded: GradedQuestion[], cfg: Awaited<ReturnType<typeof getScoring>>) {
  const { userId, topicId } = attempt;
  const score = attempt.score ?? 0;
  const effects: Record<string, unknown> = {};

  if (attempt.kind === "MASTERY" && topicId) {
    const prev = await prisma.mastery.findUnique({ where: { userId_topicId: { userId, topicId } } });
    const nowMastered = !!attempt.passed;
    const firstMastery = nowMastered && !prev?.masteredAt;
    await prisma.mastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: {
        userId,
        topicId,
        attempts: 1,
        bestScore: score,
        lastScore: score,
        status: nowMastered ? "MASTERED" : "LEARNING",
        source: nowMastered ? "QUIZ" : null,
        masteredAt: nowMastered ? new Date() : null,
        reviewStep: 0,
        nextReviewAt: nowMastered ? nextReviewDate(0, cfg) : null,
        recallScore: nowMastered ? score : null,
      },
      update: {
        attempts: { increment: 1 },
        lastScore: score,
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        ...(nowMastered
          ? {
              status: "MASTERED",
              source: prev?.source ?? "QUIZ",
              masteredAt: prev?.masteredAt ?? new Date(),
              reviewStep: 0,
              nextReviewAt: nextReviewDate(0, cfg),
              recallScore: score,
            }
          : {}),
      },
    });
    await logEvent(userId, "quiz_submitted", { topicId, meta: { kind: "MASTERY", score, passed: attempt.passed } });
    if (firstMastery) {
      await logEvent(userId, "mastery_achieved", { topicId, meta: { score } });
      const prompts = await prisma.promptCard.count({ where: { topicId, status: "PUBLISHED" } });
      if (prompts) await logEvent(userId, "prompt_unlocked", { topicId, meta: { count: prompts } });
      effects.promptsUnlocked = prompts;
    }
    effects.mastered = nowMastered;
    effects.threshold = cfg.masteryThreshold;
  }

  if (attempt.kind === "REVIEW" && topicId) {
    const m = await prisma.mastery.findUniqueOrThrow({ where: { userId_topicId: { userId, topicId } } });
    const ok = !!attempt.passed;
    const step = ok ? m.reviewStep + 1 : 0;
    await prisma.mastery.update({
      where: { userId_topicId: { userId, topicId } },
      data: {
        status: ok ? "MASTERED" : "NEEDS_REVIEW",
        reviewStep: step,
        nextReviewAt: ok ? nextReviewDate(step, cfg) : nextReviewDate(0, cfg),
        lastReviewedAt: new Date(),
        recallScore: score,
      },
    });
    await logEvent(userId, ok ? "review_completed" : "review_failed", { topicId, meta: { score, step } });
    effects.recallScore = score;
    effects.nextReviewInDays = cfg.reviewIntervalsDays[Math.min(step, cfg.reviewIntervalsDays.length - 1)];
    effects.backToPractice = !ok;
  }

  if (attempt.kind === "PLACEMENT") {
    const byTopic = new Map<string, GradedQuestion[]>();
    for (const g of graded) byTopic.set(g.topicId, [...(byTopic.get(g.topicId) ?? []), g]);
    const skipped: string[] = [];
    for (const [tId, gs] of byTopic) {
      if (gs.length > 0 && gs.every((g) => g.correct)) {
        skipped.push(tId);
        await prisma.mastery.upsert({
          where: { userId_topicId: { userId, topicId: tId } },
          create: { userId, topicId: tId, status: "MASTERED", source: "PLACEMENT", bestScore: 100, lastScore: 100, masteredAt: new Date(), nextReviewAt: nextReviewDate(1, cfg), reviewStep: 1, recallScore: 100 },
          update: {},
        });
      }
    }
    // A stage counts as passed when placement proves 80%+ of its topics.
    const { stages } = await learnerPath(userId);
    const passedStages: string[] = [];
    for (const s of stages.filter((st) => st.order <= 1 && st.progress.total > 0)) {
      if (s.progress.mastered / s.progress.total >= 0.8 && !s.passed) {
        await prisma.stageProgress.upsert({
          where: { userId_stageId: { userId, stageId: s.id } },
          create: { userId, stageId: s.id, passedAt: new Date(), passedBy: "PLACEMENT" },
          update: { passedAt: new Date(), passedBy: "PLACEMENT" },
        });
        passedStages.push(s.title);
      }
    }
    await prisma.userProfile.update({ where: { userId }, data: { placementCompletedAt: new Date() } }).catch(() => undefined);
    await logEvent(userId, "placement_completed", { meta: { score, skippedTopics: skipped.length, passedStages } });
    effects.skippedTopics = skipped.length;
    effects.passedStages = passedStages;
  }

  if (attempt.kind === "STAGE_EXAM" && attempt.assessment?.stageId) {
    const stageId = attempt.assessment.stageId;
    const prev = await prisma.stageProgress.findUnique({ where: { userId_stageId: { userId, stageId } } });
    await prisma.stageProgress.upsert({
      where: { userId_stageId: { userId, stageId } },
      create: { userId, stageId, bestExamScore: score, passedAt: attempt.passed ? new Date() : null, passedBy: attempt.passed ? "EXAM" : null },
      update: {
        bestExamScore: Math.max(prev?.bestExamScore ?? 0, score),
        ...(attempt.passed && !prev?.passedAt ? { passedAt: new Date(), passedBy: "EXAM" } : {}),
      },
    });
    if (attempt.passed && !prev?.passedAt) await logEvent(userId, "stage_passed", { meta: { stageId, score } });
    effects.stagePassed = attempt.passed;
  }

  if (attempt.kind === "MOCK_TEST") await logEvent(userId, "mock_test_completed", { meta: { score, passed: attempt.passed } });
  if (attempt.kind === "PRACTICE") await logEvent(userId, "quiz_submitted", { meta: { kind: "PRACTICE", score } });

  return effects;
}

function resultView(attempt: QuizAttempt) {
  const graded = (attempt.results as unknown as GradedQuestion[] | null) ?? [];
  return {
    id: attempt.id,
    kind: attempt.kind,
    status: attempt.status,
    score: attempt.score,
    passed: attempt.passed,
    flagged: attempt.flagged,
    integrityScore: attempt.integrityScore,
    topicId: attempt.topicId,
    finishedAt: attempt.finishedAt,
    timed: TIMED.includes(attempt.kind),
    questions: graded.map((g) => ({
      questionId: g.questionId,
      topicId: g.topicId,
      prompt: g.snapshot.prompt,
      code: g.snapshot.code,
      type: g.snapshot.type,
      options: (attempt.optionOrders as Record<string, OptionOrder>)[g.questionId]?.map((i) => g.snapshot.options[i]) ?? [],
      correct: g.correct,
      earned: g.earned,
      points: g.points,
      answer: g.answer,
      correctAnswer: g.correctAnswer,
      explanation: g.explanation,
      matched: g.matched,
      missing: g.missing,
    })),
  };
}

export async function activeTimedAttempt(userId: string) {
  return prisma.quizAttempt.findFirst({
    where: { userId, status: "IN_PROGRESS", kind: { in: TIMED }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(Date.now() - GRACE_MS) } }] },
    select: { id: true, kind: true },
  });
}
