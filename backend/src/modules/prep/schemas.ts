import { z } from "zod";

const str = (max = 300) => z.string().trim().max(max);
const list = (max = 30, item = 160) => z.array(str(item)).max(max).default([]);
const risk = z.preprocess((v) => (typeof v === "string" ? v.toUpperCase() : v), z.enum(["HIGH", "MEDIUM", "LOW"])).catch("MEDIUM");

export const CHUNK_TYPES = ["SUMMARY", "EXPERIENCE", "PROJECT", "ACHIEVEMENT", "EDUCATION", "CERTIFICATION", "OTHER"] as const;

/** LLM output for the resume-intelligence step (SKILL chunks are derived by code afterwards). */
export const intelligenceSchema = z.object({
  chunks: z
    .array(
      z.object({
        ref: str(10),
        type: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase() : v), z.enum(CHUNK_TYPES)).catch("OTHER"),
        section: z.coerce.number().int().min(0).max(50).default(0),
        title: str(160),
        summary: str(800).default(""),
        technologies: list(25, 60),
        risk,
        problem: str(400).nullable().optional(),
        architecture: str(400).nullable().optional(),
        features: list(10, 200),
        contribution: str(400).nullable().optional(),
        complexity: z.coerce.number().int().min(1).max(5).catch(3),
      }),
    )
    .max(40),
  claims: z
    .array(
      z.object({
        chunkRef: str(10).nullable().optional(),
        claim: str(400),
        evidence: str(500),
        skills: list(8, 60),
        confidence: risk,
        risk,
        depth: z.coerce.number().int().min(1).max(7).catch(3),
      }),
    )
    .max(40)
    .default([]),
});
export type IntelligenceAI = z.infer<typeof intelligenceSchema>;

/**
 * One generated question as the model returns it. Kept loose here (each item is
 * re-validated individually by the validator) so one bad item never sinks a batch.
 */
export const generatedQuestionSchema = z.object({
  question: str(600).pipe(z.string().min(1)),
  skill: str(80).pipe(z.string().min(1)),
  sourceRef: str(10).nullable().optional(),
  probability: z.coerce.number().min(0).max(1),
  difficulty: z.coerce.number().min(1).max(5).transform(Math.round),
  followUpDepth: z.coerce.number().min(1).max(7).transform(Math.round),
  why: str(400).pipe(z.string().min(1)),
  evidence: str(500).nullable().optional(),
  hint: str(500).pipe(z.string().min(1)),
  keyPoints: z.array(str(240)).min(1).max(8),
  followUps: z.array(str(300)).max(4).default([]),
});
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const questionBatchSchema = z.object({ questions: z.array(z.unknown()).max(40) });

/** Groups of question ids that ask the same thing (only groups of two or more). */
export const dedupeSchema = z.object({ groups: z.array(z.array(str(10)).max(20)).max(60).default([]) });

export const translationSchema = z.object({
  items: z
    .array(
      z.object({
        id: str(40),
        question: str(800),
        hint: str(700).default(""),
        why: str(600).default(""),
        keyPoints: list(8, 320),
        followUps: list(4, 400),
      }),
    )
    .max(30),
});
export type TranslationAI = z.infer<typeof translationSchema>;
