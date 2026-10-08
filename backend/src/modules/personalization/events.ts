/**
 * Normalized student events. The existing LearningEvent log is the event store; every event is
 * also stamped with a normalized name and the entity it is about, so features can be rebuilt
 * from the database alone. Scores and outcomes are never taken from the client — they come from
 * the server-side records (quiz attempts, submissions, interview turns…).
 */

export const STUDENT_EVENTS = [
  "TOPIC_STARTED",
  "TOPIC_COMPLETED",
  "TOPIC_MASTERED",
  "TOPIC_REVISITED",
  "QUIZ_STARTED",
  "QUIZ_COMPLETED",
  "QUESTION_ANSWERED",
  "QUESTION_SKIPPED",
  "BUILD_STARTED",
  "BUILD_SUBMITTED",
  "BUILD_COMPLETED",
  "BUILD_FAILED",
  "REVISION_COMPLETED",
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "INTERVIEW_ANSWERED",
  "PROMPT_USED",
  "RESUME_UPLOADED",
  "JOB_VIEWED",
  "JOB_APPLIED",
] as const;
export type StudentEventType = (typeof STUDENT_EVENTS)[number];

export const ENTITY_TYPES = ["TOPIC", "QUIZ_ATTEMPT", "BUILD_TASK", "PREP_QUESTION", "PREP_PLAN", "INTERVIEW_SESSION", "INTERVIEW_QUESTION", "RESUME", "JOB", "PROMPT", "CONCEPT", "RECOMMENDATION"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Server-logged event type → normalized name and the meta key holding the entity id. */
const MAP: Record<string, { event: StudentEventType; entity: EntityType; idKey?: string }> = {
  topic_started: { event: "TOPIC_STARTED", entity: "TOPIC" },
  topic_read: { event: "TOPIC_COMPLETED", entity: "TOPIC" },
  mastery_achieved: { event: "TOPIC_MASTERED", entity: "TOPIC" },
  quiz_started: { event: "QUIZ_STARTED", entity: "QUIZ_ATTEMPT", idKey: "attemptId" },
  quiz_submitted: { event: "QUIZ_COMPLETED", entity: "QUIZ_ATTEMPT", idKey: "attemptId" },
  mock_test_started: { event: "QUIZ_STARTED", entity: "QUIZ_ATTEMPT", idKey: "attemptId" },
  mock_test_completed: { event: "QUIZ_COMPLETED", entity: "QUIZ_ATTEMPT", idKey: "attemptId" },
  review_completed: { event: "REVISION_COMPLETED", entity: "TOPIC" },
  review_failed: { event: "REVISION_COMPLETED", entity: "TOPIC" },
  build_started: { event: "BUILD_STARTED", entity: "BUILD_TASK", idKey: "task" },
  build_submitted: { event: "BUILD_SUBMITTED", entity: "BUILD_TASK", idKey: "task" },
  build_completed: { event: "BUILD_COMPLETED", entity: "BUILD_TASK", idKey: "task" },
  prompt_used: { event: "PROMPT_USED", entity: "PROMPT", idKey: "promptId" },
  interview_practiced: { event: "QUESTION_ANSWERED", entity: "INTERVIEW_QUESTION", idKey: "questionId" },
  prep_practice: { event: "QUESTION_ANSWERED", entity: "PREP_QUESTION", idKey: "questionId" },
  interview_started: { event: "INTERVIEW_STARTED", entity: "INTERVIEW_SESSION", idKey: "sessionId" },
  interview_completed: { event: "INTERVIEW_COMPLETED", entity: "INTERVIEW_SESSION", idKey: "sessionId" },
  application_added: { event: "JOB_APPLIED", entity: "JOB", idKey: "applicationId" },
  resume_uploaded: { event: "RESUME_UPLOADED", entity: "RESUME", idKey: "resumeId" },
};

/** Normalized fields for an event logged by the server (null fields when it has no personalization meaning). */
export function normalizeEvent(type: string, topicId: string | null | undefined, meta: unknown) {
  const m = MAP[type];
  if (!m) return { eventType: null, entityType: null, entityId: null };
  const record = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  // A failed build submission is its own event: the model needs failures, not just successes.
  const failedBuild = type === "build_submitted" && (record.passed === false || (typeof record.passedCount === "number" && typeof record.total === "number" && record.passedCount < record.total));
  const event = failedBuild ? "BUILD_FAILED" : m.event;
  const fromMeta = m.idKey && typeof record[m.idKey] === "string" ? (record[m.idKey] as string) : null;
  // Prefer the specific entity; fall back to the topic the event happened in.
  if (m.entity !== "TOPIC" && fromMeta) return { eventType: event, entityType: m.entity, entityId: fromMeta };
  const id = topicId ?? (m.entity === "TOPIC" ? fromMeta : null);
  return { eventType: event, entityType: id ? ("TOPIC" as EntityType) : null, entityId: id };
}

/**
 * Events the browser may report. Only low-stakes interaction signals: anything with a score or an
 * outcome is recorded by the server where it happens, so a student can't fake progress.
 */
export const CLIENT_EVENTS = ["TOPIC_REVISITED", "QUESTION_SKIPPED", "JOB_VIEWED"] as const satisfies readonly StudentEventType[];
export const CLIENT_ENTITY: Record<(typeof CLIENT_EVENTS)[number], EntityType[]> = {
  TOPIC_REVISITED: ["TOPIC"],
  QUESTION_SKIPPED: ["PREP_QUESTION", "INTERVIEW_QUESTION"],
  JOB_VIEWED: ["JOB"],
};
