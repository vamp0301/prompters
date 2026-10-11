import type { Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { generateAnswer, retrieve, toMarkdown, type StructuredAnswer } from "../../ai/answer.js";
import { acquire } from "../../lib/lock.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { turnScore } from "../career/interview.service.js";
import { prompts } from "../career/prompts.js";
import { evaluationSchema } from "../career/schemas.js";

export const PRACTICE_STATUSES = ["NEW", "PRACTICED", "CONFIDENT"] as const;
const CONFIDENT_SCORE = 70;

async function ownedQuestion(userId: string, planId: string, questionId: string) {
  const q = await prisma.prepQuestion.findFirst({ where: { id: questionId, planId, rank: { gt: 0 }, plan: { userId } } });
  if (!q) throw notFound("Question");
  return q;
}

/** One question with the resume chunk/claim it was generated from and the candidate's past attempts. */
export async function questionDetail(userId: string, planId: string, questionId: string) {
  const q = await ownedQuestion(userId, planId, questionId);
  const [chunk, claim, attempts] = await Promise.all([
    q.chunkId ? prisma.resumeChunk.findUnique({ where: { id: q.chunkId }, select: { id: true, type: true, title: true, text: true, technologies: true, meta: true } }) : null,
    q.claimId ? prisma.resumeClaim.findUnique({ where: { id: q.claimId }, select: { id: true, claim: true, evidence: true, risk: true, depth: true } }) : null,
    prisma.prepAttempt.findMany({ where: { questionId: q.id, userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const { translations: _t, fullAnswers: _f, ...rest } = q;
  return { ...rest, source: { chunk, claim }, attempts };
}

/** Practice mode: the answer is evaluated like an interview answer, then the key points are revealed. */
export async function practice(userId: string, planId: string, questionId: string, answer: string) {
  const q = await ownedQuestion(userId, planId, questionId);
  if (answer.trim().length < 10) throw badRequest("Write or say a little more before submitting.");
  const p = prompts.evaluate({ question: q.question, skill: q.skill, level: q.difficulty, answer, context: q.evidence, depth: 0, maxDepth: 1 });
  const evaluation = await aiJson("evaluate_answer", p.system, p.user, evaluationSchema, 1200);
  const score = turnScore({ kind: "QUESTION", skipped: false, evaluation: evaluation as unknown as Prisma.JsonValue, codeResult: null });
  const attempt = await prisma.prepAttempt.create({ data: { questionId: q.id, userId, answer, score, evaluation: evaluation as unknown as Prisma.InputJsonValue } });
  const best = await prisma.prepAttempt.aggregate({ where: { questionId: q.id, userId }, _max: { score: true } });
  const status = (best._max.score ?? 0) >= CONFIDENT_SCORE ? "CONFIDENT" : "PRACTICED";
  await prisma.prepQuestion.update({ where: { id: q.id }, data: { status } });
  await logEvent(userId, "prep_practice", { meta: { planId, questionId: q.id, score } });
  return { attempt, status, keyPoints: q.keyPoints, followUps: q.followUps };
}

export async function setStatus(userId: string, planId: string, questionId: string, status: (typeof PRACTICE_STATUSES)[number]) {
  const q = await ownedQuestion(userId, planId, questionId);
  return prisma.prepQuestion.update({ where: { id: q.id }, data: { status }, select: { id: true, status: true } });
}

const FULL_ANSWER_LOCALES = ["en", "hinglish", "hi"] as const;
type FullAnswerLocale = (typeof FULL_ANSWER_LOCALES)[number];
type CachedAnswer = { structured: StructuredAnswer; sources: { id: string; topicSlug: string; topicTitle: string; section: string }[]; verification: unknown; at: string };

const INTERVIEW_RULES = [
  "INTERVIEW-QUESTION MODE: this is a question an interviewer will ask the candidate. `answer` is the complete model answer the candidate could give (structured, specific, 120–300 words), not a summary.",
  "If the question asks for types or categories, name the classification basis and cover every established category under it; never invent a universal count.",
  "`explanation.concept` teaches the underlying concept from first principles for a beginner, then `whyItWorks` goes one level deeper (internals).",
  "`examples`: one concrete worked example with input, what happens, and output. `followUps`: 2–4 likely follow-up questions WITH their answers.",
  "Use the <context> (why it is asked, the candidate's resume line, the points a strong answer covers) and make the answer cover every one of those points.",
];

/**
 * A complete model answer for one Top-100 question, in the student's language: answer, worked example,
 * code where it helps, an animatable diagram, follow-ups with answers. Generated once per language
 * and reused, so reopening it is instant and costs no AI quota.
 */
export async function fullAnswer(userId: string, planId: string, questionId: string, locale: string, opts: { regenerate?: boolean } = {}) {
  const q = await ownedQuestion(userId, planId, questionId);
  const lang: FullAnswerLocale = (FULL_ANSWER_LOCALES as readonly string[]).includes(locale) ? (locale as FullAnswerLocale) : "hinglish";
  const cached = ((q.fullAnswers ?? {}) as Record<string, CachedAnswer>)[lang];
  if (cached && !opts.regenerate) return { ...cached, cached: true, language: lang, answer: toMarkdown(cached.structured, []) };
  const release = await acquire(`prep:full-answer:${q.id}:${lang}`, 120_000);
  if (!release) throw new AppError(503, "GENERATION_BUSY", "This answer is already being written. Try again in a moment.");
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { codingLevel: true, goalRole: true } });
    const context = [
      `Skill: ${q.skill} · difficulty ${q.difficulty}/5`,
      q.why && `Why it is asked: ${q.why}`,
      q.evidence && `From the candidate's resume: "${q.evidence}"`,
      q.keyPoints.length ? `A strong answer covers:\n- ${q.keyPoints.join("\n- ")}` : "",
      q.followUps.length ? `Likely follow-ups:\n- ${q.followUps.join("\n- ")}` : "",
    ].filter(Boolean).join("\n");
    const sources = await retrieve("", `${q.question} ${q.skill}`, lang);
    const result = await generateAnswer(
      { topicTitle: q.skill, question: q.question, context, extraRules: INTERVIEW_RULES, locale: lang, level: profile?.codingLevel ?? "BEGINNER", goal: profile?.goalRole ?? "crack the interview", mode: "solution", recentMistakes: [], timeoutMs: 60_000 },
      sources,
    );
    const entry: CachedAnswer = { structured: result.structured, sources: result.sources, verification: result.verification, at: new Date().toISOString() };
    const fresh = await prisma.prepQuestion.findUniqueOrThrow({ where: { id: q.id }, select: { fullAnswers: true } });
    await prisma.prepQuestion.update({ where: { id: q.id }, data: { fullAnswers: { ...((fresh.fullAnswers ?? {}) as Record<string, unknown>), [lang]: entry } as Prisma.InputJsonValue } });
    await logEvent(userId, "prep_full_answer", { meta: { planId, questionId: q.id, language: lang, grounded: result.verification.grounded } });
    return { ...entry, cached: false, language: lang, answer: result.markdown };
  } finally {
    await release();
  }
}
