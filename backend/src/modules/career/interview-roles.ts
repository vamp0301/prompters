import type { FamilyKey } from "../roles/catalogue.js";
import { roleDef } from "../roles/taxonomy.js";
import type { Area } from "./interview.blueprint.js";

/**
 * How Manisha interviews for a career: her title, the areas an interview covers and their weights,
 * the difficulty scale, whether behavioural questions belong, and whether coding exists at all.
 * Coding careers keep the original technical interview exactly.
 */
export interface InterviewProfile {
  /** Shown as Manisha's title. */
  title: string;
  /** Coding/problem turns and system design are part of the interview. */
  code: boolean;
  /** "technical interview" vs "interview". */
  interviewNoun: string;
  reportName: string;
  areaLabels: Record<Area, string>;
  weights: Partial<Record<Area, number>>;
  /** Area descriptions for the question-bank prompt. */
  areaGuide: string;
  scale: string;
  behavioural: boolean;
  /** How the evaluator introduces itself. */
  evaluator: string;
  dimensionLabels: { technical: string; projectUnderstanding: string; problemSolving: string; practicalEngineering: string; communication: string };
}

const TECH_LABELS: Record<Area, string> = {
  RESUME: "Resume & background",
  PROJECTS: "Projects",
  FUNDAMENTALS: "Core fundamentals",
  ROLE: "Role-specific knowledge",
  PRACTICAL: "Practical engineering",
  PROBLEM_SOLVING: "Problem solving",
  SYSTEM_DESIGN: "System & design thinking",
};

/** The original per-role weights for engineering interviews. */
const TECH_WEIGHTS: Record<string, Partial<Record<Area, number>>> = {
  backend: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.1 },
  frontend: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.3, PRACTICAL: 0.15, PROBLEM_SOLVING: 0.05, SYSTEM_DESIGN: 0.05 },
  fullstack: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.2, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.1 },
  sde: { RESUME: 0.05, PROJECTS: 0.15, FUNDAMENTALS: 0.2, ROLE: 0.15, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.25, SYSTEM_DESIGN: 0.1 },
  devops: { RESUME: 0.05, PROJECTS: 0.15, FUNDAMENTALS: 0.15, ROLE: 0.3, PRACTICAL: 0.2, PROBLEM_SOLVING: 0.05, SYSTEM_DESIGN: 0.1 },
  ml_engineer: { RESUME: 0.05, PROJECTS: 0.2, FUNDAMENTALS: 0.25, ROLE: 0.25, PRACTICAL: 0.1, PROBLEM_SOLVING: 0.1, SYSTEM_DESIGN: 0.05 },
};

const TECHNICAL: Omit<InterviewProfile, "weights"> = {
  title: "Senior Technical Interviewer",
  code: true,
  interviewNoun: "technical interview",
  reportName: "Technical Readiness Report",
  areaLabels: TECH_LABELS,
  areaGuide:
    "area: RESUME (background, 1-2 only), PROJECTS (resume projects/claims), FUNDAMENTALS (CS fundamentals), ROLE (role-specific knowledge), PRACTICAL (debugging, testing, deployment, real-world engineering), SYSTEM_DESIGN (design thinking applied to their projects). Cover every area.",
  scale: "1 Fundamental, 2 Practical, 3 Deep, 4 Scenario, 5 Architecture",
  behavioural: false,
  evaluator: "senior technical interviewer",
  // Same names the report has always shown for engineering interviews.
  dimensionLabels: { technical: "Technical", projectUnderstanding: "Project understanding", problemSolving: "Problem solving", practicalEngineering: "Practical engineering", communication: "Communication" },
};

const TITLE: Record<FamilyKey, string> = {
  software: "Senior Technical Interviewer",
  data: "Senior Analytics Interviewer",
  product: "Senior Product Interviewer",
  business: "Senior Case Interviewer",
  mba: "Senior Hiring Manager",
  sales: "Senior Sales Interviewer",
  design: "Senior Design Interviewer",
  other: "Senior Hiring Manager",
};

/** Non-coding careers: no coding problems and no system design; cases and scenarios instead. */
function roleInterview(family: FamilyKey): InterviewProfile {
  const behavioural = family !== "software" && family !== "data";
  return {
    title: TITLE[family],
    code: false,
    interviewNoun: "interview",
    reportName: "Interview Readiness Report",
    areaLabels: { ...TECH_LABELS, PROJECTS: "Projects & experience", FUNDAMENTALS: "Core concepts", PRACTICAL: "Cases & scenarios" },
    weights: { RESUME: 0.1, PROJECTS: 0.25, FUNDAMENTALS: 0.2, ROLE: 0.25, PRACTICAL: 0.2 },
    areaGuide: `area: RESUME (background${behavioural ? " and behavioural questions tied to their real experience" : ""}, 1-3), PROJECTS (resume projects, internships, claims), FUNDAMENTALS (the role's core concepts and methods), ROLE (role-specific knowledge and tools), PRACTICAL (realistic cases and scenarios in this role). Cover every area. Never coding or programming questions unless the role's skills list them.`,
    scale: "1 Fundamental, 2 Applied, 3 Deep reasoning, 4 Case or scenario, 5 Strategy and judgment",
    behavioural,
    evaluator: TITLE[family].toLowerCase(),
    dimensionLabels: { technical: "Subject knowledge", projectUnderstanding: "Experience & projects", problemSolving: "Case & problem solving", practicalEngineering: "Practical application", communication: "Communication" },
  };
}

/** The interview profile for a role key (null/unknown → the original full-stack technical interview). */
export function interviewProfile(roleKey: string | null | undefined): InterviewProfile {
  const role = roleDef(roleKey);
  if (!role || role.code) return { ...TECHNICAL, weights: TECH_WEIGHTS[role?.key ?? ""] ?? TECH_WEIGHTS.fullstack };
  return roleInterview(role.family);
}
