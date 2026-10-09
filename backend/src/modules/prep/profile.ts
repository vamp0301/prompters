import type { JobTarget, PrepCategory } from "@prisma/client";
import { jobParsedSchema, type JobParsed } from "../career/schemas.js";
import type { ResumeIntelligence } from "./intelligence.service.js";
import { resumeSkills } from "./intelligence.service.js";
import { ADVANCED_TOPICS, BAND_BRIEF, effectiveBand, type ExperienceBand } from "./ladder.js";
import type { FamilyKey } from "../roles/catalogue.js";
import { classifyRole } from "../roles/taxonomy.js";
import { prepBrief, type PrepBrief } from "./role-briefs.js";
import { targetRole, type TargetRoleKey } from "./roles.js";
import { canonicalSkill, skillMatcher } from "./text.js";
import type { Source } from "./validator.js";

/** CS fundamentals any Indian technical interview may touch, whatever the role. */
const BASE_CONCEPTS = ["Data structures", "Algorithms", "Time complexity", "OOP", "DBMS", "SQL", "Operating systems", "Networking", "HTTP", "Git", "Debugging", "Testing"];

/**
 * System design and DevOps are covered in every plan (user requirement): interviewers ask them of
 * every developer, applied to the candidate's own projects. They widen the accepted skill universe
 * and are spread across the CONCEPTUAL and SCENARIO batches.
 */
export const SYSTEM_DESIGN = ["System design", "Scalability", "Caching", "Load balancing", "Database scaling", "Message queues", "Rate limiting", "API design", "Consistency", "High availability"];
export const DEVOPS = ["DevOps", "Docker", "CI/CD", "Deployment", "Monitoring", "Logging", "Cloud", "Linux", "Kubernetes", "Infrastructure"];

/**
 * Infers the closest target role from a JD title so GENERAL/CONCEPTUAL questions have a role to lean
 * on: the career taxonomy first (any profession), then the original engineering patterns, then the
 * caller's fallback (the student's own target career).
 */
export function inferRole(title: string, fallback?: TargetRoleKey | null): TargetRoleKey {
  const c = classifyRole(title);
  if (!c.ambiguous && c.suggestions[0]) return c.suggestions[0].key;
  const t = title.toLowerCase();
  if (/full[\s-]?stack|mern|mean/.test(t)) return "fullstack";
  if (/front[\s-]?end|react|ui engineer|web developer/.test(t)) return "frontend";
  if (/back[\s-]?end|node|api|server/.test(t)) return "backend";
  if (/data analyst|business analyst|analytics/.test(t)) return "data_analyst";
  if (/devops|sre|site reliability|cloud|platform/.test(t)) return "devops";
  if (/\bml\b|machine learning|\bai\b|data scientist|deep learning/.test(t)) return "ml_engineer";
  return c.suggestions[0]?.key ?? fallback ?? "sde";
}

/** How the candidate is described to the model: their band plus their actual experience. */
export function levelFor(band: ExperienceBand, months: number, brief?: PrepBrief) {
  const exp = months <= 0 ? "no professional experience yet" : months < 12 ? `${months} months of experience` : `~${Math.round(months / 12)} years of experience`;
  return `${(brief?.bands ?? BAND_BRIEF)[band]} (${exp})`;
}

export interface CandidateProfile {
  /** The role the plan is written for, its family, and how questions are written for it. */
  roleKey: TargetRoleKey;
  family: FamilyKey;
  brief: PrepBrief;
  text: string;
  sources: Map<string, Source>;
  matchSkill: (skill: string) => string | null;
  target: string;
  targetSource: Source;
  /** Experience band the plan is pitched at (the job's seniority wins when it is higher). */
  band: ExperienceBand;
  level: string;
  counts: { projects: number; claims: number; achievements: number; skills: number; gapSkills: number };
  /** What was found on the resume, shown to the candidate while it is being read. */
  found: { skills: string[]; projects: string[] };
  gapSkills: string[];
  /** Per-category topics spread across parallel batches. */
  focus: Partial<Record<PrepCategory, string[]>>;
}

export function buildProfile(intel: ResumeIntelligence, target: { job: JobTarget | null; role: TargetRoleKey | null; fallbackRole?: TargetRoleKey | null }): CandidateProfile {
  const { parsed, chunks, claims } = intel;
  const sources = new Map<string, Source>();
  const refOf = new Map<string, string>();
  const lines: string[] = [];

  lines.push(`Headline: ${parsed.headline ?? "—"} · Experience: ${parsed.totalExperienceMonths} months`);
  if (parsed.education.length) lines.push(`Education: ${parsed.education.map((e) => `${e.degree}, ${e.institution}${e.year ? ` (${e.year})` : ""}`).join("; ")}`);
  const s = parsed.skills;
  lines.push(`Skills — languages: ${s.languages.join(", ") || "—"}; frameworks: ${s.frameworks.join(", ") || "—"}; databases: ${s.databases.join(", ") || "—"}; cloud: ${s.cloud.join(", ") || "—"}; devops: ${s.devops.join(", ") || "—"}; other: ${s.other.join(", ") || "—"}`);

  const skillChunks = chunks.filter((c) => c.type === "SKILL");
  const evidenced = skillChunks.filter((c) => ((c.meta as { evidence?: string[] } | null)?.evidence ?? []).length);
  if (evidenced.length) lines.push(`Skill evidence: ${evidenced.map((c) => `${c.title} ← ${((c.meta as { evidence: string[] }).evidence).join(", ")}`).join("; ")}`);

  const section = (title: string, prefix: string, items: typeof chunks, describe: (c: (typeof chunks)[number]) => string, type: (c: (typeof chunks)[number]) => Source["type"]) => {
    if (!items.length) return;
    lines.push(`\n${title}:`);
    items.forEach((c, i) => {
      const ref = `${prefix}${i + 1}`;
      refOf.set(c.id, ref);
      sources.set(ref, { type: type(c), label: c.title, evidence: c.text, chunkId: c.id });
      lines.push(`${ref} ${describe(c)}`);
    });
  };
  const workMeta = (c: (typeof chunks)[number]) => {
    const m = (c.meta ?? {}) as { problem?: string | null; architecture?: string | null; features?: string[]; contribution?: string | null; complexity?: number };
    return [
      `${c.title} [${c.technologies.join(", ")}] (probe risk ${c.risk}${m.complexity ? `, complexity ${m.complexity}/5` : ""})`,
      `   ${c.text}`,
      m.problem ? `   Problem: ${m.problem}` : "",
      m.architecture ? `   Architecture: ${m.architecture}` : "",
      m.features?.length ? `   Features: ${m.features.join("; ")}` : "",
      m.contribution ? `   Candidate's contribution: ${m.contribution}` : "",
    ].filter(Boolean).join("\n");
  };
  const projects = chunks.filter((c) => c.type === "PROJECT");
  const experience = chunks.filter((c) => c.type === "EXPERIENCE");
  const achievements = chunks.filter((c) => c.type === "ACHIEVEMENT" || c.type === "CERTIFICATION");
  section("PROJECTS", "P", projects, workMeta, () => "PROJECT");
  section("EXPERIENCE", "E", experience, workMeta, () => "EXPERIENCE");
  section("ACHIEVEMENTS & CERTIFICATIONS", "A", achievements, (c) => `${c.title}${c.text && c.text !== c.title ? ` — ${c.text}` : ""}`, (c) => (c.type === "CERTIFICATION" ? "CERTIFICATION" : "ACHIEVEMENT"));

  if (claims.length) {
    lines.push("\nCLAIMS (interviewable statements, with resume evidence):");
    claims.forEach((c, i) => {
      const ref = `C${i + 1}`;
      const where = c.chunkId ? refOf.get(c.chunkId) : undefined;
      sources.set(ref, { type: "CLAIM", label: c.claim, evidence: c.evidence, chunkId: c.chunkId ?? undefined, claimId: c.id });
      lines.push(`${ref}${where ? ` (${where})` : ""} [risk ${c.risk}, drill depth ${c.depth}] ${c.claim} — evidence: "${c.evidence}"`);
    });
  }

  // Target: the JD when given, else the chosen role. A JD still gets an inferred role for fundamentals.
  let job: JobParsed | null = null;
  let roleKey: TargetRoleKey;
  let targetText: string;
  let targetSource: Source;
  if (target.job) {
    job = jobParsedSchema.parse(target.job.parsed);
    roleKey = inferRole(`${target.job.title} ${job.title}`, target.fallbackRole);
    targetText = [
      `Job: ${target.job.title}${target.job.company ? ` at ${target.job.company}` : ""}${job.seniority ? ` (${job.seniority})` : ""}`,
      `Required skills: ${job.requiredSkills.join(", ") || "—"}`,
      `Preferred skills: ${job.preferredSkills.join(", ") || "—"}`,
      `Responsibilities: ${job.responsibilities.slice(0, 10).join("; ") || "—"}`,
      job.systemDesign ? "The role involves system design." : "",
    ].filter(Boolean).join("\n");
    targetSource = { type: "JOB", label: target.job.title, evidence: "" };
  } else {
    roleKey = target.role ?? target.fallbackRole ?? "sde";
    const r = targetRole(roleKey)!;
    targetText = `Target role: ${r.label} (no specific job description). Core skills for this role: ${r.skills.join(", ")}. Fundamentals interviewers cover: ${r.concepts.join(", ")}.`;
    targetSource = { type: "ROLE", label: r.label, evidence: "" };
  }
  const role = targetRole(roleKey)!;
  const brief = prepBrief(role.family, role.code);
  const band = effectiveBand(parsed.totalExperienceMonths, job);
  // Experienced candidates are drilled on a superset: the entry-level universe plus these topics.
  const experienced = band === "MID" || band === "SENIOR";
  const advanced = experienced && brief.developerFundamentals ? ADVANCED_TOPICS : [];
  // Developer fundamentals, system design and DevOps belong only to careers that involve coding.
  const developer = brief.developerFundamentals ? [...BASE_CONCEPTS, ...SYSTEM_DESIGN, ...DEVOPS] : [];

  const resumeSet = [...resumeSkills(parsed), ...chunks.flatMap((c) => c.technologies), ...claims.flatMap((c) => c.skills)];
  const jobSet = job ? [...job.requiredSkills, ...job.preferredSkills, ...Object.values(job.technologies).flat()] : [];
  const have = new Set(resumeSet.map(canonicalSkill));
  const gapSkills = job ? job.requiredSkills.filter((x) => !have.has(canonicalSkill(x))) : [];
  if (gapSkills.length) targetText += `\nRequired by the job but not evidenced on the resume: ${gapSkills.join(", ")}`;

  return {
    text: lines.join("\n"),
    sources,
    matchSkill: skillMatcher([...resumeSet, ...jobSet, ...role.skills, ...role.concepts, ...developer, ...advanced]),
    roleKey,
    family: role.family,
    brief,
    target: targetText,
    targetSource,
    band,
    level: levelFor(band, parsed.totalExperienceMonths, brief),
    focus: {
      SKILL: [...evidenced, ...skillChunks.filter((c) => !evidenced.includes(c))].map((c) => c.title).concat(gapSkills),
      PROJECT: [...sources.entries()].filter(([, v]) => v.type === "PROJECT" || v.type === "EXPERIENCE").map(([k, v]) => `${k} ${v.label}`),
      CLAIM: [...sources.entries()].filter(([, v]) => v.type === "CLAIM").map(([k, v]) => `${k} ${v.label}`),
      CONCEPTUAL: [...role.concepts, ...brief.conceptualExtra, ...advanced],
      SCENARIO: brief.scenarios(experienced),
    },
    found: {
      skills: [...evidenced, ...skillChunks.filter((c) => !evidenced.includes(c))].map((c) => c.title).slice(0, 16),
      projects: [...projects, ...experience].map((c) => c.title).slice(0, 8),
    },
    counts: { projects: projects.length + experience.length, claims: claims.length, achievements: achievements.length, skills: skillChunks.length, gapSkills: gapSkills.length },
    gapSkills,
  };
}
