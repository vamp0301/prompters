import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const scoringSchema = z.object({
  masteryThreshold: z.number().min(50).max(100),
  reviewIntervalsDays: z.array(z.number().int().positive()).min(1).max(12),
  stageExamPassingScore: z.number().min(0).max(100),
  stageGating: z.boolean(),
  topicGating: z.boolean(),
  quiz: z.object({
    masterySize: z.number().int().min(3).max(20),
    reviewSize: z.number().int().min(2).max(20),
    practiceSize: z.number().int().min(5).max(30),
  }),
  /** Points lost for using hint level 1, 2 and 3 (cumulative). */
  hintPenalties: z.tuple([z.number().min(0), z.number().min(0), z.number().min(0)]),
  minExplainScore: z.number().min(0).max(100),
  projectScoreWeights: z.object({ tests: z.number(), explanation: z.number(), independence: z.number() }),
  readinessWeights: z.object({
    mastery: z.number().min(0),
    projects: z.number().min(0),
    dsa: z.number().min(0),
    recall: z.number().min(0),
    interview: z.number().min(0),
    resume: z.number().min(0),
  }),
  /** Integrity score lost per logged event (tab switch, paste…). */
  integrityPenaltyPerEvent: z.number().min(0).max(50),
});

export type ScoringConfig = z.infer<typeof scoringSchema>;

export const DEFAULT_SCORING: ScoringConfig = {
  masteryThreshold: 80,
  reviewIntervalsDays: [1, 3, 7, 14, 30, 60, 90],
  stageExamPassingScore: 70,
  stageGating: true,
  topicGating: true,
  quiz: { masterySize: 5, reviewSize: 4, practiceSize: 10 },
  hintPenalties: [8, 10, 12],
  minExplainScore: 50,
  projectScoreWeights: { tests: 0.6, explanation: 0.25, independence: 0.15 },
  readinessWeights: { mastery: 30, projects: 20, dsa: 15, recall: 10, interview: 15, resume: 10 },
  integrityPenaltyPerEvent: 10,
};

let cache: { value: ScoringConfig; at: number } | undefined;

export async function getScoring(): Promise<ScoringConfig> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const row = await prisma.scoringConfig.findFirst({ where: { active: true }, orderBy: { version: "desc" } });
  const parsed = row ? scoringSchema.safeParse({ ...DEFAULT_SCORING, ...(row.config as object) }) : undefined;
  const value = parsed?.success ? parsed.data : DEFAULT_SCORING;
  cache = { value, at: Date.now() };
  return value;
}

export function invalidateScoring() {
  cache = undefined;
}

export function independenceFromHints(hintsUsed: number, cfg: ScoringConfig) {
  const lost = cfg.hintPenalties.slice(0, Math.min(3, hintsUsed)).reduce((a, b) => a + b, 0);
  return Math.max(0, 100 - lost);
}

export function nextReviewDate(step: number, cfg: ScoringConfig, from = new Date()) {
  const days = cfg.reviewIntervalsDays[Math.min(step, cfg.reviewIntervalsDays.length - 1)];
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
