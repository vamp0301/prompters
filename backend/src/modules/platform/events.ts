import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { normalizeEvent } from "../personalization/events.js";

export type EventType =
  | "signup"
  | "login"
  | "onboarding_completed"
  | "placement_completed"
  | "topic_started"
  | "topic_read"
  | "quiz_started"
  | "quiz_submitted"
  | "mastery_achieved"
  | "review_completed"
  | "review_failed"
  | "stage_passed"
  | "build_started"
  | "hint_used"
  | "code_run"
  | "build_submitted"
  | "build_completed"
  | "project_submitted"
  | "prompt_unlocked"
  | "prompt_used"
  | "interview_practiced"
  | "mock_test_started"
  | "mock_test_completed"
  | "readiness_milestone"
  | "application_added"
  | "offer_received"
  | "ai_explain"
  | "career_analysis"
  | "prep_plan_requested"
  | "prep_plan_ready"
  | "prep_stage_published"
  | "prep_practice"
  | "prep_pack_requested"
  | "interview_started"
  | "interview_completed"
  | "resume_uploaded"
  | "interview_answer_evaluated"
  | "interview_followup"
  | "project_viewed"
  | "project_fact_edited"
  | "project_test_started"
  | "project_test_completed"
  | "project_question_answered"
  | "project_followup_asked"
  | "project_skill_gap"
  | "project_reinterview_started"
  | "project_reinterview_completed";

export async function logEvent(
  userId: string,
  type: EventType,
  opts: { topicId?: string | null; meta?: Prisma.InputJsonValue } = {},
) {
  // Also stamped with the normalized personalization name and entity (see personalization/events.ts).
  await prisma.learningEvent.create({ data: { userId, type, topicId: opts.topicId ?? null, meta: opts.meta, ...normalizeEvent(type, opts.topicId, opts.meta) } });
}
