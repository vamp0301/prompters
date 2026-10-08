import type { Recommendation } from "@prisma/client";
import { turnScore } from "../career/interview.report.js";
import { flattenTopics } from "../learning/path.service.js";
import { canonicalSkill } from "../prep/text.js";
import type { StudentData } from "./data.js";

/**
 * Whether a recommendation worked, judged only from what the student did afterwards in the
 * platform's own records (never from the client, never from a model). These are the training
 * labels: SUCCESS = they did it and did well; FAILURE = they tried and struggled.
 * null = not enough has happened yet to tell.
 */
export function outcomeOf(r: Pick<Recommendation, "action" | "itemId" | "createdAt">, d: StudentData): "SUCCESS" | "FAILURE" | null {
  const after = (t: Date | null | undefined) => !!t && t.getTime() > r.createdAt.getTime();
  switch (r.action) {
    case "LEARN_TOPIC":
    case "TAKE_QUIZ":
    case "REVISIT_PREREQUISITE": {
      const topic = flattenTopics(d.path.stages).find((t) => t.slug === r.itemId);
      if (!topic) return null;
      const tries = d.quizzes.filter((q) => q.topicId === topic.id && q.kind === "MASTERY" && after(q.finishedAt));
      if (tries.some((q) => q.passed)) return "SUCCESS";
      return tries.length >= 2 ? "FAILURE" : null;
    }
    case "REVISE_TOPIC": {
      const topic = flattenTopics(d.path.stages).find((t) => t.slug === r.itemId);
      const review = d.quizzes.filter((q) => q.topicId === topic?.id && q.kind === "REVIEW" && after(q.finishedAt)).at(-1);
      return review ? ((review.score ?? 0) >= 70 ? "SUCCESS" : "FAILURE") : null;
    }
    case "PRACTICE_QUESTION": {
      const a = d.prepAttempts.filter((x) => x.questionId === r.itemId && after(x.createdAt)).at(-1);
      return a ? (a.score >= 70 ? "SUCCESS" : "FAILURE") : null;
    }
    case "PRACTICE_SKILL": {
      const scores = [
        ...d.prepAttempts.filter((a) => canonicalSkill(a.question.skill) === r.itemId && after(a.createdAt)).map((a) => a.score / 100),
        ...d.turns.filter((t) => canonicalSkill(t.skill) === r.itemId && after(t.answeredAt)).map((t) => turnScore(t) / 100),
        ...d.concepts.filter((c) => c.skillKey === r.itemId && c.explainScore !== null && after(c.lastExplainedAt)).map((c) => c.explainScore! / 100),
      ];
      if (!scores.length) return null;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg >= 0.7) return "SUCCESS";
      return scores.length >= 2 ? "FAILURE" : null;
    }
    case "FINISH_BUILD": {
      const s = d.submissions.find((x) => x.buildTask.slug === r.itemId);
      return s && s.status !== "IN_PROGRESS" && after(s.completedAt) ? "SUCCESS" : null;
    }
    case "LEARN_CONCEPT": {
      const [skill, concept] = r.itemId.split("/");
      const c = d.concepts.find((x) => x.skillKey === skill && x.conceptKey === concept);
      if (!c || c.explainScore === null || !after(c.lastExplainedAt)) return null;
      return c.explainScore >= 75 ? "SUCCESS" : "FAILURE";
    }
    default:
      return null;
  }
}
