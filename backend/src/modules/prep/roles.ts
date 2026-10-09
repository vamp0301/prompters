/**
 * Target roles for "No-JD mode". Each role lists the skills and fundamentals an
 * interviewer for that role is expected to cover; they widen the skill universe the
 * validator accepts and steer GENERAL / CONCEPTUAL questions.
 */
/** The original engineering roles keep their exact Top-100 lists (unchanged behaviour). */
const LEGACY_LISTS: Record<string, { label: string; skills: readonly string[]; concepts: readonly string[] }> = {
  backend: {
    label: "Backend Developer",
    skills: ["Node.js", "Express", "Python", "Java", "REST APIs", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Authentication", "JWT", "Docker", "Git", "Testing"],
    concepts: ["HTTP", "REST", "Databases", "Indexing", "Transactions", "Caching", "Authentication", "Authorization", "Concurrency", "API design", "Scalability", "System design", "Data structures", "Algorithms", "OOP", "Operating systems", "Networking", "Security"],
  },
  frontend: {
    label: "Frontend Developer",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Redux", "Tailwind CSS", "REST APIs", "Git", "Testing", "Accessibility"],
    concepts: ["DOM", "Browser rendering", "Event loop", "Closures", "Promises", "State management", "Performance", "Accessibility", "Responsive design", "Security", "HTTP", "Caching", "Data structures", "Algorithms"],
  },
  fullstack: {
    label: "Full Stack Developer",
    skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "REST APIs", "SQL", "PostgreSQL", "MongoDB", "Redis", "Authentication", "JWT", "Docker", "Git", "Testing"],
    concepts: ["HTTP", "REST", "Event loop", "State management", "Databases", "Indexing", "Caching", "Authentication", "Security", "Performance", "API design", "System design", "Data structures", "Algorithms", "OOP"],
  },
  sde: {
    label: "Software Engineer",
    skills: ["Java", "C++", "Python", "JavaScript", "SQL", "Git", "Data structures", "Algorithms", "OOP"],
    concepts: ["Data structures", "Algorithms", "Time complexity", "OOP", "Design patterns", "DBMS", "Operating systems", "Networking", "Concurrency", "System design", "Testing", "Recursion", "Dynamic programming"],
  },
  data_analyst: {
    label: "Data Analyst",
    skills: ["SQL", "Python", "Pandas", "NumPy", "Excel", "Power BI", "Tableau", "Statistics", "Data visualization", "Data cleaning"],
    concepts: ["Statistics", "Joins", "Aggregation", "Window functions", "Hypothesis testing", "Data cleaning", "Data visualization", "Probability", "A/B testing", "Data modeling", "KPIs"],
  },
  devops: {
    label: "DevOps Engineer",
    skills: ["Linux", "Bash", "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Git", "Nginx", "Monitoring", "Python"],
    concepts: ["Networking", "Containers", "Orchestration", "Infrastructure as code", "CI/CD", "Observability", "Security", "Scalability", "High availability", "Operating systems"],
  },
  ml_engineer: {
    label: "ML Engineer",
    skills: ["Python", "NumPy", "Pandas", "scikit-learn", "PyTorch", "TensorFlow", "SQL", "Machine learning", "Deep learning", "LLMs", "Docker"],
    concepts: ["Statistics", "Linear algebra", "Bias-variance", "Overfitting", "Regularization", "Evaluation metrics", "Feature engineering", "Neural networks", "Transformers", "Model deployment", "Data structures", "Algorithms"],
  },
} as const;

import { listRoles, roleDef } from "../roles/taxonomy.js";
import type { FamilyKey } from "../roles/catalogue.js";

/** Any active CareerRole key (roles can be added in the database). */
export type TargetRoleKey = string;

export interface TargetRole {
  key: string;
  label: string;
  family: FamilyKey;
  /** Whether coding questions/tasks may appear for this role. */
  code: boolean;
  /** Skills a question may be about (widen the validator's skill universe). */
  skills: string[];
  /** Fundamentals that steer GENERAL / CONCEPTUAL questions. */
  concepts: string[];
}

/** The role as Top-100 prep, interviews and personalization use it, from the career taxonomy. */
export function targetRole(key: string | null | undefined): TargetRole | null {
  const r = roleDef(key);
  if (!r || !r.active) return null;
  const legacy = LEGACY_LISTS[r.key];
  if (legacy) return { key: r.key, label: legacy.label, family: r.family, code: r.code, skills: [...legacy.skills], concepts: [...legacy.concepts] };
  const core = r.competencies.filter((c) => c.importance !== "OPTIONAL");
  return { key: r.key, label: r.name, family: r.family, code: r.code, skills: core.map((c) => c.name), concepts: core.filter((c) => c.kind !== "TOOL").map((c) => c.name) };
}

export const isTargetRole = (key: string | null | undefined): key is TargetRoleKey => !!targetRole(key);

export const roleOptions = () => listRoles().map((r) => ({ key: r.key, label: r.name, family: r.family, familyName: r.familyName }));
