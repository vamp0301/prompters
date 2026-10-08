import type { Recommendation } from "@prisma/client";
import { turnScore } from "../career/interview.report.js";
import { flattenTopics } from "../learning/path.service.js";
import { canonicalSkill } from "../prep/text.js";
import type { StudentData } from "./data.js";

/**
 * What a student did with a recommendation, judged only from the platform's own records (never
 * from the client, never from a model):
 *
 *   SHOWN → (STARTED) → completed → SUCCESS          measurable improvement
 *                                 → NO_IMPROVEMENT   did it, didn't get better
 *         → STARTED → … expired   → ABANDONED        began, never finished
 *         → … expired             → NOT_ACTED_ON     shown, never started
 *
 * Training label: SUCCESS = 1; NO_IMPROVEMENT and ABANDONED = 0; NOT_ACTED_ON has no label (it says
 * nothing about whether the recommendation would have helped — it's an acceptance signal instead).
 */

export type OutcomeDetail = "STARTED" | "SUCCESS" | "NO_IMPROVEMENT" | "ABANDONED" | "NOT_ACTED_ON";
export const LABEL: Partial<Record<OutcomeDetail, "SUCCESS" | "FAILURE">> = { SUCCESS: "SUCCESS", NO_IMPROVEMENT: "FAILURE", ABANDONED: "FAILURE" };

/** Mastery must rise at least this much for "completed" to count as improvement. */
export const MIN_IMPROVEMENT = 0.05;

export interface Progress {
  started: boolean;
  completed: boolean;
  /** How it went, when completed. */
  good: boolean | null;
}

type Rec = Pick<Recommendation, "action" | "itemId" | "createdAt">;

export function progressOf(r: Rec, d: StudentData): Progress {
  const after = (t: Date | null | undefined) => !!t && t.getTime() > r.createdAt.getTime();
  const touched = (entityId: string | null | undefined, types: string[]) => d.events.some((e) => e.entityId === entityId && !!e.eventType && types.includes(e.eventType) && after(e.createdAt));
  const none: Progress = { started: false, completed: false, good: null };
  switch (r.action) {
    case "LEARN_TOPIC":
    case "TAKE_QUIZ":
    case "REVISIT_PREREQUISITE": {
      const topic = flattenTopics(d.path.stages).find((t) => t.slug === r.itemId);
      if (!topic) return none;
      const tries = d.quizzes.filter((q) => q.topicId === topic.id && q.kind === "MASTERY" && after(q.finishedAt));
      const passed = tries.some((q) => q.passed);
      const started = tries.length > 0 || touched(topic.id, ["TOPIC_STARTED", "TOPIC_COMPLETED", "QUIZ_STARTED"]);
      // Completed = passed, or tried twice (a real attempt that didn't land).
      return { started, completed: passed || tries.length >= 2, good: passed || tries.length >= 2 ? passed : null };
    }
    case "REVISE_TOPIC": {
      const topic = flattenTopics(d.path.stages).find((t) => t.slug === r.itemId);
      const review = d.quizzes.filter((q) => q.topicId === topic?.id && q.kind === "REVIEW" && after(q.finishedAt)).at(-1);
      return review ? { started: true, completed: true, good: (review.score ?? 0) >= 70 } : none;
    }
    case "PRACTICE_QUESTION": {
      const a = d.prepAttempts.filter((x) => x.questionId === r.itemId && after(x.createdAt)).at(-1);
      return a ? { started: true, completed: true, good: a.score >= 70 } : none;
    }
    case "PRACTICE_SKILL": {
      const scores = [
        ...d.prepAttempts.filter((a) => canonicalSkill(a.question.skill) === r.itemId && after(a.createdAt)).map((a) => a.score / 100),
        ...d.turns.filter((t) => canonicalSkill(t.skill) === r.itemId && after(t.answeredAt)).map((t) => turnScore(t) / 100),
        ...d.concepts.filter((c) => c.skillKey === r.itemId && c.explainScore !== null && after(c.lastExplainedAt)).map((c) => c.explainScore! / 100),
      ];
      if (!scores.length) return none;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const completed = scores.length >= 2 || avg >= 0.7;
      return { started: true, completed, good: completed ? avg >= 0.7 : null };
    }
    case "FINISH_BUILD": {
      const s = d.submissions.find((x) => x.buildTask.slug === r.itemId);
      if (!s) return none;
      const done = s.status !== "IN_PROGRESS" && after(s.completedAt);
      return { started: done || after(s.updatedAt), completed: done, good: done ? true : null };
    }
    case "LEARN_CONCEPT": {
      const [skill, concept] = r.itemId.split("/");
      const c = d.concepts.find((x) => x.skillKey === skill && x.conceptKey === concept);
      if (!c) return none;
      if (c.explainScore !== null && after(c.lastExplainedAt)) return { started: true, completed: true, good: c.explainScore >= 75 };
      return { started: after(c.updatedAt), completed: false, good: null };
    }
    default:
      return none;
  }
}

/**
 * Final outcome once a recommendation is completed. Improvement = the concept's mastery now minus
 * its mastery when it was recommended. A revision succeeds by being remembered (no gain needed);
 * a finished build is its own proof; everything else must show a measurable gain.
 */
export function completedOutcome(action: string, good: boolean, improvement: number | null): "SUCCESS" | "NO_IMPROVEMENT" {
  if (!good) return "NO_IMPROVEMENT";
  if (action === "REVISE_TOPIC" || action === "FINISH_BUILD") return "SUCCESS";
  return improvement === null || improvement >= MIN_IMPROVEMENT ? "SUCCESS" : "NO_IMPROVEMENT";
}
