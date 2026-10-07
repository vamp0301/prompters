import { describe, expect, it } from "vitest";
import type { Question } from "@prisma/client";
import { gradeQuestion, scoreOf } from "../src/modules/quiz/grading.js";
import { keywordScore } from "../src/modules/platform/text.js";
import { DEFAULT_SCORING, independenceFromHints, nextReviewDate } from "../src/modules/platform/scoring.js";
import { parseCsv, toCsv } from "../src/modules/admin/content.routes.js";
import { Gemini } from "../src/ai/provider.js";

const q = (over: Partial<Question>): Question => ({
  id: "q", topicId: "t", type: "MCQ", difficulty: 1, prompt: "p", code: null, codeLanguage: null,
  options: ["a", "b", "c"], correct: [1], keywords: [], explanation: "e", tags: [], points: 1, status: "PUBLISHED",
  createdAt: new Date(), updatedAt: new Date(), ...over,
});

describe("grading", () => {
  it("maps displayed indices back through the option order", () => {
    const order = [2, 1, 0]; // displayed 1 shows original 1
    expect(gradeQuestion(q({}), order, 1).correct).toBe(true);
    expect(gradeQuestion(q({}), order, 0).correct).toBe(false);
    expect(gradeQuestion(q({}), order, 1).correctAnswer).toEqual([1]);
  });
  it("grades MULTI as an exact set", () => {
    const question = q({ type: "MULTI", correct: [0, 2] });
    expect(gradeQuestion(question, [0, 1, 2], [2, 0]).correct).toBe(true);
    expect(gradeQuestion(question, [0, 1, 2], [0]).correct).toBe(false);
  });
  it("grades ORDER_STEPS against the authored order", () => {
    const question = q({ type: "ORDER_STEPS", correct: null });
    const order = [2, 0, 1]; // displayed: third, first, second
    expect(gradeQuestion(question, order, [1, 2, 0]).correct).toBe(true);
    expect(gradeQuestion(question, order, [0, 1, 2]).correct).toBe(false);
  });
  it("gives partial credit for EXPLAIN by keywords", () => {
    const question = q({ type: "EXPLAIN", options: null, correct: null, keywords: ["cache", "memory", "fast", "ttl"] });
    const good = gradeQuestion(question, [], "A cache stores data in memory which makes repeated reads fast");
    expect(good.correct).toBe(true);
    expect(gradeQuestion(question, [], "no").correct).toBe(false);
  });
  it("computes percentage score", () => {
    expect(scoreOf([{ earned: 1, points: 1 }, { earned: 0, points: 1 }] as never)).toBe(50);
  });
});

describe("scoring rules", () => {
  it("independence drops 8/10/12 per hint level", () => {
    expect([0, 1, 2, 3, 4].map((h) => independenceFromHints(h, DEFAULT_SCORING))).toEqual([100, 92, 82, 70, 70]);
  });
  it("review intervals follow 1,3,7,14,30 days", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    expect(nextReviewDate(0, DEFAULT_SCORING, from).toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(nextReviewDate(2, DEFAULT_SCORING, from).toISOString()).toBe("2026-01-08T00:00:00.000Z");
    expect(nextReviewDate(99, DEFAULT_SCORING, from).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
  it("keyword rubric supports alternatives and penalises one-word answers", () => {
    expect(keywordScore("We hash passwords with bcrypt and a unique salt before storing", ["bcrypt|argon2", "salt"]).score).toBe(100);
    expect(keywordScore("bcrypt salt", ["bcrypt", "salt"]).score).toBeLessThan(50);
  });
});

describe("csv", () => {
  it("round-trips quotes, commas and newlines", () => {
    const csv = toCsv(["a", "b"], [["x, y", 'say "hi"\nnext']]);
    expect(parseCsv(csv)).toEqual([["a", "b"], ["x, y", 'say "hi"\nnext']]);
  });
});

describe("Gemini provider fallback", () => {
  const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

  it("falls back at once when a model hangs, and skips that model on the next call", async () => {
    const calls: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      const model = String(url).match(/models\/([^:]+):/)![1];
      calls.push(model);
      if (model === "slow-model") {
        // Never answers; only the abort signal ends it.
        return new Promise((_, reject) => init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason)));
      }
      return ok(`from ${model}`);
    }) as typeof fetch;
    try {
      const gemini = new Gemini("https://example.test", ["slow-model", "fast-model"], "key");
      const started = Date.now();
      expect(await gemini.complete("s", "u", { timeoutMs: 200 })).toBe("from fast-model");
      // One attempt at the hung model (no same-model retry), then the fallback.
      expect(calls).toEqual(["slow-model", "fast-model"]);
      expect(Date.now() - started).toBeLessThan(1500);
      // The hung model is skipped on the next request.
      expect(await gemini.complete("s", "u", { timeoutMs: 200 })).toBe("from fast-model");
      expect(calls).toEqual(["slow-model", "fast-model", "fast-model"]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
