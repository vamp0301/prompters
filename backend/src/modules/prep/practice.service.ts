import type { Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { turnScore } from "../career/interview.service.js";
import { prompts } from "../career/prompts.js";
import { evaluationSchema } from "../career/schemas.js";

export const PRACTICE_STATUSES = ["NEW", "PRACTICED", "CONFIDENT"] as const;
const CONFIDENT_SCORE = 70;

async function ownedQuestion(userId: string, planId: string, questionId: string) {
  const q = await prisma.prepQuestion.findFirst({ where: { id: questionId, planId, plan: { userId } } });
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
  const { translations: _t, ...rest } = q;
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
