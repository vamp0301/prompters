import type { InterviewTurn, Prisma } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import { turnScore } from "../career/interview.report.js";
import type { Evaluation } from "../career/schemas.js";
import { logEvent } from "../platform/events.js";
import { canonicalSkill } from "../prep/text.js";
import { levelOf } from "./model.js";

/**
 * Manisha → personalization. One structured event per evaluated answer and per follow-up, so the
 * skill state and the outcome labels can use interview evidence answer by answer. Only scores and
 * structure are logged — never the transcript, code or audio (those stay in the interview tables).
 * Logging never blocks or breaks the interview.
 */

const unit = (x: number | undefined | null) => (typeof x === "number" ? Math.round((x / 10) * 1000) / 1000 : null);

type TurnLike = Pick<InterviewTurn, "id" | "kind" | "parentId" | "skill" | "area" | "category" | "level" | "durationSec" | "sessionId">;

export function answerEvaluatedMeta(turn: TurnLike, result: { evaluation: Evaluation | null; codeResult: { passed: number; total: number } | null; skipped: boolean; excluded: boolean }, previousTurns: Pick<InterviewTurn, "id" | "kind" | "parentId">[]) {
  const rootId = turn.kind === "FOLLOW_UP" || turn.kind === "REPEAT" ? (turn.parentId ?? turn.id) : turn.id;
  const e = result.evaluation;
  const key = canonicalSkill(turn.skill);
  const score = result.excluded ? null : turnScore({ kind: turn.kind, skipped: result.skipped, evaluation: e as unknown as Prisma.JsonValue, codeResult: result.codeResult as unknown as Prisma.JsonValue }) / 100;
  return {
    sessionId: turn.sessionId,
    turnId: turn.id,
    conceptId: key ? `skill:${key}` : null,
    skill: turn.skill,
    area: turn.area,
    category: turn.category,
    questionKind: turn.kind,
    level: turn.level,
    difficulty: levelOf(Math.min(5, turn.level + 1)),
    correctness: unit(e?.correctness),
    completeness: unit(e?.completeness),
    depth: unit(e?.depth ?? e?.understanding),
    reasoning: unit(e?.reasoning ?? e?.understanding),
    understanding: unit(e?.understanding),
    practical: unit(e?.practical),
    verdict: e?.verdict ?? null,
    testsPassed: result.codeResult?.passed ?? null,
    testsTotal: result.codeResult?.total ?? null,
    // null when the answer isn't scored (an unclear transcript is asked again, not marked wrong).
    answerScore: score === null ? null : Math.round(score * 1000) / 1000,
    skipped: result.skipped,
    excluded: result.excluded,
    isFollowUp: turn.kind === "FOLLOW_UP",
    followUpCount: previousTurns.filter((t) => t.parentId === rootId && t.kind === "FOLLOW_UP").length,
    durationSec: turn.durationSec ?? null,
  };
}

export function recordAnswerEvaluated(userId: string, ...args: Parameters<typeof answerEvaluatedMeta>) {
  void logEvent(userId, "interview_answer_evaluated", { meta: answerEvaluatedMeta(...args) }).catch((e) => logger.warn({ err: e }, "Couldn't log interview answer event"));
}

export function recordFollowUp(userId: string, followUp: Pick<InterviewTurn, "id" | "sessionId" | "parentId" | "skill" | "level">) {
  const key = canonicalSkill(followUp.skill);
  void logEvent(userId, "interview_followup", {
    meta: { sessionId: followUp.sessionId, turnId: followUp.id, parentTurnId: followUp.parentId, conceptId: key ? `skill:${key}` : null, skill: followUp.skill, level: followUp.level },
  }).catch((e) => logger.warn({ err: e }, "Couldn't log interview follow-up event"));
}
