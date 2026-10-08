import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ensureResumeIntelligence } from "../prep/intelligence.service.js";
import { normalize } from "../prep/text.js";
import { categoryOf, techInfo, techKey, techsMentioned, type TechCategory } from "./tech.js";

/**
 * Resume → projects. Each PROJECT and EXPERIENCE chunk the resume-intelligence step already
 * extracted becomes one Project Experience module (merged when a job entry describes a listed
 * project). Facts are pre-filled ONLY from the resume; everything unknown stays empty.
 */

/** The editable Project Facts panel. Unknown values stay null ("Not specified — edit this answer"). */
export const FACT_FIELDS = [
  { key: "project", label: "Project", group: "Basics" },
  { key: "role", label: "Candidate role", group: "Basics" },
  { key: "status", label: "Project status", group: "Basics", hint: "Production / Development / Internship / Personal" },
  { key: "duration", label: "Duration", group: "Basics" },
  { key: "teamSize", label: "Team size", group: "Basics" },
  { key: "users", label: "Users", group: "Basics" },
  { key: "contribution", label: "My contribution", group: "Ownership" },
  { key: "whatIBuilt", label: "What I personally built", group: "Ownership" },
  { key: "whatIDidNotBuild", label: "What I did NOT build", group: "Ownership" },
  { key: "frontend", label: "Frontend", group: "Stack" },
  { key: "backend", label: "Backend", group: "Stack" },
  { key: "language", label: "Language", group: "Stack" },
  { key: "database", label: "Database", group: "Stack" },
  { key: "cache", label: "Cache", group: "Stack" },
  { key: "ai", label: "AI", group: "Stack" },
  { key: "authentication", label: "Authentication", group: "Stack" },
  { key: "deployment", label: "Deployment", group: "Stack" },
  { key: "storage", label: "Storage", group: "Stack" },
  { key: "queue", label: "Queue", group: "Stack" },
  { key: "testing", label: "Testing", group: "Stack" },
  { key: "monitoring", label: "Monitoring", group: "Stack" },
  { key: "importantApis", label: "Important APIs", group: "Design" },
  { key: "importantData", label: "Important collections / tables", group: "Design" },
  { key: "whyDatabase", label: "Why the database was chosen", group: "Design" },
  { key: "whyMainTech", label: "Why the main technologies were chosen", group: "Design" },
  { key: "biggestChallenge", label: "Biggest challenge", group: "Story" },
  { key: "biggestOptimization", label: "Biggest optimization", group: "Story" },
  { key: "biggestBug", label: "Biggest bug", group: "Story" },
  { key: "performanceImprovement", label: "Performance improvement (measured)", group: "Story" },
  { key: "productionScale", label: "Production scale", group: "Story" },
  { key: "internalServices", label: "Internal services (separate services you call)", group: "Integrations", hint: "e.g. ML service, worker" },
  { key: "browserApis", label: "Browser APIs used", group: "Integrations", hint: "e.g. SpeechRecognition, getUserMedia" },
  { key: "implementedFallbacks", label: "Fallbacks you actually built", group: "Integrations", hint: "One per line, e.g. Redis down → read from database" },
  { key: "apiTesting", label: "API tests that exist", group: "Integrations" },
  { key: "apiMeasurements", label: "Measured API latency / error rate", group: "Integrations" },
] as const;
export type FactKey = (typeof FACT_FIELDS)[number]["key"];
export type Fact = { value: string | null; source: "RESUME" | "USER" | null };
export type Facts = Record<FactKey, Fact>;

const STACK_FIELD: Partial<Record<TechCategory, FactKey>> = {
  frontend: "frontend",
  styling: "frontend",
  backend: "backend",
  language: "language",
  database: "database",
  orm: "database",
  cache: "cache",
  ai: "ai",
  auth: "authentication",
  cloud: "deployment",
  devops: "deployment",
  storage: "storage",
  queue: "queue",
  testing: "testing",
};

type Chunk = Awaited<ReturnType<typeof ensureResumeIntelligence>>["chunks"][number];
type Claim = Awaited<ReturnType<typeof ensureResumeIntelligence>>["claims"][number];

export interface Evidence {
  chunks: { id: string; type: string; title: string; text: string }[];
  technologies: string[];
  problem: string | null;
  architecture: string | null;
  features: string[];
  contribution: string | null;
  claims: { id: string; claim: string; evidence: string }[];
  company: string | null;
  role: string | null;
}

const keyOf = (name: string) => normalize(name).replace(/\s+/g, "-").slice(0, 60) || "project";

/** "Software Engineer Intern @ Corescent Technologies (DoCrud)" → role, company, and the project in brackets. */
export function roleAndCompany(title: string) {
  const m = title.split(/\s+(?:@|at)\s+/i);
  if (m.length < 2) return { role: null, company: null, project: null };
  const rest = m.slice(1).join(" at ").trim();
  const bracket = rest.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return { role: m[0].trim(), company: (bracket ? bracket[1] : rest).trim() || null, project: bracket ? bracket[2].trim() : null };
}

/** Pre-filled facts: only what the resume states. Everything else null. */
export function resumeFacts(name: string, ev: Evidence, source: string): Facts {
  const facts = Object.fromEntries(FACT_FIELDS.map((f) => [f.key, { value: null, source: null }])) as Facts;
  const set = (k: FactKey, v: string | null | undefined) => {
    if (v && v.trim()) facts[k] = { value: v.trim().slice(0, 500), source: "RESUME" };
  };
  set("project", name);
  set("role", ev.role);
  if (source !== "PROJECT") set("status", /\bintern/i.test(ev.role ?? "") ? "Internship" : "Work experience");
  set("contribution", ev.contribution);
  const byField = new Map<FactKey, string[]>();
  for (const t of ev.technologies) {
    const cat = categoryOf(t);
    const field = cat ? STACK_FIELD[cat] : undefined;
    if (field) byField.set(field, [...(byField.get(field) ?? []), t]);
  }
  for (const [field, list] of byField) set(field, [...new Set(list)].join(", "));
  return facts;
}

function evidenceFrom(chunks: Chunk[], claims: Claim[]): Evidence {
  const meta = (c: Chunk) => (c.meta ?? {}) as { problem?: string | null; architecture?: string | null; features?: string[]; contribution?: string | null };
  const exp = chunks.find((c) => c.type === "EXPERIENCE");
  const rc = exp ? roleAndCompany(exp.title) : { role: null, company: null };
  const first = <T,>(f: (c: Chunk) => T | null | undefined) => chunks.map(f).find((x) => x) ?? null;
  const ids = new Set(chunks.map((c) => c.id));
  return {
    chunks: chunks.map((c) => ({ id: c.id, type: c.type, title: c.title, text: c.text })),
    technologies: [...new Set(chunks.flatMap((c) => c.technologies))],
    problem: first((c) => meta(c).problem),
    architecture: first((c) => meta(c).architecture),
    features: [...new Set(chunks.flatMap((c) => meta(c).features ?? []))].slice(0, 12),
    contribution: first((c) => meta(c).contribution),
    claims: claims.filter((c) => c.chunkId && ids.has(c.chunkId)).map((c) => ({ id: c.id, claim: c.claim, evidence: c.evidence })),
    company: rc.company,
    role: rc.role,
  };
}

/**
 * Creates/updates one module per resume project. Re-syncing refreshes resume-sourced facts and
 * evidence but never overwrites a fact the user edited.
 */
export async function syncProjects(userId: string, resumeId: string) {
  const intel = await ensureResumeIntelligence(resumeId);
  const projects = intel.chunks.filter((c) => c.type === "PROJECT");
  const jobs = intel.chunks.filter((c) => c.type === "EXPERIENCE");
  const groups = new Map<string, { name: string; chunks: Chunk[]; source: string }>();
  for (const p of projects) groups.set(keyOf(p.title), { name: p.title, chunks: [p], source: "PROJECT" });
  for (const j of jobs) {
    // A job entry that describes a listed project is the same project, seen from work experience.
    const text = normalize(`${j.title} ${j.text}`);
    const match = [...groups.values()].find((g) => g.source !== "EXPERIENCE" && normalize(g.name).length >= 3 && text.includes(normalize(g.name)));
    if (match) {
      match.chunks.push(j);
      match.source = "BOTH";
    } else {
      // A job entry naming its project ("… @ Company (DoCrud)") is a module named after the project.
      const named = roleAndCompany(j.title).project;
      groups.set(keyOf(named ?? j.title), { name: named ?? j.title, chunks: [j], source: "EXPERIENCE" });
    }
  }

  const existing = await prisma.projectExperience.findMany({ where: { resumeId }, include: { _count: { select: { tests: true } } } });
  const byKey = new Map(existing.map((e) => [e.key, e]));
  // Modules the resume no longer produces are removed — unless the user edited facts or took tests on them.
  const gone = existing.filter((e) => !groups.has(e.key) && e._count.tests === 0 && !Object.values((e.facts ?? {}) as Record<string, { source?: string }>).some((f) => f?.source === "USER"));
  if (gone.length) await prisma.projectExperience.deleteMany({ where: { id: { in: gone.map((e) => e.id) } } });
  for (const [key, g] of groups) {
    const evidence = evidenceFrom(g.chunks, intel.claims);
    const fresh = resumeFacts(g.name, evidence, g.source);
    const prev = byKey.get(key);
    const facts = prev ? mergeFacts(fresh, prev.facts as unknown as Facts) : fresh;
    const data = { name: g.name.slice(0, 160), source: g.source, company: evidence.company, role: evidence.role, evidence: evidence as unknown as Prisma.InputJsonValue, facts: facts as unknown as Prisma.InputJsonValue };
    if (prev) await prisma.projectExperience.update({ where: { id: prev.id }, data });
    else await prisma.projectExperience.create({ data: { userId, resumeId, key, ...data } });
  }
  return prisma.projectExperience.findMany({ where: { resumeId, userId }, orderBy: { createdAt: "asc" } });
}

/** User edits always win over resume values. */
export function mergeFacts(fromResume: Facts, current: Facts): Facts {
  const out = { ...fromResume };
  for (const f of FACT_FIELDS) if (current?.[f.key]?.source === "USER") out[f.key] = current[f.key];
  return out;
}

/** Technologies the project uses: resume technologies plus any the user listed in their stack facts. */
export function projectTechnologies(ev: Evidence, facts: Facts): string[] {
  const listed = (["frontend", "backend", "language", "database", "cache", "ai", "authentication", "deployment", "storage", "queue", "testing", "monitoring"] as FactKey[])
    .flatMap((k) => (facts[k]?.value ?? "").split(/[,/;]|\band\b/i))
    .map((x) => x.trim())
    .filter((x) => x && x.length <= 40);
  // Technologies the resume text names ("deployed on AWS EC2 with PM2") count even if the parser didn't list them.
  const named = [...techsMentioned([...ev.chunks.map((c) => `${c.title} ${c.text}`), ...ev.claims.map((c) => `${c.claim} ${c.evidence}`)].join("\n"))].map((k) => techInfo(k)?.name ?? k);
  const seen = new Set<string>();
  return [...ev.technologies, ...listed, ...named].filter((t) => {
    const k = techKey(t) ?? normalize(t);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
