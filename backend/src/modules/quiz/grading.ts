import type { Question } from "@prisma/client";
import { shuffle } from "../../utils/random.js";
import { keywordScore } from "../platform/text.js";

export type Answer = number | number[] | string | null | undefined;

/** displayed index i shows original option order[i]. */
export type OptionOrder = number[];

export function makeOptionOrder(q: Pick<Question, "options">): OptionOrder {
  const n = Array.isArray(q.options) ? q.options.length : 0;
  return shuffle(Array.from({ length: n }, (_, i) => i));
}

/** What the learner sees: never includes correct answers or keywords. */
export function presentQuestion(q: Question, order: OptionOrder) {
  const options = (q.options as string[] | null) ?? [];
  return {
    id: q.id,
    type: q.type,
    difficulty: q.difficulty,
    prompt: q.prompt,
    code: q.code,
    codeLanguage: q.codeLanguage,
    points: q.points,
    options: order.map((i) => options[i]),
  };
}

export interface GradedQuestion {
  questionId: string;
  topicId: string;
  correct: boolean;
  earned: number;
  points: number;
  answer: Answer;
  /** Correct answer expressed in displayed indices (null for EXPLAIN). */
  correctAnswer: number[] | null;
  explanation: string;
  matched?: string[];
  missing?: string[];
  snapshot: { type: string; prompt: string; code: string | null; options: string[]; correct: unknown; keywords: string[] };
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

export function gradeQuestion(q: Question, order: OptionOrder, answer: Answer): GradedQuestion {
  const options = (q.options as string[] | null) ?? [];
  const correctOriginal = (q.correct as number[] | null) ?? [];
  const toDisplayed = (original: number) => order.indexOf(original);
  let correct: boolean;
  let earned: number;
  let correctAnswer: number[] | null = null;
  let matched: string[] | undefined;
  let missing: string[] | undefined;

  switch (q.type) {
    case "EXPLAIN": {
      const text = typeof answer === "string" ? answer : "";
      const r = keywordScore(text, q.keywords);
      matched = r.matched;
      missing = r.missing;
      earned = r.score / 100;
      correct = r.score >= 50;
      break;
    }
    case "ORDER_STEPS": {
      correctAnswer = options.map((_, i) => toDisplayed(i));
      const given = Array.isArray(answer) ? answer.map((d) => order[d]) : [];
      correct = given.length === options.length && given.every((orig, i) => orig === i);
      earned = correct ? 1 : 0;
      break;
    }
    case "MULTI": {
      correctAnswer = correctOriginal.map(toDisplayed);
      const given = Array.isArray(answer) ? answer.map((d) => order[d]).filter((v) => v !== undefined) : [];
      correct = sameSet(given, correctOriginal);
      earned = correct ? 1 : 0;
      break;
    }
    default: {
      correctAnswer = correctOriginal.map(toDisplayed);
      const given = typeof answer === "number" ? order[answer] : undefined;
      correct = given !== undefined && correctOriginal.includes(given);
      earned = correct ? 1 : 0;
    }
  }

  return {
    questionId: q.id,
    topicId: q.topicId,
    correct,
    earned: earned * q.points,
    points: q.points,
    answer: answer ?? null,
    correctAnswer,
    explanation: q.explanation,
    matched,
    missing,
    snapshot: { type: q.type, prompt: q.prompt, code: q.code, options, correct: q.correct, keywords: q.keywords },
  };
}

export function scoreOf(graded: GradedQuestion[]) {
  const total = graded.reduce((a, g) => a + g.points, 0);
  const earned = graded.reduce((a, g) => a + g.earned, 0);
  return total ? Math.round((earned / total) * 1000) / 10 : 0;
}
