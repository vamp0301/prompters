import { z } from "zod";

const str = (max = 300) => z.string().trim().max(max);
const list = (max = 60, item = 120) => z.array(str(item)).max(max).default([]);
const score100 = z.coerce.number().min(0).max(100);
const score10 = z.coerce.number().min(0).max(10);

export const resumeParsedSchema = z.object({
  name: str(120).nullable().optional(),
  headline: str(200).nullable().optional(),
  totalExperienceMonths: z.coerce.number().min(0).max(600).default(0),
  skills: z
    .object({
      languages: list(),
      frameworks: list(),
      databases: list(),
      cloud: list(),
      devops: list(),
      other: list(),
    })
    .default({}),
  experience: z
    .array(z.object({ role: str(160), company: str(160), months: z.coerce.number().min(0).max(600).nullable().optional(), highlights: list(12, 400) }))
    .max(20)
    .default([]),
  projects: z
    .array(z.object({ name: str(160), description: str(800).default(""), technologies: list(25), claims: list(10, 400) }))
    .max(20)
    .default([]),
  education: z.array(z.object({ degree: str(200), institution: str(200), year: str(20).nullable().optional() })).max(10).default([]),
  certifications: list(20, 200),
  achievements: list(20, 300),
  links: list(10, 300),
});
export type ResumeParsed = z.infer<typeof resumeParsedSchema>;

export const jobParsedSchema = z.object({
  title: str(160),
  company: str(160).nullable().optional(),
  seniority: str(60).nullable().optional(),
  requiredSkills: list(),
  preferredSkills: list(),
  requiredExperienceMonths: z.coerce.number().min(0).max(600).nullable().optional(),
  responsibilities: list(30, 400),
  technologies: z
    .object({ languages: list(), frameworks: list(), databases: list(), cloud: list(), devops: list() })
    .default({}),
  systemDesign: z.boolean().default(false),
  aiMl: z.boolean().default(false),
  softRequirements: list(20, 300),
});
export type JobParsed = z.infer<typeof jobParsedSchema>;

export const QUESTION_CATEGORIES = ["IMPORTANT", "GOOD", "BETTER", "MAY_BE_ASKED", "CONCEPTUAL"] as const;
export const RISK = ["HIGH", "MEDIUM", "LOW"] as const;

export const matchSchema = z.object({
  breakdown: z.object({
    requiredSkills: score100,
    technicalStack: score100,
    experience: score100,
    projects: score100,
    keywords: score100,
    responsibilities: score100,
    education: score100,
  }),
  strong: list(40),
  missing: list(40),
  risks: z.array(z.object({ severity: z.enum(RISK), message: str(400) })).max(15).default([]),
  claims: z
    .array(
      z.object({
        id: str(40),
        claim: str(400),
        source: str(60).default("resume"),
        skills: list(10),
        risk: z.enum(RISK),
        why: str(400),
      }),
    )
    .max(20)
    .default([]),
  questions: z
    .array(
      z.object({
        id: str(40),
        question: str(600),
        category: z.enum(QUESTION_CATEGORIES),
        level: z.coerce.number().int().min(1).max(5),
        skill: str(80),
        claimId: str(40).nullable().optional(),
        why: str(300).default(""),
      }),
    )
    .min(5)
    .max(40),
});
export type MatchAI = z.infer<typeof matchSchema>;
export type BankQuestion = MatchAI["questions"][number];

export const evaluationSchema = z.object({
  correctness: score10,
  completeness: score10,
  understanding: score10,
  practical: score10,
  communication: score10,
  /** Added later; older evaluations don't have them. */
  depth: score10.optional(),
  reasoning: score10.optional(),
  /** UNCLEAR = the transcript is garbled or cut off, not a weak answer — the question is asked again. */
  verdict: z.enum(["CORRECT", "PARTIAL", "INCORRECT", "NO_ANSWER", "UNCLEAR"]),
  conceptsMentioned: list(20, 80),
  missingConcepts: list(20, 80),
  unsupportedClaims: list(10, 200),
  followUp: z.object({ needed: z.boolean(), question: str(500).nullable().optional() }).default({ needed: false }),
  lead: str(140).default("Okay."),
});
export type Evaluation = z.infer<typeof evaluationSchema>;

/** Question bank for a role-only interview (no job description), grounded in the resume. */
export const roleBankSchema = z.object({
  questions: z
    .array(
      z.object({
        id: str(40),
        question: str(600),
        area: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase() : v), z.enum(["RESUME", "PROJECTS", "FUNDAMENTALS", "ROLE", "PRACTICAL", "SYSTEM_DESIGN"])).catch("ROLE"),
        level: z.coerce.number().int().min(1).max(5),
        skill: str(80),
        claimId: str(40).nullable().optional(),
        why: str(300).default(""),
      }),
    )
    .min(5)
    .max(40),
});

export const codeReviewSchema = z.object({
  understanding: score10,
  practical: score10,
  communication: score10,
  timeComplexity: str(60).default("unknown"),
  spaceComplexity: str(60).default("unknown"),
  edgeCases: list(10, 160),
  codeQuality: list(10, 200),
  lead: str(140).default("Thanks."),
});
export type CodeReview = z.infer<typeof codeReviewSchema>;
