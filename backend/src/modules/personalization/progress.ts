import { prisma } from "../../lib/prisma.js";
import { turnScore } from "../career/interview.report.js";
import { canonicalSkill } from "../prep/text.js";

/**
 * The loop made visible: per skill, the student's last interview vs the one before, and which
 * recommendations on that skill they completed in between. Scores come only from Manisha's
 * evaluated answers; nothing is estimated.
 */
export async function interviewProgress(userId: string) {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId, turns: { some: { answeredAt: { not: null }, excluded: false } } },
    orderBy: { startedAt: "desc" },
    take: 2,
    select: { id: true, startedAt: true, endedAt: true, status: true, turns: { where: { answeredAt: { not: null }, excluded: false }, select: { skill: true, kind: true, skipped: true, evaluation: true, codeResult: true, answeredAt: true } } },
  });
  const bySkill = (s: (typeof sessions)[number]) => {
    const m = new Map<string, { label: string; scores: number[] }>();
    for (const t of s.turns) {
      const k = canonicalSkill(t.skill);
      if (!k) continue;
      const e = m.get(k) ?? { label: t.skill, scores: [] };
      e.scores.push(turnScore(t) / 100);
      m.set(k, e);
    }
    return new Map([...m].map(([k, v]) => [k, { label: v.label, score: Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 1000) / 1000, answers: v.scores.length }]));
  };
  const [latest, previous] = sessions;
  if (!latest) return { interviews: 0, latest: null, previous: null, skills: [] };
  const now = bySkill(latest);
  const before = previous ? bySkill(previous) : new Map<string, { label: string; score: number; answers: number }>();
  const between = previous
    ? await prisma.recommendation.findMany({
        where: { userId, outcomeDetail: { in: ["SUCCESS", "NO_IMPROVEMENT"] }, resolvedAt: { gte: previous.endedAt ?? previous.startedAt, lte: latest.startedAt } },
        select: { id: true, title: true, action: true, outcomeDetail: true, features: true },
      })
    : [];
  const keys = [...new Set([...now.keys(), ...before.keys()])];
  return {
    interviews: sessions.length,
    latest: { id: latest.id, at: latest.startedAt },
    previous: previous ? { id: previous.id, at: previous.startedAt } : null,
    skills: keys
      .map((k) => {
        const a = before.get(k);
        const b = now.get(k);
        return {
          skill: k,
          label: (b ?? a)!.label,
          previous: a?.score ?? null,
          latest: b?.score ?? null,
          change: a && b ? Math.round((b.score - a.score) * 1000) / 1000 : null,
          // What the student completed on this skill between the two interviews.
          completedBetween: between.filter((r) => (r.features as { conceptId?: string } | null)?.conceptId === `skill:${k}`).map((r) => ({ id: r.id, title: r.title, action: r.action, outcome: r.outcomeDetail })),
        };
      })
      .sort((x, y) => (y.change ?? -2) - (x.change ?? -2) || (x.latest ?? 1) - (y.latest ?? 1)),
  };
}
