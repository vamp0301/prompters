import { prisma } from "../../lib/prisma.js";
import { resumeParsedSchema } from "./schemas.js";

const RISK_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/**
 * Everything the dashboard needs about the user's career prep in one owner-scoped call: the latest
 * resume decoded, the claims an interviewer will probe, and the latest Top-100 plan split by
 * priority and category. Read-only; no AI calls.
 */
export async function careerOverview(userId: string) {
  const [resume, plan, match, interview] = await Promise.all([
    prisma.careerResume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, label: true, createdAt: true, parsed: true, analyzedAt: true } }),
    prisma.prepPlan.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true, resumeId: true } }),
    prisma.jobMatch.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, score: true, missing: true, strong: true, job: { select: { title: true, company: true } } } }),
    prisma.interviewSession.findFirst({ where: { userId, readinessScore: { not: null } }, orderBy: { startedAt: "desc" }, select: { id: true, readinessScore: true, result: true, startedAt: true } }),
  ]);

  let resumeView = null;
  if (resume) {
    const parsed = resumeParsedSchema.safeParse(resume.parsed);
    const p = parsed.success ? parsed.data : null;
    const claims = await prisma.resumeClaim.findMany({ where: { resumeId: resume.id }, select: { id: true, claim: true, evidence: true, risk: true, skills: true } });
    resumeView = {
      id: resume.id,
      label: resume.label,
      createdAt: resume.createdAt,
      analyzed: !!resume.analyzedAt,
      name: p?.name ?? null,
      headline: p?.headline ?? null,
      experienceMonths: p?.totalExperienceMonths ?? 0,
      skills: p?.skills ?? null,
      projects: (p?.projects ?? []).map((x) => ({ name: x.name, description: x.description, technologies: x.technologies })),
      experience: (p?.experience ?? []).map((x) => ({ role: x.role, company: x.company, months: x.months ?? null })),
      education: p?.education ?? [],
      achievements: [...(p?.achievements ?? []), ...(p?.certifications ?? [])],
      claims: claims.sort((a, b) => (RISK_ORDER[a.risk] ?? 3) - (RISK_ORDER[b.risk] ?? 3)).slice(0, 8),
      claimCount: claims.length,
    };
  }

  let planView = null;
  if (plan) {
    const ready = plan.status === "READY";
    const [byPriority, byCategory, byStatus, intense, skills] = ready
      ? await Promise.all([
          prisma.prepQuestion.groupBy({ by: ["priority"], where: { planId: plan.id }, _count: true }),
          prisma.prepQuestion.groupBy({ by: ["category"], where: { planId: plan.id }, _count: true }),
          prisma.prepQuestion.groupBy({ by: ["status"], where: { planId: plan.id }, _count: true }),
          prisma.prepQuestion.findMany({ where: { planId: plan.id, priority: "INTENSE" }, orderBy: { rank: "asc" }, take: 5, select: { id: true, rank: true, question: true, skill: true, category: true } }),
          prisma.prepQuestion.groupBy({ by: ["skill", "status"], where: { planId: plan.id }, _count: true }),
        ])
      : [[], [], [], [], []];
    const topics = new Map<string, { topic: string; total: number; confident: number }>();
    for (const s of skills) {
      const key = s.skill.trim().toLowerCase();
      const t = topics.get(key) ?? { topic: s.skill.trim(), total: 0, confident: 0 };
      t.total += s._count;
      if (s.status === "CONFIDENT") t.confident += s._count;
      topics.set(key, t);
    }
    const count = (rows: { _count: number }[]) => rows.reduce((a, r) => a + r._count, 0);
    planView = {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      createdAt: plan.createdAt,
      total: count(byPriority),
      byPriority: Object.fromEntries(byPriority.map((r) => [r.priority, r._count])),
      byCategory: Object.fromEntries(byCategory.map((r) => [r.category, r._count])),
      practice: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      intense,
      topics: [...topics.values()].sort((a, b) => b.total - a.total).slice(0, 10),
    };
  }

  return { resume: resumeView, plan: planView, match, interview };
}
