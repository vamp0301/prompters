import type { Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { generateAnswer, retrieveWithMode, toMarkdown, type StructuredAnswer } from "../../ai/answer.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { logger } from "../../lib/logger.js";
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
export type FullAnswerLocale = (typeof FULL_ANSWER_LOCALES)[number];
type AnswerEntry = {
  status: "QUEUED" | "RUNNING" | "READY" | "FAILED";
  at: string;
  error?: string;
  structured?: StructuredAnswer;
  sources?: { id: string; topicSlug: string; topicTitle: string; section: string }[];
  verification?: unknown;
};
/** A QUEUED/RUNNING answer older than this was lost (worker restart) and may be requested again. */
const STALE_MS = 5 * 60_000;

export const fullAnswerLocale = (locale: string | null | undefined): FullAnswerLocale =>
  (FULL_ANSWER_LOCALES as readonly string[]).includes(locale ?? "") ? (locale as FullAnswerLocale) : "hinglish";

const INTERVIEW_RULES = [
  "INTERVIEW-QUESTION MODE: this is a question an interviewer will ask the candidate. `answer` is the complete model answer the candidate could give (structured, specific, 120–300 words), not a summary.",
  "If the question asks for types or categories, name the classification basis and cover every established category under it; never invent a universal count.",
  "`explanation.concept` teaches the underlying concept from first principles for a beginner, then `whyItWorks` goes one level deeper (internals).",
  "`examples`: one concrete worked example with input, what happens, and output. `followUps`: 2–4 likely follow-up questions WITH their answers.",
  "Use the <context> (why it is asked, the candidate's resume line, the points a strong answer covers) and make the answer cover every one of those points.",
];

/** Writes one language's entry atomically, so two languages generating at once can't overwrite each other. */
async function setEntry(questionId: string, lang: FullAnswerLocale, entry: AnswerEntry) {
  await prisma.$executeRaw`UPDATE "PrepQuestion" SET "fullAnswers" = jsonb_set(coalesce("fullAnswers", '{}'::jsonb), ARRAY[${lang}]::text[], ${JSON.stringify(entry)}::jsonb, true) WHERE id = ${questionId}`;
}

function view(entry: AnswerEntry | undefined, lang: FullAnswerLocale) {
  if (!entry) return null;
  // A saved answer is returned whatever the status: readable while a fresh one is written, or after a failed rewrite.
  const saved = !!entry.structured;
  return { status: entry.status, error: entry.error ?? null, language: lang, at: entry.at, ...(saved ? { structured: entry.structured, sources: entry.sources ?? [], verification: entry.verification, answer: toMarkdown(entry.structured!, []) } : {}) };
}

/** The saved answer (or its progress) for one language; null when never requested. */
export async function getFullAnswer(userId: string, planId: string, questionId: string, locale: string) {
  const q = await ownedQuestion(userId, planId, questionId);
  const lang = fullAnswerLocale(locale);
  return view(((q.fullAnswers ?? {}) as Record<string, AnswerEntry>)[lang], lang);
}

/**
 * Asks for a complete model answer (example, code, animatable diagram, answered follow-ups). Written
 * on the background worker — real answers can take minutes when the model is busy, longer than a
 * request may wait — then saved per language, so reopening it is instant and costs no AI quota.
 */
export async function requestFullAnswer(userId: string, planId: string, questionId: string, locale: string, opts: { regenerate?: boolean } = {}) {
  const q = await ownedQuestion(userId, planId, questionId);
  const lang = fullAnswerLocale(locale);
  const entry = ((q.fullAnswers ?? {}) as Record<string, AnswerEntry>)[lang];
  const inFlight = entry && (entry.status === "QUEUED" || entry.status === "RUNNING") && Date.now() - Date.parse(entry.at) < STALE_MS;
  if (inFlight || (entry?.status === "READY" && !opts.regenerate)) return view(entry, lang);
  // Keep a ready answer visible while a fresh one is written.
  const queued: AnswerEntry = { ...(entry?.status === "READY" ? entry : {}), status: "QUEUED", at: new Date().toISOString() };
  await setEntry(q.id, lang, queued);
  await enqueuePrep({ kind: "fullAnswer", questionId: q.id, lang });
  return view(queued, lang);
}

/** Worker: claims the QUEUED entry, writes the answer, saves it (or the failure). */
export async function runFullAnswer(questionId: string, lang: FullAnswerLocale) {
  const claimed = await prisma.$executeRaw`UPDATE "PrepQuestion" SET "fullAnswers" = jsonb_set("fullAnswers", ARRAY[${lang}, 'status']::text[], '"RUNNING"'::jsonb) WHERE id = ${questionId} AND "fullAnswers" #>> ARRAY[${lang}, 'status']::text[] = 'QUEUED'`;
  if (!claimed) return; // duplicate or stale job
  const q = await prisma.prepQuestion.findUniqueOrThrow({ where: { id: questionId }, include: { plan: { select: { id: true, userId: true } } } });
  const previous = ((q.fullAnswers ?? {}) as Record<string, AnswerEntry>)[lang];
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: q.plan.userId }, select: { codingLevel: true, goalRole: true } });
    const context = [
      `Skill: ${q.skill} · difficulty ${q.difficulty}/5`,
      q.why && `Why it is asked: ${q.why}`,
      q.evidence && `From the candidate's resume: "${q.evidence}"`,
      q.keyPoints.length ? `A strong answer covers:\n- ${q.keyPoints.join("\n- ")}` : "",
      q.followUps.length ? `Likely follow-ups:\n- ${q.followUps.join("\n- ")}` : "",
    ].filter(Boolean).join("\n");
    const { sources, mode } = await retrieveWithMode("", `${q.question} ${q.skill}`, lang);
    const result = await generateAnswer(
      { topicTitle: q.skill, question: q.question, context, extraRules: INTERVIEW_RULES, locale: lang, level: profile?.codingLevel ?? "BEGINNER", goal: profile?.goalRole ?? "crack the interview", mode: "solution", recentMistakes: [], timeoutMs: 150_000 },
      sources,
    );
    await setEntry(q.id, lang, { status: "READY", at: new Date().toISOString(), structured: result.structured, sources: result.sources, verification: { ...result.verification, retrieval: mode } });
    await logEvent(q.plan.userId, "prep_full_answer", { meta: { planId: q.plan.id, questionId: q.id, language: lang, grounded: result.verification.grounded } });
  } catch (e) {
    logger.error({ err: e, questionId, lang }, "Full answer failed");
    // A failed rewrite keeps the earlier answer readable.
    const keep = previous?.structured ? { structured: previous.structured, sources: previous.sources, verification: previous.verification } : {};
    await setEntry(q.id, lang, { ...keep, status: "FAILED", at: new Date().toISOString(), error: e instanceof AppError ? e.message : "Couldn't write the answer. Please try again." });
  }
}
